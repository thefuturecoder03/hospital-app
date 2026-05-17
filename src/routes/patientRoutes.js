const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/', authMiddleware, patientController.createPatient);
router.get('/', authMiddleware, patientController.getAllPatients);

// Delete patient route mapping wrapped with authentication protection
router.delete('/:id', authMiddleware, patientController.deletePatient);

module.exports = router;
