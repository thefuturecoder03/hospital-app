const prisma = require('../config/db');
const { calculatePriority } = require('../services/priorityService');

// CREATE A NEW PATIENT AND AUTOMATICALLY ROUTE TO THE NEXT SEQUENTIAL EMPTY ROOM
exports.createPatient = async (req, res) => {
    try {
        const { name, age, condition, isHighRisk } = req.body;
        const priorityScore = calculatePriority({ age, condition, isHighRisk });

        // 1. Automatic Core: Grab the first open room in the database (101, 102, 103...)
        const availableRoom = await prisma.room.findFirst({
            where: {
                isAvailable: true,
                capacity: { gt: 0 }
            },
            orderBy: {
                number: 'asc' // Keeps them in sequential numerical sequence
            }
        });

        if (!availableRoom) {
            return res.status(400).json({ error: "The hospital is fully occupied. No vacant rooms remain." });
        }

        // 2. Lock the room down atomically by dropping its remaining capacity to 0
        await prisma.room.update({
            where: { id: availableRoom.id },
            data: {
                capacity: 0,
                isAvailable: false
            }
        });

        // 3. Save patient record linked directly to their automatically assigned room ID
        const newPatient = await prisma.patient.create({
            data: {
                name,
                age: parseInt(age),
                condition,
                priorityScore,
                isHighRisk: !!isHighRisk,
                roomId: availableRoom.id
            }
        });

        res.status(201).json({
            message: "Patient evaluated and automatically routed to an open room.",
            patient: {
                id: newPatient.id,
                name: newPatient.name,
                priorityScore: newPatient.priorityScore,
                status: `Room ${availableRoom.number}`
            }
        });
    } catch (error) {
        console.error("Database Transaction Failure:", error);
        res.status(500).json({ error: "Failed to execute automated room routing parameters." });
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
        res.status(500).json({ error: "Failed to query patient table registry." });
    }
};

// DISCHARGE PATIENT AND CLEANLY RESTORE INDIVIDUAL BED VACANCY CAPACITY
exports.deletePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const patient = await prisma.patient.findUnique({ where: { id } });
        if (!patient) return res.status(404).json({ error: "Patient not found." });

        if (patient.roomId) {
            await prisma.room.update({
                where: { id: patient.roomId },
                data: { capacity: 1, isAvailable: true }
            });
        }
        await prisma.patient.delete({ where: { id } });
        res.status(200).json({ message: "Patient discharged and room freed dynamically." });
    } catch (error) {
        res.status(500).json({ error: "Failed to execute patient removal." });
    }
};

// UPDATE AN EXISTING PATIENT'S DEMOGRAPHICS AND USER-SELECTED ROOM HOUSING
exports.updatePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, age, condition, newRoomId } = req.body;

        const existingPatient = await prisma.patient.findUnique({ where: { id } });
        if (!existingPatient) {
            return res.status(404).json({ error: "Patient record not found." });
        }

        // Re-calculate priority score matrix metrics dynamically using the updated values
        const priorityScore = calculatePriority({ 
            age: parseInt(age), 
            condition, 
            isHighRisk: parseInt(age) > 70 
        });

        let finalRoomId = existingPatient.roomId;

        // Coordinate Room Swapping Logic if a different room was explicitly specified during edits
        if (newRoomId && newRoomId !== existingPatient.roomId) {
            
            const targetRoom = await prisma.room.findUnique({ where: { id: newRoomId } });
            if (!targetRoom || !targetRoom.isAvailable || targetRoom.capacity <= 0) {
                return res.status(400).json({ error: "Selected room is already occupied." });
            }

            // Free up the old room space (restore its vacancy capacity back to 1 bed open)
            if (existingPatient.roomId) {
                await prisma.room.update({
                    where: { id: existingPatient.roomId },
                    data: { capacity: 1, isAvailable: true }
                });
            }

            // Lock down the new target room bed space (drop remaining capacity to 0)
            await prisma.room.update({
                where: { id: newRoomId },
                data: { capacity: 0, isAvailable: false }
            });

            finalRoomId = newRoomId;
        }

        // Commit all synchronized data updates to the database registry
        const updatedPatient = await prisma.patient.update({
            where: { id },
            data: {
                name,
                age: parseInt(age),
                condition,
                priorityScore,
                isHighRisk: parseInt(age) > 70,
                roomId: finalRoomId
            }
        });

        res.status(200).json({ message: "Patient metrics updated successfully.", patient: updatedPatient });
    } catch (error) {
        console.error("Database Modification Failure:", error);
        res.status(500).json({ error: "Failed to execute update metrics." });
    }
};
