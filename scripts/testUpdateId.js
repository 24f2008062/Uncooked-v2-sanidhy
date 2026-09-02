const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  try {
    const admin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });
    
    if (!admin) {
      console.log("No super admin found");
      return;
    }
    console.log("Found admin:", admin.email, admin.id);
    
    // Check if ID is already a UUID
    if (admin.id.length === 36 && admin.id.includes('-')) {
       console.log("Admin ID is already a UUID!");
       return;
    }
    
    const newId = crypto.randomUUID();
    console.log("Attempting to update ID to:", newId);
    
    // Test update
    await prisma.user.update({
      where: { email: admin.email },
      data: { id: newId }
    });
    console.log("Update successful!");
    
    // Revert
    await prisma.user.update({
      where: { email: admin.email },
      data: { id: admin.id }
    });
    console.log("Reverted successfully.");
  } catch (err) {
    console.error("Error updating ID:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
