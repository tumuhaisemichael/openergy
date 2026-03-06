import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Placeholder data for connected devices
  const connected = [{ id: 1, name: "Smart Meter", status: "online" }];
  return NextResponse.json({ connected });
}
