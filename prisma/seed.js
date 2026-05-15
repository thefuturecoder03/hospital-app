const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding hospital rooms configuration data...');

  // Create default isolation and standard rooms
  await prisma.room.upsert({
    where: { id: 'room-101' },
    update: {},
    create: {
      id: 'room-101',
      number: '101',
      type: 'Isolation',
      capacity: 1,
      isAvailable: true
    }
  });

  await prisma.room.upsert({
    where: { id: 'room-102' },
    update: {},
    create: {
      id: 'room-102',
      number: '102',
      type: 'Isolation',
      capacity: 1,
      isAvailable: true
    }
  });

  await prisma.room.upsert({
    where: { id: 'room-201' },
    update: {},
    create: {
      id: 'room-201',
      number: '201',
      type: 'Standard',
      capacity: 4,
      isAvailable: true
    }
  });

  console.log('Database hospital room seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
