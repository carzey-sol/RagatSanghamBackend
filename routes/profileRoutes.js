// profileRoutes.js
const express = require('express');
const router = express.Router();
const { query } = require('../db'); // Import query function from database module
const { protectRoute } = require('../routes/authRoutes'); // Import the protectRoute from authRoutes

// Fetch User Profile (Protected Route)
router.get('/:id', protectRoute, async (req, res) => {
  const { id } = req.params;

  try {
    const userProfileQuery = `
      SELECT 
        u.*,
        d.*,
        r.name AS employee_type
      FROM Users u
      LEFT JOIN Donors d ON u.Id = d.userid
      LEFT JOIN Roles r ON u.roleid = r.id
      WHERE u.Id = $1;
    `;

    const result = await query(userProfileQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]); // Return the combined user, donor, and role data
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
