import { NextResponse } from "next/server";

// Route dépréciée — utiliser /api/admin/chaussures
export async function GET() {
  return NextResponse.redirect("/api/admin/chaussures", 301);
}
export async function POST() {
  return NextResponse.json({ error: "Utiliser POST /api/admin/chaussures" }, { status: 301 });
}
