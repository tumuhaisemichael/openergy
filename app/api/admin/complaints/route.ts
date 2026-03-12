import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.usertype !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const complaints = await prisma.complaint.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ complaints });
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.usertype !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, status, priority } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Missing complaint id." }, { status: 400 });
    }

    const existing = await prisma.complaint.findUnique({
      where: { id: Number(id) },
      include: { user: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Complaint not found." }, { status: 404 });
    }

    const complaint = await prisma.complaint.update({
      where: { id: Number(id) },
      data: {
        ...(status ? { status: String(status) } : {}),
        ...(priority ? { priority: String(priority) } : {}),
      },
    });

    if (status && status === "closed" && existing.status !== "closed") {
      await prisma.notification.create({
        data: {
          userId: existing.userId,
          role: "user",
          title: "Complaint Resolved",
          body: `Your complaint "${existing.subject}" has been marked as resolved.`,
        },
      });
    }

    return NextResponse.json({ complaint });
  } catch (error) {
    console.error("Update complaint error:", error);
    return NextResponse.json({ error: "Failed to update complaint." }, { status: 500 });
  }
}
