import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/server/utils/passwordUtils";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("NextAuth authorize attempt for:", credentials?.email);
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password credentials");
        }

        const cleanEmail = credentials.email.toLowerCase().trim();

        // 1. Fetch user from PostgreSQL via Prisma
        const user = await prisma.user.findUnique({
          where: { email: cleanEmail },
        });

        if (!user) {
          console.log("NextAuth: No user found with email:", cleanEmail);
          throw new Error("Invalid credentials");
        }

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          console.log("NextAuth: User account locked until:", user.lockedUntil);
          throw new Error("Account is temporarily locked. Please try again later.");
        }

        const passwordToTest = user.passwordHash || user.password;

        if (!passwordToTest) {
          console.log("NextAuth: No password hash stored for user:", cleanEmail);
          throw new Error("Account relies on external OAuth login");
        }

        // 2. Verify password hash
        const isValid = await verifyPassword(credentials.password, passwordToTest);
        console.log("NextAuth: Password verification result for", cleanEmail, "->", isValid);

        if (!isValid) {
          // Increment failed login attempts
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: { increment: 1 } },
          });
          throw new Error("Invalid credentials");
        }

        // Reset failed login attempts on successful login
        if (user.failedLoginAttempts > 0) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
          });
        }

        console.log("NextAuth: Successful login for", cleanEmail, "Role:", user.role);

        return {
          id: user.id,
          email: user.email,
          name: user.name || user.fullName || "Campus User",
          role: user.role || "USER",
        };
      },

    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "uncooked_portal_dev_secret_key_32_characters_long",
};
