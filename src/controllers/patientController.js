const prisma = require('../config/db');
const { calculatePriority } = require('../services/priorityService');

exports.createPatient = async (req, res) => {
    try {
        const { name, age, condition, isHighRisk } = req.body;
        const priorityScore = calculatePriority({ age, condition, isHighRisk });

        // 1. Identify destination matching rules based on medical criteria
        const isIsolationNeeded = (
            condition === 'Infectious' || 
            condition === 'Infectious Disease (Isolation Priority)' ||
            condition === 'Respiratory' || 
            condition === 'Respiratory Issues'
        );
        const targetRoomType = isIsolationNeeded ? 'Isolation' : 'Standard';

        // 2. Query database for the first open, matching vacant room model
        const availableRoom = await prisma.room.findFirst({
            where: {
                type: targetRoomType,
                isAvailable: true,
                capacity: { gt: 0 }
            }
        });

        let assignedRoomId = null;
        let finalStatus = "Pending Assignment";

        // 3. Update room occupancy records atomically if space exists
        if (availableRoom) {
            assignedRoomId = availableRoom.id;
            const newCapacity = availableRoom.capacity - 1;
            
            await prisma.room.update({
                where: { id: availableRoom.id },
                data: {
                    capacity: newCapacity,
                    isAvailable: newCapacity > 0
                }
            });
            finalStatus = `Room ${availableRoom.number}`;
        }

        // 4. Save patient record linked directly to the room relational schema
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
        // Query database and populate matching room metrics automatically
        const patients = await prisma.patient.findMany({
            include: { room: true },
            orderBy: { priorityScore: 'desc' }
        });

        // Map live properties to status string parameters for UI cards
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
