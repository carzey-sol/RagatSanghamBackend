const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { query } = require('../db'); // Import the query function from db.js
const config = require('../config/env');

// Register Route
router.post('/register', async (req, res) => {
  const { Name, Email, Password, Phone, RoleId } = req.body;

  try {
    // Check if the user already exists
    const userCheck = await query('SELECT * FROM Users WHERE Email = $1', [Email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(Password, 10);

    // Insert the new user into the database
    const insertQuery = `
      INSERT INTO Users (Name, Email, Password, Phone, RoleId)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    
    const result = await query(insertQuery, [Name, Email, hashedPassword, Phone, RoleId]);
    const user = result.rows[0];  // Retrieve the inserted user

    // Send success response
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    console.error('Error in registration:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { Email, Password } = req.body;

  try {
    const user = await query('SELECT * FROM Users WHERE Email = $1', [Email]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(Password, user.rows[0].password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.rows[0].id }, config.jwtSecret, { expiresIn: '1h' });

    // Send token and user info (including role)
    res.json({ 
      message: 'Login successful', 
      token, 
      user: { id: user.rows[0].id, RoleId: user.rows[0].roleid } 
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});


// Protected Route Example
router.get('/profile', protectRoute, async (req, res) => {
  const user = await query('SELECT * FROM Users WHERE id = $1', [req.user.id]);
  res.json(user.rows[0]);
});

// Middleware to Protect Routes
function protectRoute(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
}

module.exports = router;