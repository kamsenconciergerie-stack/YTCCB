"use client";
import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { SignOutButton } from "@/components/admin/SignOutButton";

const NAV_ITEMS = [
  { href: "/admin",            label: "Dashboard",  icon: "📊" },
  { href: "/admin/commandes",  label: "Commandes",  icon: "📦" },
  { href: "/admin/catalogue",  label: "Catalogue",  icon: "👟" },
  { href: "/admin/livreurs",   label: "Livreurs",   icon: "🚚" },
  { href: "/admin/clients",    label: "Clients",    icon: "👥" },
  { href: "/admin/reporting",  label: "Reporting",  icon: "📈" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SessionProvider>
      <div className="min-h-screen flex bg-gray-50">
        {/* Sidebar */}
        <aside className="w-60 shrink-0 flex flex-col bg-[#1A1A1A] text-white">
          <div className="h-16 flex items-center px-6 border-b border-white/10">
            <span className="text-xl font-black uppercase tracking-wide" style={{ color: "#C4956A" }}>MTS</span>
            <span className="ml-2 text-white/60 text-xs uppercase tracking-wider font-semibold">Admin</span>
          </div>

          <nav className="flex-1 py-4 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 mx-3 px-3 py-2.5 text-sm font-medium transition-colors mb-1 ${
                    active
                      ? "bg-[#C4956A] text-white"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </a>
              );
            })}
          </nav>

          <SignOutButton />
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6">
            <div className="flex-1" />
            <p className="text-sm text-gray-400">Mor Talla Sandaga — Back-office</p>
          </header>
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
