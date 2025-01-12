const express = require('express');
const router = express.Router();
const { query } = require('../db'); // Import query function from database module
const { protectRoute } = require('../routes/authRoutes'); // Import the protectRoute from authRoutes

// Fetch all provinces (Protected Route)
router.get('/', protectRoute, async (req, res) => {
  try {
    // Query to fetch all provinces
    const provincesQuery = 'SELECT * FROM Provinces';

    const result = await query(provincesQuery);

    res.json(result.rows); // Return all province data
  } catch (error) {
    console.error('Error fetching provinces:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Fetch a single province by ID (Protected Route)
router.get('/:id', protectRoute, async (req, res) => {
  const { id } = req.params;

  try {
    // Query to fetch a province by its ID
    const provinceQuery = 'SELECT * FROM Provinces WHERE id = $1';

    const result = await query(provinceQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Province not found' });
    }

    res.json(result.rows[0]); // Return the province data
  } catch (error) {
    console.error('Error fetching province:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
