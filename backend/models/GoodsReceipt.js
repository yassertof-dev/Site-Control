const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

const GoodsReceipt = sequelize.define('GoodsReceipt', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  receiptNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  supplierName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  locationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Locations',
      key: 'id'
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  invoiceImage: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Path to uploaded invoice image'
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
    defaultValue: 'completed'
  }
});

module.exports = GoodsReceipt;
