import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/server/utils/passwordUtils";

export async function POST(req) {
  try {
    const body = await req.json();
    const { fullName, name, email, password, department, location } = body;

    const userEmail = email?.toLowerCase().trim();
    const userName = (fullName || name || "").trim();
    const userDept = (department || location || "").trim();

    if (!userEmail || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // 2. Hash password securely using scrypt
    const hashedPassword = await hashPassword(password);

    // 3. Create user record in PostgreSQL
    const user = await prisma.user.create({
      data: {
        email: userEmail,
        name: userName || userEmail.split("@")[0],
        fullName: userName,
        department: userDept || null,
        passwordHash: hashedPassword,
        role: "USER",
      },
    });

    return NextResponse.json(
      {
        message: "User registered successfully",
        userId: user.id,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error during registration" },
      { status: 500 }
    );
  }
}
