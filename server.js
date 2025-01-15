// server.js
const express = require('express');
const app = express();
const cors = require('cors');
const { router: authRoutes } = require('./routes/authRoutes');  // Correct import for the authRoutes
const campaignRoutes = require('./routes/campaignRoutes');
const branchRoutes = require('./routes/branchRoutes');
const profileRoutes = require('./routes/profileRoutes');
const provinceRoutes = require('./routes/provinceRoutes'); 
const donorRoutes = require('./routes/donorRoutes');

app.use(express.json());

app.use(cors({
  origin: '*',  // Specify your frontend URL here
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Use authentication routes
app.use('/api/auth', authRoutes); // Register authRoutes under /api/auth
app.use('/api', campaignRoutes);  // Register campaign routes
app.use('/api/branches', branchRoutes);
app.use('/api/profile', profileRoutes); // Register branch routes
app.use('/api/provinces', provinceRoutes);
app.use('/api/donors', donorRoutes);

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
