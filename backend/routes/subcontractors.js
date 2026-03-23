const express = require('express');
const router = express.Router();
const { Subcontractor, WorkItem } = require('../models');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Get all subcontractors
router.get('/', authMiddleware, async (req, res) => {
  try {
    const subcontractors = await Subcontractor.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
    });
    res.json({ subcontractors });
  } catch (error) {
    console.error('Get subcontractors error:', error);
    res.status(500).json({ error: 'Failed to get subcontractors' });
  }
});

// Get subcontractor by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const subcontractor = await Subcontractor.findByPk(req.params.id);
    
    if (!subcontractor) {
      return res.status(404).json({ error: 'Subcontractor not found' });
    }
    
    res.json({ subcontractor });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get subcontractor' });
  }
});

// Create subcontractor (Admin)
router.post('/', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { name, nameAr, contactPerson, phone, email } = req.body;

    const subcontractor = await Subcontractor.create({
      name,
      nameAr,
      contactPerson,
      phone,
      email
    });

    res.status(201).json({ message: 'Subcontractor created successfully', subcontractor });
  } catch (error) {
    console.error('Create subcontractor error:', error);
    res.status(500).json({ error: 'Failed to create subcontractor' });
  }
});

// Update subcontractor (Admin)
router.put('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const subcontractor = await Subcontractor.findByPk(req.params.id);
    
    if (!subcontractor) {
      return res.status(404).json({ error: 'Subcontractor not found' });
    }

    const { name, nameAr, contactPerson, phone, email, isActive } = req.body;
    
    await subcontractor.update({
      name: name || subcontractor.name,
      nameAr: nameAr !== undefined ? nameAr : subcontractor.nameAr,
      contactPerson: contactPerson !== undefined ? contactPerson : subcontractor.contactPerson,
      phone: phone !== undefined ? phone : subcontractor.phone,
      email: email !== undefined ? email : subcontractor.email,
      isActive: isActive !== undefined ? isActive : subcontractor.isActive
    });

    res.json({ message: 'Subcontractor updated successfully', subcontractor });
  } catch (error) {
    console.error('Update subcontractor error:', error);
    res.status(500).json({ error: 'Failed to update subcontractor' });
  }
});

// Delete subcontractor (Admin only)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const subcontractor = await Subcontractor.findByPk(req.params.id);
    
    if (!subcontractor) {
      return res.status(404).json({ error: 'Subcontractor not found' });
    }

    await subcontractor.update({ isActive: false });
    res.json({ message: 'Subcontractor deleted successfully' });
  } catch (error) {
    console.error('Delete subcontractor error:', error);
    res.status(500).json({ error: 'Failed to delete subcontractor' });
  }
});

module.exports = router;
