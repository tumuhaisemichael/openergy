import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { subject, message, priority } = await request.json();
    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(session.user.id) },
      select: { name: true, email: true },
    });

    const complaint = await prisma.complaint.create({
      data: {
        userId: Number(session.user.id),
        subject: String(subject).trim(),
        message: String(message).trim(),
        priority: priority ? String(priority) : "normal",
      },
    });

    await prisma.notification.create({
      data: {
        role: "admin",
        title: "New Complaint",
        body: `${user?.name || "User"} (${user?.email || "unknown email"}) submitted: ${complaint.subject}`,
      },
    });

    return NextResponse.json({ complaint }, { status: 201 });
  } catch (error) {
    console.error("Create complaint error:", error);
    return NextResponse.json({ error: "Failed to submit complaint." }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const complaints = await prisma.complaint.findMany({
    where: { userId: Number(session.user.id) },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ complaints });
}
