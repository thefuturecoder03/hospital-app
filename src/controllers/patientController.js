const prisma = require('../config/db');
const { calculatePriority } = require('../services/priorityService');

exports.createPatient = async (req, res) => {
    try {
        const { name, age, condition, isHighRisk } = req.body;
        
        // Compute isolation priority score using your service module
        const priorityScore = calculatePriority({ age, condition, isHighRisk });

        // Save the verified patient profile directly to PostgreSQL via Prisma
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
