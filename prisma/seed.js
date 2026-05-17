const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Seeding exactly 100 individual rooms (1 bed each)...');

  // Loop to automatically generate 100 empty rooms from Room 101 to Room 200
  for (let i = 101; i <= 200; i++) {
    const roomNumber = i.toString();
    
    await prisma.room.upsert({
      where: { id: `room-${roomNumber}` },
      update: { capacity: 1, isAvailable: true }, // Ensure capacity is reset to 1
      create: {
        id: `room-${roomNumber}`,
        number: roomNumber,
        type: 'Standard', // Standard base so anyone can enter any room layout
        capacity: 1,      // Exactly 1 bed per room
        isAvailable: true
      }
    });
  }

  console.log('✅ Success! 100 total rooms initialized with 1 bed each.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
