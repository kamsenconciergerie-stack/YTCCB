"use client";
import { signOut, useSession } from "next-auth/react";

export function SignOutButton() {
  const { data: session } = useSession();
  return (
    <div className="p-4 border-t border-white/10">
      {session?.user && (
        <p className="text-xs text-white/40 mb-2 truncate">{session.user.name}</p>
      )}
      <button
        onClick={() => signOut({ callbackUrl: "/admin/login" })}
        className="w-full text-left text-sm text-white/60 hover:text-white transition-colors"
      >
        Déconnexion
      </button>
    </div>
  );
}
