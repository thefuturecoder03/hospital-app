const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

// Import Routes
const patientRoutes = require('./routes/patientRoutes');
const roomRoutes = require('./routes/roomRoutes');

// Import Auth Controller
const authController = require('./controllers/authController');

const app = express();

// --- Visual Interface Setup ---
app.use(express.static('src/public'));

// --- Middleware ---
app.use(helmet()); 
app.use(cors());   
app.use(morgan('dev')); 
app.use(express.json()); 

// --- Routes ---
app.post('/api/auth/login', authController.login);
app.use('/api/patients', patientRoutes);
app.use('/api/rooms', roomRoutes);

// --- Error Handling ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
