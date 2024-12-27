const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { query } = require('../db'); // Import the query function from db.js
const config = require('../config/env');

// Register Route
// Register Route
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

    // Insert the new user into the Users table
    const insertQuery = `
      INSERT INTO Users (Name, Email, Password, Phone, RoleId)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    
    const result = await query(insertQuery, [Name, Email, hashedPassword, Phone, RoleId]);
    const user = result.rows[0];  // Retrieve the inserted user

    // Insert into Donors table with UserId
    const donorInsertQuery = `
      INSERT INTO Donors (Name, Email, MobileNumber, UserId)
      VALUES ($1, $2, $3, $4);
    `;

    await query(donorInsertQuery, [Name, Email, Phone, user.id]);

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

    const token = jwt.sign({ id: user.rows[0].id }, config.jwtSecret, { expiresIn: '10h' });

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


// Protected Route 
router.get('/profile/:id', protectRoute, async (req, res) => {
  const { id } = req.params;

  try {
    const userProfileQuery = `
     SELECT *
FROM Users u
LEFT JOIN Donors d ON u.Id = d.userid
WHERE u.Id = $1;
    `;

    const result = await query(userProfileQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);  // Return the combined user and donor data
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
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
