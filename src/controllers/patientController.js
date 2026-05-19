const prisma = require('../config/db');
const { calculatePriority } = require('../services/priorityService');

// CREATE A NEW PATIENT AND ASSIGN THE CHOSEN DROPDOWN BED EXCLUSIVELY
exports.createPatient = async (req, res) => {
    try {
        const { name, age, condition, isHighRisk, selectedRoomId } = req.body;
        const priorityScore = calculatePriority({ age, condition, isHighRisk });

        if (!selectedRoomId) {
            return res.status(400).json({ error: "Please manually select an available room assignment." });
        }

        const targetedRoom = await prisma.room.findUnique({
            where: { id: selectedRoomId }
        });

        if (!targetedRoom || !targetedRoom.isAvailable || targetedRoom.capacity <= 0) {
            return res.status(400).json({ error: "The chosen room has just been occupied. Please refresh and select another." });
        }

        await prisma.room.update({
            where: { id: selectedRoomId },
            data: {
                capacity: 0,
                isAvailable: false
            }
        });

        const newPatient = await prisma.patient.create({
            data: {
                name,
                age: parseInt(age),
                condition,
                priorityScore,
                isHighRisk: !!isHighRisk,
                roomId: selectedRoomId
            }
        });

        res.status(201).json({
            message: "Patient evaluated and assigned to chosen room.",
            patient: {
                id: newPatient.id,
                name: newPatient.name,
                priorityScore: newPatient.priorityScore,
                status: `Room ${targetedRoom.number}`
            }
        });
    } catch (error) {
        console.error("Database Transaction Failure:", error);
        res.status(500).json({ error: "Failed to execute user-selected room routing parameters." });
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

// UPDATE AN EXISTING PATIENT'S DEMOGRAPHICS AND ROOM HOUSING ASSIGNMENT
exports.updatePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, age, condition, newRoomId } = req.body;

        const existingPatient = await prisma.patient.findUnique({ where: { id } });
        if (!existingPatient) {
            return res.status(404).json({ error: "Patient record not found." });
        }

        // Re-calculate priority scoring metrics using the newly supplied values
        const priorityScore = calculatePriority({ 
            age: parseInt(age), 
            condition, 
            isHighRisk: parseInt(age) > 70 
        });

        let finalRoomId = existingPatient.roomId;

        // Execute room reallocation routines if a specific newRoomId is target mapped
        if (newRoomId && newRoomId !== existingPatient.roomId) {
            
            const targetRoom = await prisma.room.findUnique({ where: { id: newRoomId } });
            if (!targetRoom || !targetRoom.isAvailable || targetRoom.capacity <= 0) {
                return res.status(400).json({ error: "Selected room is already occupied." });
            }

            // Free up the patient's previous room footprint
            if (existingPatient.roomId) {
                await prisma.room.update({
                    where: { id: existingPatient.roomId },
                    data: { capacity: 1, isAvailable: true }
                });
            }

            // Lock down the newly requested bed space vacancy tracker
            await prisma.room.update({
                where: { id: newRoomId },
                data: { capacity: 0, isAvailable: false }
            });

            finalRoomId = newRoomId;
        }

        // Commit all parameter tracking data to the database row record
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

        res.status(200).json({ message: "Patient details and housing reallocated successfully.", patient: updatedPatient });
    } catch (error) {
        console.error("Database Modification Failure:", error);
        res.status(500).json({ error: "Failed to execute patient update metrics." });
    }
};
