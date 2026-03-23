const express = require('express');
const router = express.Router();
const { Location } = require('../models');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Get all locations
router.get('/', authMiddleware, async (req, res) => {
  try {
    const locations = await Location.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
    });
    res.json({ locations });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ error: 'Failed to get locations' });
  }
});

// Get location by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const location = await Location.findByPk(req.params.id);
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    res.json({ location });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get location' });
  }
});

// Create location (Admin)
router.post('/', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { name, nameAr, type } = req.body;

    const location = await Location.create({
      name,
      nameAr,
      type: type || 'warehouse'
    });

    res.status(201).json({ message: 'Location created successfully', location });
  } catch (error) {
    console.error('Create location error:', error);
    res.status(500).json({ error: 'Failed to create location' });
  }
});

// Update location (Admin)
router.put('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const location = await Location.findByPk(req.params.id);
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    const { name, nameAr, type, isActive } = req.body;
    
    await location.update({
      name: name || location.name,
      nameAr: nameAr !== undefined ? nameAr : location.nameAr,
      type: type || location.type,
      isActive: isActive !== undefined ? isActive : location.isActive
    });

    res.json({ message: 'Location updated successfully', location });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

module.exports = router;
