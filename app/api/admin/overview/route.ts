import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.usertype !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const [totalUsers, totalAppliances, openComplaints, totalComplaints, newUsers7d, newUsers30d, unreadAdminNotifications] = await Promise.all([
    prisma.user.count({ where: { usertype: "user" } }),
    prisma.savedAppliance.count(),
    prisma.complaint.count({ where: { status: "open" } }),
    prisma.complaint.count(),
    prisma.user.count({ where: { usertype: "user", createdAt: { gte: sevenDaysAgo } } }),
    prisma.user.count({ where: { usertype: "user", createdAt: { gte: thirtyDaysAgo } } }),
    prisma.notification.count({ where: { role: "admin", readAt: null } }),
  ]);

  const topAppliancesRaw = await prisma.savedAppliance.findMany({
    select: { name: true, power: true },
  });

  const topAppliancesMap = new Map<string, { count: number; avgPower: number }>();
  topAppliancesRaw.forEach((item) => {
    const key = item.name.trim().toLowerCase();
    const existing = topAppliancesMap.get(key) || { count: 0, avgPower: 0 };
    const nextCount = existing.count + 1;
    const nextAvg = (existing.avgPower * existing.count + Number(item.power)) / nextCount;
    topAppliancesMap.set(key, { count: nextCount, avgPower: nextAvg });
  });

  const topAppliances = Array.from(topAppliancesMap.entries())
    .map(([name, data]) => ({ name, count: data.count, avgPower: Number(data.avgPower.toFixed(0)) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const usersWithAppliances = await prisma.user.count({
    where: { usertype: "user", savedAppliances: { some: {} } },
  });

  const avgAppliancesPerUser = totalUsers > 0 ? Number((totalAppliances / totalUsers).toFixed(1)) : 0;

  return NextResponse.json({
    totalUsers,
    usersWithAppliances,
    avgAppliancesPerUser,
    totalAppliances,
    openComplaints,
    totalComplaints,
    newUsers7d,
    newUsers30d,
    topAppliances,
    unreadAdminNotifications,
  });
}
