const express = require('express');
const cors = require('cors');
require('dotenv').config();

const sequelize = require('./config/database');
const { User, Item, Location, Stock, Subcontractor, WorkItem, ConsumptionRate } = require('./models');

// Import routes
const authRoutes = require('./routes/auth');
const itemsRoutes = require('./routes/items');
const locationsRoutes = require('./routes/locations');
const subcontractorsRoutes = require('./routes/subcontractors');
const workItemsRoutes = require('./routes/workItems');
const goodsReceiptsRoutes = require('./routes/goodsReceipts');
const materialIssuesRoutes = require('./routes/materialIssues');
const productionRoutes = require('./routes/production');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/subcontractors', subcontractorsRoutes);
app.use('/api/work-items', workItemsRoutes);
app.use('/api/goods-receipts', goodsReceiptsRoutes);
app.use('/api/material-issues', materialIssuesRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/upload', uploadRoutes);

// Dashboard stats endpoint
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const totalStockValue = await Stock.findAll({
      include: [{ model: Item, as: 'item' }]
    });
    
    const totalValue = totalStockValue.reduce((sum, stock) => {
      return sum + (parseFloat(stock.quantity) * parseFloat(stock.item.costPerUnit || 0));
    }, 0);

    const lowStockItems = await Item.findAll({
      include: [{
        model: Stock,
        as: 'stocks',
        where: {
          quantity: { [require('sequelize').Op.lte]: require('sequelize').col('Item.minStock') }
        }
      }]
    });

    res.json({
      totalStockValue,
      totalValue,
      lowStockCount: lowStockItems.length
    });
  } catch (error) {
    res.json({
      totalStockValue: [],
      totalValue: 0,
      lowStockCount: 0
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Construction Inventory API is running' });
});

// Initialize database and start server
const initializeDatabase = async () => {
  try {
    // Sync all models
    await sequelize.sync({ force: false });
    console.log('✓ Database synchronized successfully');

    // Create default admin user if not exists
    const adminExists = await User.findOne({ where: { username: 'admin' } });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        email: 'admin@construction.com',
        password: 'admin123',
        fullName: 'System Administrator',
        role: 'admin'
      });
      console.log('✓ Default admin user created (username: admin, password: admin123)');
    }

    // Create sample data
    await createSampleData();

    // Start server
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ API available at http://localhost:${PORT}/api`);
      console.log('\n=== Quick Start ===');
      console.log('Login: POST /api/auth/login');
      console.log('Body: { "username": "admin", "password": "admin123" }');
      console.log('==================\n');
    });
  } catch (error) {
    console.error('✗ Database initialization failed:', error.message);
    console.log('Starting server in mock mode...');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (mock mode)`);
    });
  }
};

const createSampleData = async () => {
  try {
    // Check if data already exists
    const itemCount = await Item.count();
    if (itemCount > 0) {
      console.log('✓ Sample data already exists, skipping...');
      return;
    }

    console.log('Creating sample data...');

    // Create locations
    const mainWarehouse = await Location.create({ name: 'Main Warehouse', nameAr: 'المستودع الرئيسي', type: 'warehouse' });
    const siteA = await Location.create({ name: 'Site A', nameAr: 'الموقع أ', type: 'site' });
    const siteB = await Location.create({ name: 'Site B', nameAr: 'الموقع ب', type: 'site' });

    // Create items
    const cement = await Item.create({ 
      name: 'Cement', 
      nameAr: 'أسمنت', 
      unit: 'kg', 
      category: 'Building Materials',
      minStock: 500,
      costPerUnit: 0.50
    });
    
    const sand = await Item.create({ 
      name: 'Sand', 
      nameAr: 'رمل', 
      unit: 'm³', 
      category: 'Building Materials',
      minStock: 50,
      costPerUnit: 25.00
    });
    
    const steel = await Item.create({ 
      name: 'Steel Rebar', 
      nameAr: 'حديد تسليح', 
      unit: 'ton', 
      category: 'Steel',
      minStock: 10,
      costPerUnit: 800.00
    });

    const tiles = await Item.create({ 
      name: 'Ceramic Tiles', 
      nameAr: 'بلاط سيراميك', 
      unit: 'm²', 
      category: 'Finishing',
      minStock: 200,
      costPerUnit: 15.00
    });

    // Create subcontractors
    const sub1 = await Subcontractor.create({ 
      name: 'Al-Noor Construction', 
      nameAr: 'شركة النور للإنشاءات',
      contactPerson: 'Ahmed Hassan',
      phone: '+966501234567'
    });
    
    const sub2 = await Subcontractor.create({ 
      name: 'Modern Tiling Co.', 
      nameAr: 'شركة التغليف الحديثة',
      contactPerson: 'Mohammed Ali',
      phone: '+966507654321'
    });

    // Create work items
    const tiling = await WorkItem.create({ 
      name: 'Tiling', 
      nameAr: 'تبليط', 
      unit: 'm²',
      description: 'Floor and wall tiling work'
    });
    
    const concrete = await WorkItem.create({ 
      name: 'Concrete Work', 
      nameAr: 'أعمال الخرسانة', 
      unit: 'm³',
      description: 'Concrete pouring and finishing'
    });
    
    const column = await WorkItem.create({ 
      name: 'Column Construction', 
      nameAr: 'إنشاء الأعمدة', 
      unit: 'column',
      description: 'Reinforced concrete columns'
    });

    // Create consumption rates
    // 1 m² tiling = 5 kg cement + 0.01 m³ sand
    await ConsumptionRate.create({ 
      workItemId: tiling.id, 
      itemId: cement.id, 
      ratePerUnit: 5.0,
      wastePercentage: 5.0
    });
    await ConsumptionRate.create({ 
      workItemId: tiling.id, 
      itemId: sand.id, 
      ratePerUnit: 0.01,
      wastePercentage: 5.0
    });

    // 1 m³ concrete = 350 kg cement + 0.8 m³ sand
    await ConsumptionRate.create({ 
      workItemId: concrete.id, 
      itemId: cement.id, 
      ratePerUnit: 350.0,
      wastePercentage: 3.0
    });
    await ConsumptionRate.create({ 
      workItemId: concrete.id, 
      itemId: sand.id, 
      ratePerUnit: 0.8,
      wastePercentage: 5.0
    });

    // 1 column = 300 kg cement + 0.1 ton steel
    await ConsumptionRate.create({ 
      workItemId: column.id, 
      itemId: cement.id, 
      ratePerUnit: 300.0,
      wastePercentage: 3.0
    });
    await ConsumptionRate.create({ 
      workItemId: column.id, 
      itemId: steel.id, 
      ratePerUnit: 0.1,
      wastePercentage: 2.0
    });

    // Create initial stock
    await Stock.create({ itemId: cement.id, locationId: mainWarehouse.id, quantity: 5000 });
    await Stock.create({ itemId: sand.id, locationId: mainWarehouse.id, quantity: 200 });
    await Stock.create({ itemId: steel.id, locationId: mainWarehouse.id, quantity: 50 });
    await Stock.create({ itemId: tiles.id, locationId: mainWarehouse.id, quantity: 1000 });

    console.log('✓ Sample data created successfully');
    console.log('  - Locations: Main Warehouse, Site A, Site B');
    console.log('  - Items: Cement, Sand, Steel, Tiles');
    console.log('  - Subcontractors: Al-Noor Construction, Modern Tiling Co.');
    console.log('  - Work Items: Tiling, Concrete Work, Column Construction');
    console.log('  - Consumption rates configured');
  } catch (error) {
    console.error('Error creating sample data:', error);
  }
};

// Start the application
initializeDatabase();

module.exports = app;
