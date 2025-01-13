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
  const { branchname, location, provinceid, status, createdbyid } = req.body;

  // Input validation for required fields
  if (!branchname || !location || !provinceid || typeof status === 'undefined' || !createdbyid) {
    return res.status(400).json({ error: 'All fields are required: branchname, location, provinceid, status, and createdbyid.' });
  }

  // Input validation for user id (createdbyid)
  if (typeof createdbyid !== 'number') {
    return res.status(400).json({ error: 'Invalid user ID.' });
  }

  try {
    const addBranchQuery = `
      INSERT INTO branches (branchname, location, provinceid, status, createdbyid, createddate)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING branchid, branchname, location, provinceid, status, createdbyid, createddate;
    `;

    const result = await query(addBranchQuery, [branchname, location, provinceid, status, createdbyid]);

    if (result.rows.length === 0) {
      throw new Error('Branch creation failed. No rows were returned.');
    }

    res.status(201).json({ message: 'Branch created successfully!', branch: result.rows[0] });
  } catch (error) {
    console.error('Error adding branch:', error);

    // Handle specific database error codes
    if (error.code === '23505') {
      res.status(409).json({ error: 'A branch with the same details already exists.' });
    } else if (error.code === '23503') {
      res.status(400).json({ error: 'Invalid province ID. Please provide a valid province.' });
    } else {
      // Handle unexpected errors
      res.status(500).json({ error: 'An unexpected server error occurred.' });
    }
  }
});




// Edit an existing branch
router.put('/:id', protectRoute, async (req, res) => {
  const { id } = req.params;
  const { branchname, location, provinceid, status } = req.body; // Use provinceid
  try {
    const updateBranchQuery = `
      UPDATE Branches
      SET branchname = $1, location = $2, provinceid = $3, status = $4, createddate = NOW()  
      WHERE branchid = $5
      RETURNING *;
    `;
    const result = await query(updateBranchQuery, [branchname, location, provinceid, status, id]); // Use provinceid
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
router.put('/:id/status', protectRoute, async (req, res) => { // Apply the middleware here
  const { id } = req.params;
  const { status } = req.body;

  // Validate id and status
  if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid branch ID' });
  }
  if (status !== 'active' && status !== 'inactive') {
      return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
      const result = await query(
          'UPDATE Branches SET status = $1 WHERE branchid = $2 RETURNING *', // Ensure the correct column name
          [status, id]
      );

      if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Branch not found' });
      }

      res.json({ message: 'Branch status updated successfully', branch: result.rows[0] }); // Return the updated branch
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