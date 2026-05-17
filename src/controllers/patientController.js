const prisma = require('../config/db');
const { calculatePriority } = require('../services/priorityService');

exports.createPatient = async (req, res) => {
    try {
        const { name, age, condition, isHighRisk } = req.body;
        const priorityScore = calculatePriority({ age, condition, isHighRisk });

        // Identify destination matching rules based on medical criteria
        const isIsolationNeeded = (
            condition === 'Infectious' || 
            condition === 'Infectious Disease (Isolation Priority)' ||
            condition === 'Respiratory' || 
            condition === 'Respiratory Issues'
        );
        const targetRoomType = isIsolationNeeded ? 'Isolation' : 'Standard';

        // Query database for the first open, matching vacant room model
        const availableRoom = await prisma.room.findFirst({
            where: {
                type: targetRoomType,
                isAvailable: true,
                capacity: { gt: 0 }
            }
        });

        let assignedRoomId = null;
        let finalStatus = "Pending Assignment";

        // Update room occupancy records atomically if space exists
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

        // Save patient record linked directly to the room relational schema
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

// DELETE A PATIENT RECORD AND FREE UP BED CAPACITY ATOMICALLY
exports.deletePatient = async (req, res) => {
    try {
        const { id } = req.params;

        const patient = await prisma.patient.findUnique({
            where: { id }
        });

        if (!patient) {
            return res.status(404).json({ error: "Patient record not found." });
        }

        if (patient.roomId) {
            const assignedRoom = await prisma.room.findUnique({
                where: { id: patient.roomId }
            });

            if (assignedRoom) {
                const restoredCapacity = assignedRoom.capacity + 1;
                await prisma.room.update({
                    where: { id: patient.roomId },
                    data: {
                        capacity: restoredCapacity,
                        isAvailable: true
                    }
                });
            }
        }

        await prisma.patient.delete({
            where: { id }
        });

        res.status(200).json({ message: "Patient record removed and bed capacity restored." });
    } catch (error) {
        console.error("Database Deletion Failure:", error);
        res.status(500).json({ error: "Failed to execute patient removal tracking metrics." });
    }
};

// UPDATE AN EXISTING PATIENT DETAILS AND RECOMPUTE PRIORITY
exports.updatePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, age, condition } = req.body;

        const existingPatient = await prisma.patient.findUnique({ where: { id } });
        if (!existingPatient) {
            return res.status(404).json({ error: "Patient record not found." });
        }

        // Re-calculate priority score with new values
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
