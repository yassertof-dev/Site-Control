const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

const Item = sequelize.define('Item', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nameAr: {
    type: DataTypes.STRING,
    allowNull: true
  },
  unit: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  minStock: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  costPerUnit: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

module.exports = Item;
