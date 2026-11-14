// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Automatically seed/create default owner account on first login if table is empty
    const userCount = await db.user.count();
    if (userCount === 0) {
      await db.user.create({
        data: {
          username: "owner",
          password: "123",
          role: "OWNER",
        },
      });
    }

    const user = await db.user.findUnique({
      where: { username },
    });

    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: { username: user.username, role: user.role },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}