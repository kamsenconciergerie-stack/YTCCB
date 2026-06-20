import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { NextResponse } from "next/server";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { session: null, error: NextResponse.json({ error: "Non autorisé" }, { status: 401 }) };
  }
  return { session, error: null };
}

export async function requireAdminSession() {
  const { session, error } = await requireSession();
  if (error || !session) return { session: null, error: error! };
  if (session.user.role !== "ADMIN") {
    return { session: null, error: NextResponse.json({ error: "Accès réservé aux admins" }, { status: 403 }) };
  }
  return { session, error: null };
}
