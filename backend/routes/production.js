const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { ProductionRecord, Subcontractor, WorkItem, Location, ConsumptionRate, Item, MaterialIssue, MaterialIssueItem } = require('../models');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Get all production records
router.get('/', authMiddleware, async (req, res) => {
  try {
    const records = await ProductionRecord.findAll({
      include: [
        { model: Subcontractor, as: 'subcontractor' },
        { model: WorkItem, as: 'workItem' },
        { model: Location, as: 'location' }
      ],
      order: [['date', 'DESC']]
    });
    res.json({ records });
  } catch (error) {
    console.error('Get production records error:', error);
    res.status(500).json({ error: 'Failed to get production records' });
  }
});

// Create production record (Site Engineer/Admin)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { date, subcontractorId, workItemId, locationId, quantityCompleted, notes } = req.body;

    const record = await ProductionRecord.create({
      date: date || new Date(),
      subcontractorId,
      workItemId,
      locationId,
      quantityCompleted,
      notes,
      createdBy: req.user.id
    });

    const fullRecord = await ProductionRecord.findByPk(record.id, {
      include: [
        { model: Subcontractor, as: 'subcontractor' },
        { model: WorkItem, as: 'workItem' },
        { model: Location, as: 'location' }
      ]
    });

    res.status(201).json({ message: 'Production recorded successfully', record: fullRecord });
  } catch (error) {
    console.error('Create production record error:', error);
    res.status(500).json({ error: 'Failed to create production record' });
  }
});

// MOST IMPORTANT: Consumption Analysis Report
router.get('/analysis/consumption', authMiddleware, async (req, res) => {
  try {
    const { subcontractorId, workItemId, startDate, endDate } = req.query;

    // Build where clause
    const whereClause = {};
    if (subcontractorId) whereClause.subcontractorId = subcontractorId;
    if (workItemId) whereClause.workItemId = workItemId;
    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Get production records
    const productions = await ProductionRecord.findAll({
      where: whereClause,
      include: [
        { model: Subcontractor, as: 'subcontractor' },
        { model: WorkItem, as: 'workItem' },
        { model: Location, as: 'location' }
      ]
    });

    const analysis = [];

    for (const production of productions) {
      // Get consumption rates for this work item
      const consumptionRates = await ConsumptionRate.findAll({
        where: { workItemId: production.workItemId },
        include: [{ model: Item, as: 'item' }]
      });

      // Calculate expected consumption
      const expectedConsumption = [];
      for (const rate of consumptionRates) {
        const expectedQty = parseFloat(rate.ratePerUnit) * parseFloat(production.quantityCompleted);
        const wasteTolerance = parseFloat(rate.wastePercentage || 0) / 100;
        const maxAllowed = expectedQty * (1 + wasteTolerance);
        
        expectedConsumption.push({
          itemId: rate.itemId,
          itemName: rate.item.name,
          unit: rate.item.unit,
          costPerUnit: rate.item.costPerUnit,
          expectedQuantity: expectedQty,
          wastePercentage: rate.wastePercentage,
          maxAllowedWithWaste: maxAllowed
        });
      }

      // Get actual issued materials for this subcontractor and work item
      const issues = await MaterialIssue.findAll({
        where: {
          subcontractorId: production.subcontractorId,
          workItemId: production.workItemId,
          status: 'completed'
        },
        include: [{
          model: MaterialIssueItem,
          as: 'items',
          include: [{ model: Item, as: 'item' }]
        }]
      });

      // Sum actual issued quantities by item
      const actualConsumption = {};
      for (const issue of issues) {
        for (const issueItem of issue.items) {
          const itemId = issueItem.itemId;
          if (!actualConsumption[itemId]) {
            actualConsumption[itemId] = {
              itemId,
              itemName: issueItem.item.name,
              unit: issueItem.item.unit,
              costPerUnit: issueItem.item.costPerUnit,
              quantity: 0
            };
          }
          actualConsumption[itemId].quantity += parseFloat(issueItem.quantity);
        }
      }

      // Compare expected vs actual
      const comparison = expectedConsumption.map(exp => {
        const actual = actualConsumption[exp.itemId] || { quantity: 0 };
        const variance = actual.quantity - exp.expectedQuantity;
        const variancePercent = exp.expectedQuantity > 0 ? (variance / exp.expectedQuantity) * 100 : 0;
        const isOveruse = variance > exp.maxAllowedWithWaste - exp.expectedQuantity;
        const financialImpact = variance * parseFloat(exp.costPerUnit);

        return {
          itemId: exp.itemId,
          itemName: exp.itemName,
          unit: exp.unit,
          expectedQuantity: parseFloat(exp.expectedQuantity.toFixed(2)),
          actualQuantity: parseFloat(actual.quantity.toFixed(2)),
          variance: parseFloat(variance.toFixed(2)),
          variancePercent: parseFloat(variancePercent.toFixed(2)),
          isOveruse,
          status: isOveruse ? 'overuse' : (variance < 0 ? 'saving' : 'normal'),
          financialImpact: parseFloat(financialImpact.toFixed(2)),
          costPerUnit: exp.costPerUnit,
          wastePercentage: exp.wastePercentage,
          maxAllowedWithWaste: parseFloat(exp.maxAllowedWithWaste.toFixed(2))
        };
      });

      analysis.push({
        productionId: production.id,
        subcontractor: production.subcontractor.name,
        workItem: production.workItem.name,
        location: production.location.name,
        productionQuantity: production.quantityCompleted,
        productionUnit: production.workItem.unit,
        date: production.date,
        consumptionDetails: comparison
      });
    }

    res.json({ analysis });
  } catch (error) {
    console.error('Consumption analysis error:', error);
    res.status(500).json({ error: 'Failed to generate consumption analysis' });
  }
});

// Summary report for dashboard
router.get('/analysis/summary', authMiddleware, async (req, res) => {
  try {
    const { subcontractorId } = req.query;

    const whereClause = subcontractorId ? { subcontractorId } : {};

    // Total production by work item
    const productionSummary = await ProductionRecord.findAll({
      where: whereClause,
      attributes: [
        'workItemId',
        [require('sequelize').fn('SUM', require('sequelize').col('quantityCompleted')), 'totalQuantity']
      ],
      group: ['workItemId'],
      include: [{ model: WorkItem, as: 'workItem' }]
    });

    // Total issued materials
    const issueWhereClause = subcontractorId ? { subcontractorId } : {};
    const issues = await MaterialIssue.findAll({
      where: { ...issueWhereClause, status: 'completed' },
      include: [{
        model: MaterialIssueItem,
        as: 'items'
      }]
    });

    const issuedSummary = {};
    for (const issue of issues) {
      for (const item of issue.items) {
        if (!issuedSummary[item.itemId]) {
          issuedSummary[item.itemId] = 0;
        }
        issuedSummary[item.itemId] += parseFloat(item.quantity);
      }
    }

    res.json({
      productionSummary,
      issuedSummary
    });
  } catch (error) {
    console.error('Summary analysis error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

module.exports = router;
