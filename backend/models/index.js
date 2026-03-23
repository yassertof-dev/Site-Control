const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

// Define associations between models
const User = require('./User');
const Item = require('./Item');
const Location = require('./Location');
const Stock = require('./Stock');
const Subcontractor = require('./Subcontractor');
const WorkItem = require('./WorkItem');
const ConsumptionRate = require('./ConsumptionRate');
const GoodsReceipt = require('./GoodsReceipt');
const GoodsReceiptItem = require('./GoodsReceiptItem');
const MaterialIssue = require('./MaterialIssue');
const MaterialIssueItem = require('./MaterialIssueItem');
const ProductionRecord = require('./ProductionRecord');

// User has many created records
User.hasMany(GoodsReceipt, { foreignKey: 'createdBy', as: 'createdReceipts' });
GoodsReceipt.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

User.hasMany(MaterialIssue, { foreignKey: 'createdBy', as: 'createdIssues' });
MaterialIssue.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

User.hasMany(ProductionRecord, { foreignKey: 'createdBy', as: 'createdProductions' });
ProductionRecord.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Location relationships
Location.hasMany(Stock, { foreignKey: 'locationId', as: 'stocks' });
Stock.belongsTo(Location, { foreignKey: 'locationId', as: 'location' });

Location.hasMany(GoodsReceipt, { foreignKey: 'locationId', as: 'receipts' });
GoodsReceipt.belongsTo(Location, { foreignKey: 'locationId', as: 'location' });

Location.hasMany(MaterialIssue, { foreignKey: 'locationId', as: 'issues' });
MaterialIssue.belongsTo(Location, { foreignKey: 'locationId', as: 'location' });

Location.hasMany(ProductionRecord, { foreignKey: 'locationId', as: 'productions' });
ProductionRecord.belongsTo(Location, { foreignKey: 'locationId', as: 'location' });

// Item relationships
Item.hasMany(Stock, { foreignKey: 'itemId', as: 'stocks' });
Stock.belongsTo(Item, { foreignKey: 'itemId', as: 'item' });

Item.hasMany(GoodsReceiptItem, { foreignKey: 'itemId', as: 'receiptItems' });
GoodsReceiptItem.belongsTo(Item, { foreignKey: 'itemId', as: 'item' });

Item.hasMany(MaterialIssueItem, { foreignKey: 'itemId', as: 'issueItems' });
MaterialIssueItem.belongsTo(Item, { foreignKey: 'itemId', as: 'item' });

Item.hasMany(ConsumptionRate, { foreignKey: 'itemId', as: 'consumptionRates' });
ConsumptionRate.belongsTo(Item, { foreignKey: 'itemId', as: 'item' });

// Subcontractor relationships
Subcontractor.hasMany(MaterialIssue, { foreignKey: 'subcontractorId', as: 'materialIssues' });
MaterialIssue.belongsTo(Subcontractor, { foreignKey: 'subcontractorId', as: 'subcontractor' });

Subcontractor.hasMany(ProductionRecord, { foreignKey: 'subcontractorId', as: 'productionRecords' });
ProductionRecord.belongsTo(Subcontractor, { foreignKey: 'subcontractorId', as: 'subcontractor' });

// WorkItem relationships
WorkItem.hasMany(ConsumptionRate, { foreignKey: 'workItemId', as: 'consumptionRates' });
ConsumptionRate.belongsTo(WorkItem, { foreignKey: 'workItemId', as: 'workItem' });

WorkItem.hasMany(MaterialIssue, { foreignKey: 'workItemId', as: 'materialIssues' });
MaterialIssue.belongsTo(WorkItem, { foreignKey: 'workItemId', as: 'workItem' });

WorkItem.hasMany(ProductionRecord, { foreignKey: 'workItemId', as: 'productionRecords' });
ProductionRecord.belongsTo(WorkItem, { foreignKey: 'workItemId', as: 'workItem' });

// GoodsReceipt relationships
GoodsReceipt.hasMany(GoodsReceiptItem, { foreignKey: 'goodsReceiptId', as: 'items' });
GoodsReceiptItem.belongsTo(GoodsReceipt, { foreignKey: 'goodsReceiptId', as: 'goodsReceipt' });

// MaterialIssue relationships
MaterialIssue.hasMany(MaterialIssueItem, { foreignKey: 'materialIssueId', as: 'items' });
MaterialIssueItem.belongsTo(MaterialIssue, { foreignKey: 'materialIssueId', as: 'materialIssue' });

module.exports = {
  User,
  Item,
  Location,
  Stock,
  Subcontractor,
  WorkItem,
  ConsumptionRate,
  GoodsReceipt,
  GoodsReceiptItem,
  MaterialIssue,
  MaterialIssueItem,
  ProductionRecord
};
