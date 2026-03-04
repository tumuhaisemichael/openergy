import { NextRequest, NextResponse } from "next/server";
import { signOut } from "next-auth/react";

export async function POST(request: NextRequest) {
  try {
    // SignOut logic is handled by NextAuth middleware on client side
    return NextResponse.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
}
