const express = require('express');
const app = express();
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const campaignRoutes = require('./routes/campaignRoutes')
const branchRoutes = require('./routes/branchRoutes');

app.use(express.json()); 

app.use(cors({
  origin: '*',  // Allow all origins (or specify certain domains)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Use authentication routes
app.use('/api/auth', authRoutes);
app.use('/api', authRoutes);
app.use('/api', campaignRoutes);
app.use('/api/branches', branchRoutes);

// Set the server to listen on a port 
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
