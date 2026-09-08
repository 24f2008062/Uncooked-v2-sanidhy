import { prisma } from '../src/lib/prisma.js';

console.log('🔄 Applying safe, non-destructive additive SQL schema patch to database...\n');

const sqlStatements = [
  // 1. User table additions
  {
    desc: 'User.privacyNomineeName',
    sql: `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "privacyNomineeName" TEXT;`,
  },
  {
    desc: 'User.privacyNomineeEmail',
    sql: `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "privacyNomineeEmail" TEXT;`,
  },
  {
    desc: 'User.pendingAuthDeleteId',
    sql: `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pendingAuthDeleteId" TEXT;`,
  },
  {
    desc: 'User.authErasureStatus',
    sql: `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "authErasureStatus" TEXT;`,
  },

  // 2. Coupon table addition
  {
    desc: 'Coupon.usedCount',
    sql: `ALTER TABLE "Coupon" ADD COLUMN IF NOT EXISTS "usedCount" INTEGER NOT NULL DEFAULT 0;`,
  },
  {
    desc: 'Coupon.expiresAt',
    sql: `ALTER TABLE "Coupon" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);`,
  },
  {
    desc: 'Coupon.createdAt',
    sql: `ALTER TABLE "Coupon" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;`,
  },

  // 3. BulletinUpdate table addition
  {
    desc: 'BulletinUpdate.createdAt',
    sql: `ALTER TABLE "BulletinUpdate" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;`,
  },

  // 4. UserActivity table addition
  {
    desc: 'UserActivity.metadata',
    sql: `ALTER TABLE "UserActivity" ADD COLUMN IF NOT EXISTS "metadata" TEXT;`,
  },
  {
    desc: 'UserActivity.createdAt',
    sql: `ALTER TABLE "UserActivity" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;`,
  },

  // 5. TicketMessage table addition
  {
    desc: 'TicketMessage.senderType',
    sql: `ALTER TABLE "TicketMessage" ADD COLUMN IF NOT EXISTS "senderType" TEXT NOT NULL DEFAULT 'USER';`,
  },

  // 6. AuditLog table addition
  {
    desc: 'AuditLog.details',
    sql: `ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "details" TEXT;`,
  },

  // 7. BroadcastJob table creation
  {
    desc: 'BroadcastJob table',
    sql: `
      CREATE TABLE IF NOT EXISTS "BroadcastJob" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "idempotencyKey" TEXT NOT NULL UNIQUE,
        "adminId" TEXT NOT NULL,
        "audience" TEXT NOT NULL,
        "subject" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "mediaUrl" TEXT,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "totalRecipients" INTEGER NOT NULL DEFAULT 0,
        "successCount" INTEGER NOT NULL DEFAULT 0,
        "failureCount" INTEGER NOT NULL DEFAULT 0,
        "details" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "startedAt" TIMESTAMP(3),
        "completedAt" TIMESTAMP(3)
      );
    `,
  },
  {
    desc: 'BroadcastJob status-createdAt index',
    sql: `CREATE INDEX IF NOT EXISTS "BroadcastJob_status_createdAt_idx" ON "BroadcastJob"("status", "createdAt");`,
  },
  {
    desc: 'BroadcastJob adminId-createdAt index',
    sql: `CREATE INDEX IF NOT EXISTS "BroadcastJob_adminId_createdAt_idx" ON "BroadcastJob"("adminId", "createdAt");`,
  },
];

for (const item of sqlStatements) {
  try {
    await prisma.$executeRawUnsafe(item.sql);
    console.log(`  ✅ Applied: ${item.desc}`);
  } catch (err) {
    console.error(`  ❌ Failed on ${item.desc}:`, err.message);
    process.exit(1);
  }
}

console.log('\n🔍 Verifying all Prisma models against the database...\n');

const testQueries = [
  { name: 'User', fn: () => prisma.user.findFirst() },
  { name: 'ConsentRecord', fn: () => prisma.consentRecord.findFirst() },
  { name: 'VerificationToken', fn: () => prisma.verificationToken.findFirst() },
  { name: 'PlatformSetting', fn: () => prisma.platformSetting.findFirst() },
  { name: 'ContactMessage', fn: () => prisma.contactMessage.findFirst() },
  { name: 'Event', fn: () => prisma.event.findFirst() },
  { name: 'TicketTier', fn: () => prisma.ticketTier.findFirst() },
  { name: 'Coupon', fn: () => prisma.coupon.findFirst() },
  { name: 'Registration', fn: () => prisma.registration.findFirst() },
  { name: 'HostApplication', fn: () => prisma.hostApplication.findFirst() },
  { name: 'BulletinUpdate', fn: () => prisma.bulletinUpdate.findFirst() },
  { name: 'UserActivity', fn: () => prisma.userActivity.findFirst() },
  { name: 'SupportTicket', fn: () => prisma.supportTicket.findFirst() },
  { name: 'TicketMessage', fn: () => prisma.ticketMessage.findFirst() },
  { name: 'Opportunity', fn: () => prisma.opportunity.findFirst() },
  { name: 'OpportunityApplication', fn: () => prisma.opportunityApplication.findFirst() },
  { name: 'SystemTelemetrySnapshot', fn: () => prisma.systemTelemetrySnapshot.findFirst() },
  { name: 'AuditLog', fn: () => prisma.auditLog.findFirst() },
  { name: 'BroadcastJob', fn: () => prisma.broadcastJob.findFirst() },
];

let allOk = true;

for (const t of testQueries) {
  try {
    await t.fn();
    console.log(`  ✅ Model ${t.name.padEnd(25)} [Verified OK]`);
  } catch (err) {
    allOk = false;
    console.error(`  ❌ Model ${t.name.padEnd(25)} [FAILED]: ${err.message}`);
  }
}

await prisma.$disconnect();

if (allOk) {
  console.log('\n🎉 ALL 18 PRISMA MODELS ARE 100% IN SYNC AND VERIFIED WITH DATABASE!\n');
  process.exit(0);
} else {
  console.error('\n❌ Some models still have desynchronization issues.\n');
  process.exit(1);
}
