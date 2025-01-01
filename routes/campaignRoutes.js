const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { query } = require('../db'); // Import query from the database module
const config = require('../config/env');

// Middleware to Protect Routes
function protectRoute(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1]; // Extract token from Authorization header
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret); // Verify the token using the secret
    req.user = decoded; // Attach decoded token data to the request object
    next(); // Continue to the next middleware or route handler
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
}

// Fetch Campaigns Data (Protected Route)
router.get('/campaigns', protectRoute, async (req, res) => {
  try {
    const campaignQuery = `
      SELECT * FROM Campaigns;  // Adjust with necessary filters or joins as needed
    `;
    const result = await query(campaignQuery);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No campaigns found' });
    }

    res.json(result.rows); // Return the campaigns data
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
