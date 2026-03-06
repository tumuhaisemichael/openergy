import { PrismaClient } from "@prisma/client";
import "dotenv/config";

async function testConnection() {
  console.log("Checking DATABASE_URL from environment...");
  const urlString = process.env.DATABASE_URL;

  if (!urlString) {
    console.error("❌ ERROR: DATABASE_URL is not defined in your .env file.");
    return;
  }

  console.log(`Connecting to: ${urlString.replace(/:.*@/, ":****@")}`); // Log URL with hidden password

  // Initialize Prisma Client
  const prisma = new PrismaClient();
  try {
    console.log("Attempting to connect to the database...");

    await prisma.$connect();
    console.log("✅ Successfully connected to the database!");
    
    // Test a real query to ensure DB selection
    const userCount = await prisma.user.count();
    console.log(`📊 Current user count: ${userCount}`);
    
  } catch (error) {
    console.error("❌ Database connection failed!");
    console.error("Error details:", error);
    
    if (error.code === 'P1001') {
      console.log("\n💡 Tip: Check if XAMPP MySQL is actually RUNNING.");
    } else if (error.code === 'P1003') {
      console.log("\n💡 Tip: The database specified in your URL might not exist.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

