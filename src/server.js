const app = require('./app');
const prisma = require('./config/db');
const PORT = process.env.PORT || 3038;

async function startServer() {
  let retries = 5;
  while (retries) {
    try {
      // Test the database connection pool connection directly on boot
      await prisma.$connect();
      console.log('Successfully connected to the PostgreSQL database container.');
      break;
    } catch (err) {
      console.error(`Database connection failed. Retries remaining: ${retries - 1}`);
      retries -= 1;
      // Wait 3 seconds before attempting to connect again
      await new Promise(res => setTimeout(res, 3000));
    }
  }

  app.listen(PORT, () => {
    console.log(`Hospital Room Management System active on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Critical Engine Initialization Failure:', err);
  process.exit(1);
});
