import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

dotenv.config({ path: ".env.local" });
dotenv.config();

const scryptAsync = promisify(scrypt);
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed");
}
const useSsl = Boolean(
  connectionString.includes("supabase") ||
    connectionString.includes("pooler") ||
    connectionString.includes("sslmode=require") ||
    process.env.DATABASE_SSL === "true"
);
const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true" } : undefined,
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  console.log("🌱 Starting Uncooked Portal database seeding...");

  // 1. Seed Accounts
  const seedEmails = ["admin@uncooked.edu", "host@uncooked.edu", "student@uncooked.edu"];
  for (const email of seedEmails) {
    try {
      await prisma.$executeRaw`DELETE FROM auth.users WHERE LOWER(email) = ${email}`;
    } catch {
      // Ignore if auth.users is unavailable
    }
  }

  const adminPassword = await hashPassword("AdminSecret123!");
  const hostPassword = await hashPassword("HostSecret123!");
  const studentPassword = await hashPassword("StudentSecret123!");

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@uncooked.edu" },
    update: {
      passwordHash: adminPassword,
      authUserId: null,
      role: "SUPER_ADMIN",
      onboardingCompleted: true,
      emailVerified: new Date(),
    },
    create: {
      email: "admin@uncooked.edu",
      name: "Super Admin",
      fullName: "Super Admin",
      passwordHash: adminPassword,
      role: "SUPER_ADMIN",
      onboardingCompleted: true,
      emailVerified: new Date(),
    },
  });

  const hostUser = await prisma.user.upsert({
    where: { email: "host@uncooked.edu" },
    update: {
      passwordHash: hostPassword,
      authUserId: null,
      role: "ORGANIZER",
      onboardingCompleted: true,
      emailVerified: new Date(),
    },
    create: {
      email: "host@uncooked.edu",
      name: "Campus Cultural Board",
      fullName: "Campus Cultural Board",
      passwordHash: hostPassword,
      role: "ORGANIZER",
      onboardingCompleted: true,
      emailVerified: new Date(),
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: "student@uncooked.edu" },
    update: {
      passwordHash: studentPassword,
      authUserId: null,
      role: "USER",
      onboardingCompleted: true,
      emailVerified: new Date(),
    },
    create: {
      email: "student@uncooked.edu",
      name: "Alex Rivera",
      fullName: "Alex Rivera",
      passwordHash: studentPassword,
      role: "USER",
      department: "Computer Science",
      onboardingCompleted: true,
      interests: JSON.stringify(["Hackathons", "Tech", "Workshops"]),
      emailVerified: new Date(),
    },
  });

  console.log(`✅ Users seeded: SuperAdmin (${superAdmin.email}), Host (${hostUser.email}), Student (${studentUser.email})`);

  // 2. Seed Events
  const events = [
    {
      id: "ai-llm-summit",
      title: "AI & Generative LLM Summit 2026",
      type: "Hackathons",
      category: "Tech",
      tags: JSON.stringify(["AI", "LLM", "Hackathon", "Coding"]),
      keywords: JSON.stringify(["python", "nextjs", "openai", "agent"]),
      popularityScore: 92.5,
      date: new Date("2026-09-15T10:00:00Z"),
      location: "Main Auditorium, Block C",
      zone: "Gomti Nagar",
      description: "Join 300+ student developers building next-gen autonomous agent applications and generative AI systems over 36 hours.",
      ticketType: "Free",
      price: 0,
      capacity: 400,
      bannerUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: "neon-sunset-fest",
      title: "Neon Sunset Beach Fest 2026",
      type: "Fest",
      category: "Cultural Fests",
      tags: JSON.stringify(["Music", "Fest", "Dance", "Culture"]),
      keywords: JSON.stringify(["dj", "stage", "concert", "lights"]),
      popularityScore: 98.0,
      date: new Date("2026-09-20T18:00:00Z"),
      location: "Sunset Pavilion Grounds",
      zone: "Hussainganj",
      description: "The annual campus neon light and music festival featuring indie band lineups, DJ sets, food stalls, and laser light shows.",
      ticketType: "Paid",
      price: 15,
      capacity: 1000,
      bannerUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: "cybersec-bootcamp",
      title: "CyberSecurity & Ethical Hacking",
      type: "Workshop",
      category: "Workshops",
      tags: JSON.stringify(["Cybersec", "Hacking", "Linux", "Security"]),
      keywords: JSON.stringify(["ctf", "kali", "pentest", "network"]),
      popularityScore: 78.4,
      date: new Date("2026-10-02T14:00:00Z"),
      location: "Tech Lab 4, Science Wing",
      zone: "Chowk",
      description: "Hands-on cybersecurity bootcamp covering penetration testing, network defense, web security, and Capture-The-Flag challenges.",
      ticketType: "Free",
      price: 0,
      capacity: 200,
      bannerUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=600&auto=format&fit=crop",
    },
  ];

  for (const ev of events) {
    await prisma.event.upsert({
      where: { id: ev.id },
      update: {},
      create: ev,
    });
  }
  console.log(`✅ ${events.length} Events seeded successfully.`);

  // 3. Seed Opportunities
  const opportunities = [
    {
      id: "opp-fullstack-intern",
      title: "Fullstack Engineering Intern (Next.js & Node)",
      company: "Uncooked Labs",
      type: "Internship",
      location: "Remote",
      stipend: "₹25,000 / month",
      description: "Looking for an energetic student fullstack developer proficient in Next.js, React 19, TypeScript, and PostgreSQL to work on core platform features.",
    },
    {
      id: "opp-ai-agent-bounty",
      title: "AI Agent Integration Bounty",
      company: "Campus Tech Collective",
      type: "Bounty",
      location: "Remote",
      stipend: "₹50,000 one-time",
      description: "Build an autonomous event summary and recommendation agent using Gemini API and integrate it with our WebSocket notification channel.",
    },
  ];

  for (const opp of opportunities) {
    await prisma.opportunity.upsert({
      where: { id: opp.id },
      update: {},
      create: opp,
    });
  }
  console.log(`✅ ${opportunities.length} Opportunities seeded successfully.`);

  console.log("🌱 Database seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
