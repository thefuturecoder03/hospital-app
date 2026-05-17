const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/', authMiddleware, patientController.createPatient);
router.get('/', authMiddleware, patientController.getAllPatients);
router.delete('/:id', authMiddleware, patientController.deletePatient);

// Edit patient route mapping wrapped with authentication protection
router.put('/:id', authMiddleware, patientController.updatePatient);

module.exports = router;
