const express = require('express');
const router = express.Router();
const { Item, Stock, Location } = require('../models');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Get all items with stock info
router.get('/', authMiddleware, async (req, res) => {
  try {
    const items = await Item.findAll({
      where: { isActive: true },
      include: [{
        model: Stock,
        as: 'stocks',
        include: [{ model: Location, as: 'location' }]
      }],
      order: [['name', 'ASC']]
    });
    res.json({ items });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ error: 'Failed to get items' });
  }
});

// Get item by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id, {
      include: [{
        model: Stock,
        as: 'stocks',
        include: [{ model: Location, as: 'location' }]
      }]
    });
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json({ item });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get item' });
  }
});

// Create item (Admin/Storekeeper)
router.post('/', authMiddleware, roleMiddleware('admin', 'storekeeper'), async (req, res) => {
  try {
    const { name, nameAr, unit, category, minStock, costPerUnit } = req.body;

    const item = await Item.create({
      name,
      nameAr,
      unit,
      category,
      minStock: minStock || 0,
      costPerUnit: costPerUnit || 0
    });

    res.status(201).json({ message: 'Item created successfully', item });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// Update item (Admin/Storekeeper)
router.put('/:id', authMiddleware, roleMiddleware('admin', 'storekeeper'), async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const { name, nameAr, unit, category, minStock, costPerUnit, isActive } = req.body;
    
    await item.update({
      name: name || item.name,
      nameAr: nameAr !== undefined ? nameAr : item.nameAr,
      unit: unit || item.unit,
      category: category || item.category,
      minStock: minStock !== undefined ? minStock : item.minStock,
      costPerUnit: costPerUnit !== undefined ? costPerUnit : item.costPerUnit,
      isActive: isActive !== undefined ? isActive : item.isActive
    });

    res.json({ message: 'Item updated successfully', item });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete item (Admin only)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await item.update({ isActive: false });
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Get low stock alerts
router.get('/alerts/low-stock', authMiddleware, async (req, res) => {
  try {
    const items = await Item.findAll({
      include: [{
        model: Stock,
        as: 'stocks',
        where: {
          quantity: { [require('sequelize').Op.lte]: require('sequelize').col('Item.minStock') }
        },
        include: [{ model: Location, as: 'location' }]
      }]
    });
    
    res.json({ items });
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ error: 'Failed to get low stock alerts' });
  }
});

module.exports = router;
