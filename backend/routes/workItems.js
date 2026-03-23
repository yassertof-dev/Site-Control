const express = require('express');
const router = express.Router();
const { WorkItem, ConsumptionRate, Item } = require('../models');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Get all work items
router.get('/', authMiddleware, async (req, res) => {
  try {
    const workItems = await WorkItem.findAll({
      where: { isActive: true },
      include: [{
        model: ConsumptionRate,
        as: 'consumptionRates',
        include: [{ model: Item, as: 'item' }]
      }],
      order: [['name', 'ASC']]
    });
    res.json({ workItems });
  } catch (error) {
    console.error('Get work items error:', error);
    res.status(500).json({ error: 'Failed to get work items' });
  }
});

// Get work item by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const workItem = await WorkItem.findByPk(req.params.id, {
      include: [{
        model: ConsumptionRate,
        as: 'consumptionRates',
        include: [{ model: Item, as: 'item' }]
      }]
    });
    
    if (!workItem) {
      return res.status(404).json({ error: 'Work item not found' });
    }
    
    res.json({ workItem });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get work item' });
  }
});

// Create work item (Admin)
router.post('/', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { name, nameAr, unit, description } = req.body;

    const workItem = await WorkItem.create({
      name,
      nameAr,
      unit,
      description
    });

    res.status(201).json({ message: 'Work item created successfully', workItem });
  } catch (error) {
    console.error('Create work item error:', error);
    res.status(500).json({ error: 'Failed to create work item' });
  }
});

// Update work item (Admin)
router.put('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const workItem = await WorkItem.findByPk(req.params.id);
    
    if (!workItem) {
      return res.status(404).json({ error: 'Work item not found' });
    }

    const { name, nameAr, unit, description, isActive } = req.body;
    
    await workItem.update({
      name: name || workItem.name,
      nameAr: nameAr !== undefined ? nameAr : workItem.nameAr,
      unit: unit || workItem.unit,
      description: description !== undefined ? description : workItem.description,
      isActive: isActive !== undefined ? isActive : workItem.isActive
    });

    res.json({ message: 'Work item updated successfully', workItem });
  } catch (error) {
    console.error('Update work item error:', error);
    res.status(500).json({ error: 'Failed to update work item' });
  }
});

// Add consumption rate to work item
router.post('/:id/consumption-rates', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { itemId, ratePerUnit, wastePercentage } = req.body;

    const rate = await ConsumptionRate.create({
      workItemId: req.params.id,
      itemId,
      ratePerUnit,
      wastePercentage: wastePercentage || 0
    });

    res.status(201).json({ message: 'Consumption rate added successfully', rate });
  } catch (error) {
    console.error('Add consumption rate error:', error);
    res.status(500).json({ error: 'Failed to add consumption rate' });
  }
});

// Update consumption rate
router.put('/consumption-rates/:rateId', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const rate = await ConsumptionRate.findByPk(req.params.rateId);
    
    if (!rate) {
      return res.status(404).json({ error: 'Consumption rate not found' });
    }

    const { ratePerUnit, wastePercentage } = req.body;
    
    await rate.update({
      ratePerUnit: ratePerUnit !== undefined ? ratePerUnit : rate.ratePerUnit,
      wastePercentage: wastePercentage !== undefined ? wastePercentage : rate.wastePercentage
    });

    res.json({ message: 'Consumption rate updated successfully', rate });
  } catch (error) {
    console.error('Update consumption rate error:', error);
    res.status(500).json({ error: 'Failed to update consumption rate' });
  }
});

// Delete consumption rate
router.delete('/consumption-rates/:rateId', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const rate = await ConsumptionRate.findByPk(req.params.rateId);
    
    if (!rate) {
      return res.status(404).json({ error: 'Consumption rate not found' });
    }

    await rate.destroy();
    res.json({ message: 'Consumption rate deleted successfully' });
  } catch (error) {
    console.error('Delete consumption rate error:', error);
    res.status(500).json({ error: 'Failed to delete consumption rate' });
  }
});

module.exports = router;
