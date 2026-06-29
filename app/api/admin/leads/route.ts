import { NextResponse } from "next/server";
export async function GET() { return NextResponse.json({ error: "Module leads supprimé" }, { status: 410 }); }
