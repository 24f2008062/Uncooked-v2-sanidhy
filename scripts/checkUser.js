const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { email: 'test@test12345.com' }
  });
  console.log("Users found:", users.length);
  if (users.length > 0) {
    console.log("User details:", users[0]);
  }
}
main().finally(() => prisma.$disconnect());
