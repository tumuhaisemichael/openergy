import { NextResponse } from "next/server";

const appliances = [
  { name: "Fridge", power: 150, hoursPerDay: 24 },
  { name: "TV", power: 100, hoursPerDay: 4 },
  { name: "Washing Machine", power: 500, hoursPerDay: 1 },
  { name: "Electric Iron", power: 1000, hoursPerDay: 0.5 },
  { name: "Microwave", power: 1200, hoursPerDay: 0.5 },
  { name: "Laptop", power: 65, hoursPerDay: 6 },
  { name: "Fan", power: 70, hoursPerDay: 8 },
  { name: "Lights", power: 60, hoursPerDay: 6 },
  { name: "Air Conditioner", power: 1500, hoursPerDay: 8 },
  { name: "Electric Kettle", power: 2000, hoursPerDay: 0.3 },
  { name: "Rice Cooker", power: 700, hoursPerDay: 1 },
  { name: "Water Heater", power: 3000, hoursPerDay: 1 },
  { name: "Phone Charger", power: 10, hoursPerDay: 3 },
  { name: "Router", power: 12, hoursPerDay: 24 },
  { name: "Desktop Computer", power: 200, hoursPerDay: 5 },
  { name: "Dishwasher", power: 1200, hoursPerDay: 1 },
  { name: "Blender", power: 400, hoursPerDay: 0.2 },
  { name: "Toaster", power: 800, hoursPerDay: 0.2 },
  { name: "Vacuum Cleaner", power: 900, hoursPerDay: 0.5 },
  { name: "Electric Oven", power: 2400, hoursPerDay: 1 },
];

export async function GET() {
  return NextResponse.json({ appliances });
}
