const express = require('express');
const app = express();
const authRoutes = require('./routes/authRoutes');
const cors = require('cors');

app.use(express.json());
app.use(cors()); // If you need to enable CORS for API requests

// Use authentication routes
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
