const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

const MaterialIssueItem = sequelize.define('MaterialIssueItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  materialIssueId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'MaterialIssues',
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
  }
});

module.exports = MaterialIssueItem;
