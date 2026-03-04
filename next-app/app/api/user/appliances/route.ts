import { NextRequest, NextResponse } from "next/server";

const appliances = [
  { name: "Fridge", power: 150 },
  { name: "TV", power: 100 },
  { name: "Washing Machine", power: 500 },
  { name: "Electric Iron", power: 1000 },
  { name: "Microwave", power: 1200 },
  { name: "Laptop", power: 65 },
  { name: "Fan", power: 70 },
  { name: "Lights", power: 60 },
];

export async function GET(request: NextRequest) {
  return NextResponse.json({ appliances });
}
