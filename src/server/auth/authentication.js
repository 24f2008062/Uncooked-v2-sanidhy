import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';

/**
 * Retrieves the current authenticated user context from Supabase or NextAuth session
 */
export async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();

    if (supabaseUser && !error) {
      // Fetch matching profile from database
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
        name: supabaseUser.user_metadata?.name || 'User',
        role: supabaseUser.user_metadata?.role || 'USER',
      };
    }
  } catch (err) {
    console.warn('[getCurrentUser] Supabase session fallback:', err.message);
  }

  return null;
}
