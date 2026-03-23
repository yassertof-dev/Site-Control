const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authMiddleware } = require('../middleware/auth');

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await User.findOne({ where: { username } });
    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Register (Admin only)
router.post('/register', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { username, email, password, fullName, role } = req.body;

    const existingUser = await User.findOne({
      where: { username }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const user = await User.create({
      username,
      email,
      password,
      fullName,
      role: role || 'site_engineer'
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'email', 'fullName', 'role']
    });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Get all users (Admin only)
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'fullName', 'role', 'isActive']
    });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get users' });
  }
});

module.exports = router;
