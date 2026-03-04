import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = Number(session.user.id);
  const employee = await prisma.employee.findUnique({ where: { userId } });

  if (!employee || employee.status !== "approved") {
    return NextResponse.json({ error: "You are not authorized to view the work posting." }, { status: 403 });
  }

  return NextResponse.json({ employee });
}
