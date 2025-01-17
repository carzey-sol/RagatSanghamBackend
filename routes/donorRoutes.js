const express = require('express');
const { query } = require('../db');
const { protectRoute } = require('./authRoutes');
const upload = require('../utils/multer'); // Import Multer middleware
const cloudinary = require('../utils/cloudinary'); // Import Cloudinary configuration
const router = express.Router();

// Get all donors
router.get('/', protectRoute, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        d.*,        
        bt.name AS bloodTypeName, 
        u.roleid                
      FROM Donors d
      JOIN bloodtypes bt ON d.bloodtypeid = bt.id
      JOIN Users u ON u.id = d.userId             
      WHERE u.roleid = 5;
    `);
    console.log(result.rows);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching donors:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a new donor
router.post('/', protectRoute, upload.single('profileImage'), async (req, res) => {
  const { donorName, temporaryaddress, permanentaddress, mobilenumber, secondarynumber, email, status, bloodType } = req.body;

  const profileImage = req.file ? req.file.path : null; // Image from Multer

  try {
    // Step 1: Insert data into Users table with a default password "password"
    const insertUserQuery = `
      INSERT INTO Users (name, email, password, phone, roleid)
      VALUES ($1, $2, $3, $4, $5) RETURNING id;
    `;
    const userResult = await query(insertUserQuery, [
      donorName,
      email,
      'password', // Default password set to "password"
      mobilenumber, // Primary phone number
      5, // Role ID for donors
    ]);

    const userId = userResult.rows[0].id; // Retrieve the userId generated for the new user

    // Step 2: Upload image to Cloudinary if a file is provided
    let cloudinaryImageUrl = null;
    if (profileImage) {
      const cloudinaryResponse = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: 'auto' },
          (error, result) => {
            if (error) {
              return reject('Failed to upload image to Cloudinary');
            }
            resolve(result);
          }
        ).end(req.file.buffer); // Upload file buffer to Cloudinary
      });
      cloudinaryImageUrl = cloudinaryResponse.secure_url; // Get the secure image URL from Cloudinary
    }

    // Step 3: Insert data into Donors table, excluding fields already inserted in Users table
    const insertDonorQuery = `
      INSERT INTO Donors (temporaryaddress, permanentaddress, mobilenumber, secondarynumber, status, bloodtypeid, profileimage, userid)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;
    `;
    const donorResult = await query(insertDonorQuery, [
      temporaryaddress, // Only fields specific to Donors
      permanentaddress,
      mobilenumber,
      secondarynumber,
      status,
      bloodType,
      cloudinaryImageUrl || profileImage, // Use the Cloudinary URL or Multer path
      userId, // Associate the userId from the Users table
    ]);

    res.status(201).json(donorResult.rows[0]);  // Return the donor information with associated userId
  } catch (error) {
    console.error('Error creating donor:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a donor's details
router.put('/:id', protectRoute, async (req, res) => {
  const { id } = req.params;
  const { donorName, tempAddress, mobileNumber, secondaryNumber, email, status, bloodType, profileImage } = req.body;

  try {
    const updateQuery = `
      UPDATE Donors
      SET donorName = $1, tempAddress = $2, mobileNumber = $3, secondaryNumber = $4, email = $5, 
          status = $6, bloodType = $7, profileImage = $8
      WHERE id = $9
      RETURNING *;
    `;
    const result = await query(updateQuery, [
      donorName,
      tempAddress,
      mobileNumber,
      secondaryNumber,
      email,
      status,
      bloodType,
      profileImage,
      id,
    ]);

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
