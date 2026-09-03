import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

const PUBLIC_USER_SELECT = {
  id: true,
  authUserId: true,
  role: true,
  permissions: true,
  name: true,
  fullName: true,
  email: true,
  emailVerified: true,
  department: true,
  clubAssociation: true,
  interests: true,
  onboardingCompleted: true,
  failedLoginAttempts: true,
  lockedUntil: true,
  tokenVersion: true,
  ageAttested18: true,
  termsAcceptedAt: true,
  privacyAcceptedAt: true,
  disabledAt: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
};

export function isAccountBlocked(user) {
  if (!user) return true;
  if (user.deletedAt) return true;
  if (user.disabledAt) return true;
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) return true;
  return false;
}

export async function getAuthUserAndProfile() {
  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return { authUser: null, user: null, state: "NO_SUPABASE_SESSION" };
    }

    // 1. Primary resolution by authUserId
    let user = await prisma.user.findUnique({
      where: { authUserId: authUser.id },
      select: PUBLIC_USER_SELECT,
    });

    if (user) {
      if (isAccountBlocked(user)) {
        console.warn(`[AUTH_RESOLVE] Account blocked for userId: ${user.id} authUserId: ${authUser.id}`);
        return { authUser, user: null, state: "ACCOUNT_BLOCKED" };
      }
      return { authUser, user, state: "AUTHENTICATED" };
    }

    // 2. Hardened Verified-Email Fallback & Auto-Heal
    const isEmailVerified = Boolean(
      authUser.email && (authUser.email_confirmed_at || authUser.confirmed_at || authUser.user_metadata?.email_verified)
    );

    if (isEmailVerified && authUser.email) {
      const normalizedEmail = authUser.email.toLowerCase().trim();
      const matchingUsers = await prisma.user.findMany({
        where: { email: normalizedEmail },
        select: PUBLIC_USER_SELECT,
      });

      if (matchingUsers.length === 1) {
        const candidateUser = matchingUsers[0];

        // Verify ALL 4 Hardening Conditions:
        // 1. Email is verified (checked above)
        // 2. Exactly 1 email match (checked above)
        // 3. candidateUser.authUserId IS NULL
        // 4. authUser.id not already mapped to another User record
        if (candidateUser.authUserId === null) {
          const existingMapping = await prisma.user.findUnique({
            where: { authUserId: authUser.id },
            select: { id: true },
          });

          if (!existingMapping) {
            try {
              user = await prisma.user.update({
                where: { id: candidateUser.id },
                data: { authUserId: authUser.id },
                select: PUBLIC_USER_SELECT,
              });

              console.log(`[AUTH_IDENTITY_AUTO_HEAL] userId: ${user.id} authUserId: ${authUser.id} method: VERIFIED_EMAIL status: SUCCESS`);

              if (isAccountBlocked(user)) {
                return { authUser, user: null, state: "ACCOUNT_BLOCKED" };
              }
              return { authUser, user, state: "AUTHENTICATED" };
            } catch (healErr) {
              console.error(`[AUTH_IDENTITY_AUTO_HEAL] userId: ${candidateUser.id} authUserId: ${authUser.id} method: VERIFIED_EMAIL status: FAILURE error: ${healErr.message}`);
            }
          } else {
            console.warn(`[AUTH_IDENTITY_AUTO_HEAL] IDENTITY_CONFLICT userId: ${candidateUser.id} authUserId: ${authUser.id} reason: AUTH_USER_ALREADY_MAPPED_TO_${existingMapping.id}`);
          }
        } else {
          console.warn(`[AUTH_IDENTITY_AUTO_HEAL] IDENTITY_CONFLICT userId: ${candidateUser.id} authUserId: ${authUser.id} reason: CANDIDATE_USER_ALREADY_MAPPED_TO_${candidateUser.authUserId}`);
        }
      } else if (matchingUsers.length > 1) {
        console.warn(`[AUTH_IDENTITY_AUTO_HEAL] IDENTITY_CONFLICT authUserId: ${authUser.id} reason: MULTIPLE_EMAIL_MATCHES_COUNT_${matchingUsers.length}`);
      }
    } else {
      console.log(`[AUTH_RESOLVE] Email fallback skipped for authUserId: ${authUser.id} (email not verified)`);
    }

    console.warn(`[AUTH_RESOLVE] PROFILE_NOT_PROVISIONED authUserId: ${authUser.id}`);
    return { authUser, user: null, state: "AUTHENTICATED_BUT_PROFILE_MISSING" };

  } catch (err) {
    console.error("[AUTH_RESOLVE] Database lookup error:", err.message);
    return { authUser: null, user: null, state: "DATABASE_FAILURE" };
  }
}

export async function getCurrentUser() {
  const { user } = await getAuthUserAndProfile();
  return user;
}
