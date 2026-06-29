import { NextResponse } from "next/server";
export async function POST() { return NextResponse.json({ error: "Utiliser POST /api/admin/chaussures/import pour les imports CSV" }, { status: 301 }); }
