const { calculatePriority } = require('../services/priorityService');

exports.createPatient = async (req, res) => {
    try {
        const { name, age, condition, isHighRisk } = req.body;
        const priorityScore = calculatePriority({ age, condition, isHighRisk });
        res.status(201).json({
            message: "Patient evaluated",
            patient: { name, priorityScore, status: "Pending Assignment" }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
