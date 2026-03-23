const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

const GoodsReceiptItem = sequelize.define('GoodsReceiptItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  goodsReceiptId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'GoodsReceipts',
      key: 'id'
    }
  },
  itemId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Items',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  }
});

module.exports = GoodsReceiptItem;
