const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const admin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });
    
    if (!admin) {
      console.log("No SUPER_ADMIN found in DB!");
      return;
    }
    
    console.log("Admin Email:", admin.email);
    console.log("Admin ID:", admin.id);
    console.log("Has Password Hash:", !!admin.passwordHash);
    
    if (admin.passwordHash) {
      console.log("Hash starts with:", admin.passwordHash.substring(0, 15) + "...");
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
