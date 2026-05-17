const prisma = require('../config/db');
const { calculatePriority } = require('../services/priorityService');

// CREATE A NEW PATIENT AND ASSIGN THE NEXT AVAILABLE BED EXCLUSIVELY
exports.createPatient = async (req, res) => {
    try {
        const { name, age, condition, isHighRisk } = req.body;
        const priorityScore = calculatePriority({ age, condition, isHighRisk });

        // 1. Find the first empty room in the entire database (ignoring type parameters entirely)
        const availableRoom = await prisma.room.findFirst({
            where: {
                isAvailable: true,
                capacity: { gt: 0 }
            },
            orderBy: {
                number: 'asc' // Fill rooms up in numerical sequence (101, 102, 103...)
            }
        });

        let assignedRoomId = null;
        let finalStatus = "Pending Assignment";

        // 2. Lock the room down atomically by dropping its remaining capacity to 0
        if (availableRoom) {
            assignedRoomId = availableRoom.id;
            
            await prisma.room.update({
                where: { id: availableRoom.id },
                data: {
                    capacity: 0,
                    isAvailable: false // Room is now completely full
                }
            });
            finalStatus = `Room ${availableRoom.number}`;
        }

        // 3. Save patient record linked directly to their uniquely assigned room number
        const newPatient = await prisma.patient.create({
            data: {
                name,
                age: parseInt(age),
                condition,
                priorityScore,
                isHighRisk: !!isHighRisk,
                roomId: assignedRoomId
            }
        });

        res.status(201).json({
            message: "Patient evaluated and room routing updated successfully.",
            patient: {
                id: newPatient.id,
                name: newPatient.name,
                priorityScore: newPatient.priorityScore,
                status: finalStatus
            }
        });
    } catch (error) {
        console.error("Database Transaction Failure:", error);
        res.status(500).json({ error: "Failed to execute medical routing metrics." });
    }
};

// RETRIEVE ALL SAVED PATIENTS FROM POSTGRESQL FOR USER DATA TABLE SHOWCASES
exports.getAllPatients = async (req, res) => {
    try {
        const patients = await prisma.patient.findMany({
            include: { room: true },
            orderBy: { priorityScore: 'desc' }
        });

        const formattedPatients = patients.map(pt => ({
            ...pt,
            status: pt.room ? `Room ${pt.room.number}` : "Pending Assignment"
        }));

        res.status(200).json({ patients: formattedPatients });
    } catch (error) {
        console.error("Database Retrieval Error:", error);
        res.status(500).json({ error: "Failed to query patient table registry." });
    }
};

// DISCHARGE PATIENT AND CLEANLY RESTORE INDIVIDUAL BED VACANCY CAPACITY
exports.deletePatient = async (req, res) => {
    try {
        const { id } = req.params;

        const patient = await prisma.patient.findUnique({ where: { id } });

        if (!patient) {
            return res.status(404).json({ error: "Patient record not found." });
        }

        // Reset the room capacity back to 1 bed open upon data profile removals
        if (patient.roomId) {
            await prisma.room.update({
                where: { id: patient.roomId },
                data: {
                    capacity: 1,
                    isAvailable: true
                }
            });
        }

        await prisma.patient.delete({ where: { id } });

        res.status(200).json({ message: "Patient discharged and room freed dynamically." });
    } catch (error) {
        console.error("Database Deletion Failure:", error);
        res.status(500).json({ error: "Failed to execute patient removal tracking metrics." });
    }
};

// INLINE ADMINISTRATIVE PROPERTY MODIFICATION LAYER
exports.updatePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, age, condition } = req.body;

        const existingPatient = await prisma.patient.findUnique({ where: { id } });
        if (!existingPatient) {
            return res.status(404).json({ error: "Patient record not found." });
        }

        const priorityScore = calculatePriority({ 
            age: parseInt(age), 
            condition, 
            isHighRisk: parseInt(age) > 70 
        });

        const updatedPatient = await prisma.patient.update({
            where: { id },
            data: {
                name,
                age: parseInt(age),
                condition,
                priorityScore,
                isHighRisk: parseInt(age) > 70
            }
        });

        res.status(200).json({ message: "Patient details updated successfully.", patient: updatedPatient });
    } catch (error) {
        console.error("Database Modification Failure:", error);
        res.status(500).json({ error: "Failed to execute update metrics." });
    }
};
