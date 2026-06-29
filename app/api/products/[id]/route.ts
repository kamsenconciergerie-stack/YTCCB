import { NextResponse } from "next/server";
export async function GET() { return NextResponse.json({ error: "Utiliser GET /api/chaussures/[id]" }, { status: 301 }); }
