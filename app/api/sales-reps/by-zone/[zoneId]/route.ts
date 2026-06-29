import { NextResponse } from "next/server";
export async function GET() { return NextResponse.json({ error: "Utiliser /api/admin/livreurs" }, { status: 410 }); }
