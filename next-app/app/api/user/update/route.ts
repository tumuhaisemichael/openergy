import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, phone } = await request.json();
    const userId = Number(session.user.id);

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
