const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const authMiddleware = require('../middlewares/authMiddleware'); // Import security layer

// POST /api/patients
// authMiddleware ensures only logged-in users can add a patient
router.post('/', authMiddleware, patientController.createPatient);

// GET /api/patients (Placeholder for listing patients)
router.get('/', authMiddleware, (req, res) => {
    res.json({ message: "This route is protected. Only authorized staff can see this." });
});

module.exports = router;
