import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Stars Law College: Initializing fresh system...\n");

  // NOTE: Seeding is disabled for production readiness.
  // Add critical system configuration here if needed.

  console.log("✅ Initialization complete. Ready for dynamic data.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
