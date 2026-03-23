const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

const ConsumptionRate = sequelize.define('ConsumptionRate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  workItemId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'WorkItems',
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
  ratePerUnit: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: false,
    comment: 'Quantity of item needed per 1 unit of work item'
  },
  wastePercentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: 'Allowed waste percentage tolerance'
  }
});

module.exports = ConsumptionRate;
