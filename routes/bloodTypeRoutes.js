const express = require('express');
const { query } = require('../db'); // Import your database query utility
const { protectRoute } = require('./authRoutes'); // Import protectRoute middleware if authorization is needed
const router = express.Router();

// Get all blood types
router.get('/', protectRoute, async (req, res) => {
  try {
    const result = await query('SELECT * FROM bloodtypes ORDER BY name ASC;'); // Fetch all blood types
    res.status(200).json(result.rows); // Send the result as JSON
  } catch (error) {
    console.error('Error fetching blood types:', error);
    res.status(500).json({ error: 'Server error' }); // Handle errors
  }
});

// Add a new blood type (optional)
router.post('/', protectRoute, async (req, res) => {
  const { name } = req.body;

  try {
    const insertQuery = `
      INSERT INTO bloodtypes (name)
      VALUES ($1)
      RETURNING *;
    `;
    const result = await query(insertQuery, [name]);

    res.status(201).json(result.rows[0]); // Return the newly created blood type
  } catch (error) {
    console.error('Error creating blood type:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
