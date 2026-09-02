import { randomUUID } from "crypto";
import CredentialsProviderRaw from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/server/utils/passwordUtils";
import { sessionCookieName, sessionCookieOptions } from "@/server/config/authCookies";
import { LOGIN_LOCKOUT_MS, LOGIN_LOCKOUT_THRESHOLD, SESSION_MAX_AGE_SEC } from "@/server/config/legal";
import { requireAuthSecret } from "@/server/security/secrets";

const CredentialsProvider =
  typeof CredentialsProviderRaw === "function"
    ? CredentialsProviderRaw
    : CredentialsProviderRaw.default;

export function getSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (secret && secret.length >= 32 && !secret.includes("dev_secret") && !secret.includes("change-me")) {
    return secret;
  }
  // During `next build`, Next may import this module while collecting page
  // data. Never use a known runtime fallback — only a build-phase stand-in.
  if (process.env.NEXT_PHASE === "phase-production-build" && !process.env.NEXTAUTH_SECRET) {
    return "build-phase-only-secret-not-valid-at-runtime-xx";
  }
  return requireAuthSecret();
}

export const authOptions = {
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("INVALID_CREDENTIALS");
        }

        const cleanEmail = credentials.email.toLowerCase().trim();
        let user;
        try {
          user = await prisma.user.findUnique({
            where: { email: cleanEmail },
          });
        } catch {
          throw new Error("INVALID_CREDENTIALS");
        }

        if (!user || user.deletedAt || !user.passwordHash) {
          throw new Error("INVALID_CREDENTIALS");
        }

        if (user.disabledAt) {
          throw new Error("INVALID_CREDENTIALS");
        }

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error("INVALID_CREDENTIALS");
        }

        const isValid = await verifyPassword(credentials.password, user.passwordHash);
        if (!isValid) {
          const attempts = (user.failedLoginAttempts || 0) + 1;
          const lock = attempts >= LOGIN_LOCKOUT_THRESHOLD
            ? new Date(Date.now() + LOGIN_LOCKOUT_MS)
            : null;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: attempts,
              lockedUntil: lock,
            },
          });
          throw new Error("INVALID_CREDENTIALS");
        }

        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name || user.fullName || "Campus User",
          role: user.role || "USER",
          tokenVersion: user.tokenVersion || 0,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SEC,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE_SEC,
  },
  cookies: {
    sessionToken: {
      name: sessionCookieName(),
      options: sessionCookieOptions(),
    },
    csrfToken: {
      name: process.env.NODE_ENV === "production" ? "__Host-uncooked.csrf-token" : "uncooked.csrf-token",
      options: { ...sessionCookieOptions(), httpOnly: true },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === "production" ? "__Secure-uncooked.callback-url" : "uncooked.callback-url",
      options: { sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production" },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.ver = user.tokenVersion ?? 0;
        token.jti = randomUUID();
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.ver = token.ver;
        session.user.jti = token.jti;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: getSecret(),
};
