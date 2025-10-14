// app/api/users/stats/route.ts
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const total = await prisma.user.count();
    const active = await prisma.user.count({ where: { status: "active" } });
    const inactive = await prisma.user.count({ where: { status: "inactive" } });
    const pro = await prisma.user.count({ where: { role: "pro" } });
    return NextResponse.json({ total, active, inactive, pro });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}