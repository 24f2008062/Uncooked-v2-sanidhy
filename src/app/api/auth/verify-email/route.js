import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const email = searchParams.get("email")?.toLowerCase().trim();

    if (!token || !email) {
      return NextResponse.redirect(new URL("/login?error=invalid_verification_link", req.url));
    }

    const verificationRecord = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        token: token,
        purpose: "EMAIL_VERIFICATION",
      },
    });

    if (!verificationRecord) {
      return NextResponse.redirect(new URL("/login?error=invalid_verification_token", req.url));
    }

    if (new Date() > new Date(verificationRecord.expires)) {
      await prisma.verificationToken.deleteMany({
        where: {
          identifier: email,
          purpose: "EMAIL_VERIFICATION",
        },
      });
      return NextResponse.redirect(new URL("/login?error=expired_verification_link", req.url));
    }

    // Mark email verified on User
    await prisma.user.update({
      where: { email },
      data: {
        emailVerified: new Date(),
      },
    });

    // Delete used token
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: email,
        purpose: "EMAIL_VERIFICATION",
      },
    });

    return NextResponse.redirect(new URL("/login?verified=true", req.url));
  } catch (error) {
    console.error("[VerifyEmail] Error verifying token:", error);
    return NextResponse.redirect(new URL("/login?error=verification_failed", req.url));
  }
}
