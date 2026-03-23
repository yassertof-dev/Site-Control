const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

const ProductionRecord = sequelize.define('ProductionRecord', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  subcontractorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Subcontractors',
      key: 'id'
    }
  },
  workItemId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'WorkItems',
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
  quantityCompleted: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Quantity of work completed (e.g., 100 m²)'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
});

module.exports = ProductionRecord;
