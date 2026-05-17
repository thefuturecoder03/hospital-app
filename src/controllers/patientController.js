const prisma = require('../config/db');
const { calculatePriority } = require('../services/priorityService');

exports.createPatient = async (req, res) => {
    try {
        const { name, age, condition, isHighRisk } = req.body;
        const priorityScore = calculatePriority({ age, condition, isHighRisk });

        // 1. Find the first empty room in the entire database regardless of condition
        const availableRoom = await prisma.room.findFirst({
            where: {
                isAvailable: true,
                capacity: { gt: 0 }
            },
            orderBy: {
                number: 'asc' // Fill them up in clean numerical order (101, 102, 103...)
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
                    isAvailable: false // Room is now completely occupied
                }
            });
            finalStatus = `Room ${availableRoom.number}`;
        }

        // 3. Save patient record linked to their unique assigned room layout
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

exports.deletePatient = async (req, res) => {
    try {
        const { id } = req.params;

        const patient = await prisma.patient.findUnique({ where: { id } });

        if (!patient) {
            return res.status(404).json({ error: "Patient record not found." });
        }

        // When discharging, reset the room capacity cleanly back to 1 bed open
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

        res.status(200).json({ message: "Patient discharged and room freed." });
    } catch (error) {
        console.error("Database Deletion Failure:", error);
        res.status(500).json({ error: "Failed to execute patient removal." });
    }
};
