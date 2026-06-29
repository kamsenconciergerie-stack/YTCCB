import { NextResponse } from "next/server";
export async function POST() { return NextResponse.json({ error: "Utiliser POST /api/checkout" }, { status: 301 }); }
export async function GET() { return NextResponse.json({ error: "Utiliser GET /api/admin/orders" }, { status: 301 }); }
