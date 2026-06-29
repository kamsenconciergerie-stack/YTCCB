import { NextResponse } from "next/server";

export async function GET() { return NextResponse.json({ error: "Utiliser /api/admin/chaussures/[id]" }, { status: 301 }); }
export async function PATCH() { return NextResponse.json({ error: "Utiliser PATCH /api/admin/chaussures/[id]" }, { status: 301 }); }
export async function DELETE() { return NextResponse.json({ error: "Utiliser DELETE /api/admin/chaussures/[id]" }, { status: 301 }); }
