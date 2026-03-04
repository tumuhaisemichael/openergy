import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

function writeBase64File(base64: string, folder: string, filenamePrefix: string) {
  const matches = base64.match(/^data:(.+);base64,(.+)$/);
  let data = base64;
  let ext = "bin";
  if (matches) {
    const mime = matches[1];
    data = matches[2];
    ext = mime.split("/").pop() || "bin";
  }
  const buffer = Buffer.from(data, "base64");
  const name = `${filenamePrefix}-${Date.now()}.${ext}`;
  const publicDir = path.join(process.cwd(), "next-app", "public", "uploads", folder);
  // Note: using next-app/public/uploads to keep files inside the Next project
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const filePath = path.join(publicDir, name);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/${folder}/${name}`;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const userId = Number(session.user.id);
    const { name, phone, job, avatarBase64, documentsBase64 } = data;

    let avatarPath: string | null = null;
    let documentsPath: string | null = null;

    if (avatarBase64) {
      avatarPath = writeBase64File(avatarBase64, "avatars", `avatar-${userId}`);
    }
    if (documentsBase64) {
      documentsPath = writeBase64File(documentsBase64, "documents", `docs-${userId}`);
    }

    const employee = await prisma.employee.upsert({
      where: { userId },
      update: {
        name: name || undefined,
        phone: phone || undefined,
        job: job || undefined,
        avatar: avatarPath || undefined,
        documents: documentsPath || undefined,
        status: "pending",
      },
      create: {
        userId,
        name,
        email: session.user.email || "",
        phone: phone || "",
        job: job || "",
        avatar: avatarPath || null,
        documents: documentsPath || null,
        status: "pending",
      },
    });

    return NextResponse.json({ employee });
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json({ error: "Failed to update employee" }, { status: 500 });
  }
}
