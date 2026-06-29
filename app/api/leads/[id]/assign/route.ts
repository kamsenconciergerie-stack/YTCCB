import { NextResponse } from "next/server";
export async function POST() { return NextResponse.json({ error: "Module leads supprimé" }, { status: 410 }); }
