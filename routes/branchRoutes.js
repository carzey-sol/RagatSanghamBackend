const express = require('express');
const router = express.Router();
const { query } = require('../db'); 
const jwt = require('jsonwebtoken');
const config = require('../config/env');

// Middleware to validate token and extract user ID
function protectRoute(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded; // Attach user data to the request object
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
}

// Get all branches
router.get('/', protectRoute, async (req, res) => {
  try {
    const branchesQuery = `SELECT 
      b.*, 
      p.name AS province_name 
    FROM 
      Branches b
    LEFT JOIN 
      Provinces p ON b.provinceid = p.id;`;

    const result = await query(branchesQuery);

    res.json(result.rows); // Return all branch data
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a new branch
router.post('/', protectRoute, async (req, res) => {
  const { branchname, location, province_id, status } = req.body;
  const createdbyid = req.user.id; // Use user ID from the token

  try {
    const addBranchQuery = `
      INSERT INTO Branches (branchname, location, province_id, createdbyid, createddate, status)
      VALUES ($1, $2, $3, $4, NOW(), $5)
      RETURNING *;
    `;
    const result = await query(addBranchQuery, [branchname, location, province_id, createdbyid, status]);

    res.status(201).json(result.rows[0]); // Return the newly added branch
  } catch (error) {
    console.error('Error adding branch:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Edit an existing branch
router.put('/:id', protectRoute, async (req, res) => {
  const { id } = req.params;
  const { branchname, location, province_id, status } = req.body;

  try {
    const updateBranchQuery = `
      UPDATE Branches
      SET branchname = $1, location = $2, province_id = $3, status = $4, createddate = NOW()
      WHERE branchid = $5
      RETURNING *;
    `;
    const result = await query(updateBranchQuery, [branchname, location, province_id, status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    res.json(result.rows[0]); // Return the updated branch
  } catch (error) {
    console.error('Error updating branch:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update branch status (PATCH)
router.patch('/api/branches/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Ensure id is a valid number
  if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid branch ID' });
  }

  // Ensure status is valid
  if (status !== 'active' && status !== 'inactive') {
      return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
      // Proceed with your database query
      const result = await pool.query(
          'UPDATE branches SET status = $1 WHERE id = $2 RETURNING *',
          [status, id]
      );

      if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Branch not found' });
      }

      res.json({ message: 'Branch status updated successfully' });
  } catch (err) {
      console.error('Error updating branch status:', err.message);
      res.status(500).json({ message: 'Internal server error' });
  }
});
// Delete a branch
router.delete('/:id', protectRoute, async (req, res) => {
  const { id } = req.params;

  try {
    const deleteBranchQuery = `
      DELETE FROM Branches
      WHERE branchid = $1
      RETURNING *;
    `;
    const result = await query(deleteBranchQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    res.json({ message: 'Branch deleted successfully', branch: result.rows[0] });
  } catch (error) {
    console.error('Error deleting branch:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
