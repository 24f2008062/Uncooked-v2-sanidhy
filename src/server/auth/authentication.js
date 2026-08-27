import { createClient } from '@/lib/supabase/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from '@/lib/prisma';

/**
 * Retrieves the current authenticated user context from NextAuth session or Supabase session
 */
export async function getCurrentUser(req) {
  // 1. Try NextAuth session first
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email.toLowerCase().trim() },
      });
      if (dbUser) return dbUser;

      return {
        id: session.user.id,
        email: session.user.email,
        fullName: session.user.name,
        role: session.user.role || 'USER',
      };
    }
  } catch (err) {
    // Fall through to Supabase check
  }

  // 2. Try Supabase Auth session
  try {
    const supabase = await createClient();
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();

    if (supabaseUser && !error) {
      const profile = await prisma.user.findFirst({
        where: {
          OR: [
            { id: supabaseUser.id },
            { email: supabaseUser.email }
          ]
        }
      });

      return profile || {
        id: supabaseUser.id,
        email: supabaseUser.email,
        fullName: supabaseUser.user_metadata?.name || 'User',
        role: supabaseUser.user_metadata?.role || 'USER',
      };
    }
  } catch (err) {
    console.warn('[getCurrentUser] Supabase session check failed:', err.message);
  }

  return null;
}

