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
    const { appliances } = await request.json();
    const userId = Number(session.user.id);

    // Delete existing saved appliances for this user
    await prisma.savedAppliance.deleteMany({ where: { userId } });

    // Create new entries
    const created = await prisma.savedAppliance.createMany({
      data: appliances.map((a: any) => ({
        userId,
        name: a.name,
        power: a.power,
        hoursPerDay: Number(a.hoursPerDay || 0),
      })),
    });

    return NextResponse.json({ message: "Appliances saved successfully", count: created.count });
  } catch (error) {
    console.error("Save appliances error:", error);
    return NextResponse.json({ error: "Failed to save appliances" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = Number(session.user.id);
  const appliances = await prisma.savedAppliance.findMany({ where: { userId } });

  return NextResponse.json({ appliances });
}
