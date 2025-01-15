// routes/donorRoutes.js
const express = require('express');
const { query } = require('../db'); // Import your database query utility
const { protectRoute } = require('./authRoutes');  // Import protectRoute middleware
const router = express.Router();

// Get all donors
router.get('/', protectRoute, async (req, res) => {
  try {
    const result = await query('SELECT * FROM Donors');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching donors:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a specific donor by ID
router.get('/:id', protectRoute, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query('SELECT * FROM Donors WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Donor not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching donor:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a new donor
router.post('/', protectRoute, async (req, res) => {
  const { donorName, bloodType, profileImage, userId } = req.body;

  try {
    const insertQuery = `
      INSERT INTO Donors (donorName, bloodType, profileImage, userId)
      VALUES ($1, $2, $3, $4) RETURNING *;
    `;
    const result = await query(insertQuery, [donorName, bloodType, profileImage, userId]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating donor:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a donor's details
router.put('/:id', protectRoute, async (req, res) => {
  const { id } = req.params;
  const { donorName, bloodType, profileImage } = req.body;

  try {
    const updateQuery = `
      UPDATE Donors
      SET donorName = $1, bloodType = $2, profileImage = $3
      WHERE id = $4
      RETURNING *;
    `;
    const result = await query(updateQuery, [donorName, bloodType, profileImage, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating donor:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a donor
router.delete('/:id', protectRoute, async (req, res) => {
  const { id } = req.params;

  try {
    const deleteQuery = 'DELETE FROM Donors WHERE id = $1 RETURNING *;';
    const result = await query(deleteQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    res.status(200).json({ message: 'Donor deleted successfully' });
  } catch (error) {
    console.error('Error deleting donor:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
