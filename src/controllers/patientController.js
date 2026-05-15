const prisma = require('../config/db');
const { calculatePriority } = require('../services/priorityService');

// Admit and evaluate a single patient profile row
exports.createPatient = async (req, res) => {
    try {
        const { name, age, condition, isHighRisk } = req.body;
        const priorityScore = calculatePriority({ age, condition, isHighRisk });

        const newPatient = await prisma.patient.create({
            data: {
                name,
                age: parseInt(age),
                condition,
                priorityScore,
                isHighRisk: !!isHighRisk
            }
        });

        res.status(201).json({
            message: "Patient evaluated and saved successfully.",
            patient: {
                id: newPatient.id,
                name: newPatient.name,
                priorityScore: newPatient.priorityScore,
                status: "Pending Room Assignment"
            }
        });
    } catch (error) {
        console.error("Database Save Error:", error);
        res.status(500).json({ error: "Failed to persist patient record to database." });
    }
};

// FETCH ALL RECORDED ROWS FROM DATABASE FOR VISUAL LISTING
exports.getAllPatients = async (req, res) => {
    try {
        // Query PostgreSQL for all patients sorted highest priority first
        const patients = await prisma.patient.findMany({
            orderBy: {
                priorityScore: 'desc'
            }
        });

        res.status(200).json({ patients });
    } catch (error) {
        console.error("Database Retrieval Error:", error);
        res.status(500).json({ error: "Failed to query patient table registry." });
    }
};
