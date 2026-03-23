const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

const Stock = sequelize.define('Stock', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  itemId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Items',
      key: 'id'
    }
  },
  locationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Locations',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  lastUpdated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

module.exports = Stock;
