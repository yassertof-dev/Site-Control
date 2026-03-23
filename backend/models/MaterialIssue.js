const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

const MaterialIssue = sequelize.define('MaterialIssue', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  issueNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
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
    },
    comment: 'MANDATORY - Subcontractor receiving materials'
  },
  workItemId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'WorkItems',
      key: 'id'
    },
    comment: 'Activity/Work item for which materials are issued'
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

module.exports = MaterialIssue;
