import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.usertype !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("search") || undefined;

  const employees = await prisma.employee.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
            { phone: { contains: q } },
          ],
        }
      : {},
    include: { user: true },
  });

  return NextResponse.json({ employees });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.usertype !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { userId, name, email, phone, job, avatar, documents, status } = data;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const created = await prisma.employee.create({
      data: {
        userId: Number(userId),
        name,
        email,
        phone,
        job,
        avatar,
        documents,
        status: status || "pending",
      },
    });

    return NextResponse.json({ employee: created }, { status: 201 });
  } catch (error) {
    console.error("Create employee error:", error);
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}
