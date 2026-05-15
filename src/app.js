const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

// Import Routes
const patientRoutes = require('./routes/patientRoutes');
const roomRoutes = require('./routes/roomRoutes');

// Import Auth Controller (for the login route)
const authController = require('./controllers/authController');

const app = express();

// --- Middleware ---
app.use(helmet()); // Security: Sets various HTTP headers
app.use(cors());   // Security: Enables Cross-Origin Resource Sharing
app.use(morgan('dev')); // Usability: Logs requests to the console
app.use(express.json()); // Functionality: Parses incoming JSON data

// --- Routes ---

// Health Check (Root)
app.get('/', (req, res) => {
    res.json({ status: "Hospital Management API Online" });
});

// Authentication Route
app.post('/api/auth/login', authController.login);

// Hospital Logic Routes
app.use('/api/patients', patientRoutes);
app.use('/api/rooms', roomRoutes);

// --- Error Handling ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
