const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { GoodsReceipt, GoodsReceiptItem, Stock, Item, Location } = require('../models');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Generate receipt number
const generateReceiptNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `GR-${year}${month}-${random}`;
};

// Get all goods receipts
router.get('/', authMiddleware, async (req, res) => {
  try {
    const receipts = await GoodsReceipt.findAll({
      include: [
        { model: Location, as: 'location' },
        { model: GoodsReceiptItem, as: 'items', include: [{ model: Item, as: 'item' }] }
      ],
      order: [['date', 'DESC']]
    });
    res.json({ receipts });
  } catch (error) {
    console.error('Get receipts error:', error);
    res.status(500).json({ error: 'Failed to get receipts' });
  }
});

// Get receipt by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const receipt = await GoodsReceipt.findByPk(req.params.id, {
      include: [
        { model: Location, as: 'location' },
        { model: GoodsReceiptItem, as: 'items', include: [{ model: Item, as: 'item' }] }
      ]
    });
    
    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }
    
    res.json({ receipt });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get receipt' });
  }
});

// Create goods receipt (Storekeeper/Admin)
router.post('/', authMiddleware, roleMiddleware('admin', 'storekeeper'), async (req, res) => {
  const transaction = await Stock.sequelize.transaction();
  
  try {
    const { supplierName, date, locationId, notes, invoiceImage, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    // Create receipt
    const receipt = await GoodsReceipt.create({
      receiptNumber: generateReceiptNumber(),
      supplierName,
      date: date || new Date(),
      locationId,
      notes,
      invoiceImage,
      createdBy: req.user.id
    }, { transaction });

    // Process each item and update stock
    for (const itemData of items) {
      const { itemId, quantity, unitPrice } = itemData;

      // Create receipt item
      await GoodsReceiptItem.create({
        goodsReceiptId: receipt.id,
        itemId,
        quantity,
        unitPrice
      }, { transaction });

      // Update or create stock record
      let stock = await Stock.findOne({
        where: { itemId, locationId },
        transaction
      });

      if (stock) {
        await stock.update({
          quantity: parseFloat(stock.quantity) + parseFloat(quantity),
          lastUpdated: new Date()
        }, { transaction });
      } else {
        await Stock.create({
          itemId,
          locationId,
          quantity
        }, { transaction });
      }
    }

    await transaction.commit();
    
    const fullReceipt = await GoodsReceipt.findByPk(receipt.id, {
      include: [
        { model: Location, as: 'location' },
        { model: GoodsReceiptItem, as: 'items', include: [{ model: Item, as: 'item' }] }
      ]
    });

    res.status(201).json({ message: 'Goods receipt created successfully', receipt: fullReceipt });
  } catch (error) {
    await transaction.rollback();
    console.error('Create receipt error:', error);
    res.status(500).json({ error: 'Failed to create goods receipt' });
  }
});

// Cancel receipt (Admin/Storekeeper)
router.put('/:id/cancel', authMiddleware, roleMiddleware('admin', 'storekeeper'), async (req, res) => {
  const transaction = await Stock.sequelize.transaction();
  
  try {
    const receipt = await GoodsReceipt.findByPk(req.params.id, {
      include: [{ model: GoodsReceiptItem, as: 'items' }],
      transaction
    });

    if (!receipt) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Receipt not found' });
    }

    if (receipt.status === 'cancelled') {
      await transaction.rollback();
      return res.status(400).json({ error: 'Receipt already cancelled' });
    }

    // Decrease stock
    for (const item of receipt.items) {
      const stock = await Stock.findOne({
        where: { itemId: item.itemId, locationId: receipt.locationId },
        transaction
      });

      if (stock) {
        await stock.update({
          quantity: parseFloat(stock.quantity) - parseFloat(item.quantity),
          lastUpdated: new Date()
        }, { transaction });
      }
    }

    await receipt.update({ status: 'cancelled' }, { transaction });
    await transaction.commit();

    res.json({ message: 'Receipt cancelled successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Cancel receipt error:', error);
    res.status(500).json({ error: 'Failed to cancel receipt' });
  }
});

module.exports = router;
