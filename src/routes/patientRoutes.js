const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const authMiddleware = require('../middlewares/authMiddleware');

// Route management mappings
router.post('/', authMiddleware, patientController.createPatient);
router.get('/', authMiddleware, patientController.getAllPatients); // Hook up controller list method

module.exports = router;
