import { NextResponse } from "next/server";
export async function GET() { return NextResponse.json({ error: "Module conversations supprimé" }, { status: 410 }); }
export async function DELETE() { return NextResponse.json({ error: "Module conversations supprimé" }, { status: 410 }); }
