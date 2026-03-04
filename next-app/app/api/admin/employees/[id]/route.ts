import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.usertype !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const numberId = Number(id);
  const employee = await prisma.employee.findUnique({ where: { id: numberId }, include: { user: true } });
  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ employee });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.usertype !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const numberId = Number(id);
    const data = await request.json();

    const updated = await prisma.employee.update({ where: { id: numberId }, data });
    return NextResponse.json({ employee: updated });
  } catch (error) {
    console.error("Update employee error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.usertype !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const numberId = Number(id);
    await prisma.employee.delete({ where: { id: numberId } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("Delete employee error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
