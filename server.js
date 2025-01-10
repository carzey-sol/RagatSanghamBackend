const express = require('express');
const app = express();
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const branchRoutes = require('./routes/branchRoutes');
require('dotenv').config(); // Optional for environment variable management

app.use(express.json());

app.use(cors({
  origin: '*',  // Consider restricting this for production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Use authentication routes
app.use('/api/auth', authRoutes); // Register authRoutes once under /api/auth
app.use('/api', campaignRoutes);  // Register campaign routes
app.use('/api/branches', branchRoutes); // Register branch routes

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error
  res.status(500).json({ error: 'Internal Server Error' });
});

// Set the server to listen on a port
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
