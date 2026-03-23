const express = require('express');
const router = express.Router();
const { MaterialIssue, MaterialIssueItem, Stock, Item, Subcontractor, WorkItem, Location } = require('../models');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Generate issue number
const generateIssueNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `MI-${year}${month}-${random}`;
};

// Get all material issues
router.get('/', authMiddleware, async (req, res) => {
  try {
    const issues = await MaterialIssue.findAll({
      include: [
        { model: Subcontractor, as: 'subcontractor' },
        { model: WorkItem, as: 'workItem' },
        { model: Location, as: 'location' },
        { model: MaterialIssueItem, as: 'items', include: [{ model: Item, as: 'item' }] }
      ],
      order: [['date', 'DESC']]
    });
    res.json({ issues });
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({ error: 'Failed to get material issues' });
  }
});

// Get issue by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const issue = await MaterialIssue.findByPk(req.params.id, {
      include: [
        { model: Subcontractor, as: 'subcontractor' },
        { model: WorkItem, as: 'workItem' },
        { model: Location, as: 'location' },
        { model: MaterialIssueItem, as: 'items', include: [{ model: Item, as: 'item' }] }
      ]
    });
    
    if (!issue) {
      return res.status(404).json({ error: 'Material issue not found' });
    }
    
    res.json({ issue });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get material issue' });
  }
});

// Create material issue (Storekeeper/Admin) - CRITICAL FEATURE
router.post('/', authMiddleware, roleMiddleware('admin', 'storekeeper'), async (req, res) => {
  const transaction = await Stock.sequelize.transaction();
  
  try {
    const { subcontractorId, workItemId, locationId, notes, items } = req.body;

    // MANDATORY fields validation
    if (!subcontractorId) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Subcontractor is MANDATORY' });
    }
    if (!workItemId) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Work item (activity) is MANDATORY' });
    }
    if (!locationId) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Location is MANDATORY' });
    }
    if (!items || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'At least one item is required' });
    }

    // Create issue
    const issue = await MaterialIssue.create({
      issueNumber: generateIssueNumber(),
      subcontractorId,
      workItemId,
      locationId,
      notes,
      createdBy: req.user.id
    }, { transaction });

    // Process each item and decrease stock
    for (const itemData of items) {
      const { itemId, quantity } = itemData;

      // Check stock availability
      const stock = await Stock.findOne({
        where: { itemId, locationId },
        transaction
      });

      if (!stock || parseFloat(stock.quantity) < parseFloat(quantity)) {
        await transaction.rollback();
        return res.status(400).json({ 
          error: `Insufficient stock for item ${itemId}. Available: ${stock ? stock.quantity : 0}` 
        });
      }

      // Create issue item
      await MaterialIssueItem.create({
        materialIssueId: issue.id,
        itemId,
        quantity
      }, { transaction });

      // Decrease stock
      await stock.update({
        quantity: parseFloat(stock.quantity) - parseFloat(quantity),
        lastUpdated: new Date()
      }, { transaction });
    }

    await transaction.commit();
    
    const fullIssue = await MaterialIssue.findByPk(issue.id, {
      include: [
        { model: Subcontractor, as: 'subcontractor' },
        { model: WorkItem, as: 'workItem' },
        { model: Location, as: 'location' },
        { model: MaterialIssueItem, as: 'items', include: [{ model: Item, as: 'item' }] }
      ]
    });

    res.status(201).json({ message: 'Material issued successfully', issue: fullIssue });
  } catch (error) {
    await transaction.rollback();
    console.error('Create issue error:', error);
    res.status(500).json({ error: 'Failed to create material issue' });
  }
});

// Cancel issue (Admin/Storekeeper)
router.put('/:id/cancel', authMiddleware, roleMiddleware('admin', 'storekeeper'), async (req, res) => {
  const transaction = await Stock.sequelize.transaction();
  
  try {
    const issue = await MaterialIssue.findByPk(req.params.id, {
      include: [{ model: MaterialIssueItem, as: 'items' }],
      transaction
    });

    if (!issue) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Issue not found' });
    }

    if (issue.status === 'cancelled') {
      await transaction.rollback();
      return res.status(400).json({ error: 'Issue already cancelled' });
    }

    // Return stock
    for (const item of issue.items) {
      const stock = await Stock.findOne({
        where: { itemId: item.itemId, locationId: issue.locationId },
        transaction
      });

      if (stock) {
        await stock.update({
          quantity: parseFloat(stock.quantity) + parseFloat(item.quantity),
          lastUpdated: new Date()
        }, { transaction });
      }
    }

    await issue.update({ status: 'cancelled' }, { transaction });
    await transaction.commit();

    res.json({ message: 'Issue cancelled successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Cancel issue error:', error);
    res.status(500).json({ error: 'Failed to cancel material issue' });
  }
});

// Get issues by subcontractor
router.get('/subcontractor/:subcontractorId', authMiddleware, async (req, res) => {
  try {
    const issues = await MaterialIssue.findAll({
      where: { subcontractorId: req.params.subcontractorId },
      include: [
        { model: Subcontractor, as: 'subcontractor' },
        { model: WorkItem, as: 'workItem' },
        { model: Location, as: 'location' },
        { model: MaterialIssueItem, as: 'items', include: [{ model: Item, as: 'item' }] }
      ],
      order: [['date', 'DESC']]
    });
    res.json({ issues });
  } catch (error) {
    console.error('Get subcontractor issues error:', error);
    res.status(500).json({ error: 'Failed to get subcontractor issues' });
  }
});

module.exports = router;
