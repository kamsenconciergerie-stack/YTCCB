"use client";
import { CartProvider } from "@/components/CartContext";
import { CartCount } from "@/components/CartCount";
import Link from "next/link";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace("+", "") ?? "221700000000";

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col" style={{ background: "#FFFFFF", color: "#1A1A1A" }}>
        {/* ── Header ─────────────────────────────────────── */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Mor Talla Sandaga" className="h-10 w-auto object-contain" />
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-6">
              <Link href="/catalogue" className="hidden md:block text-sm font-medium text-[#1A1A1A] hover:text-[#C4956A] transition-colors tracking-wide uppercase">
                Boutique
              </Link>
              <Link href="/suivi" className="hidden md:block text-sm font-medium text-[#1A1A1A] hover:text-[#C4956A] transition-colors tracking-wide uppercase">
                Suivi
              </Link>
              <CartCount />
              <a
                href={`https://wa.me/${waNumber}?text=Bonjour%2C%20je%20voudrais%20commander%20des%20chaussures`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-wa text-xs px-4 py-2 hidden sm:inline-flex rounded-full"
              >
                💬 WhatsApp
              </a>
            </nav>
          </div>
        </header>

        {/* ── Contenu ─────────────────────────────────────── */}
        <main className="flex-1">{children}</main>

        {/* ── Footer ──────────────────────────────────────── */}
        <footer className="bg-[#1A1A1A] text-white mt-16">
          <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-[#C4956A] mb-3 uppercase tracking-widest text-xs">Mor Talla Sandaga</h3>
              <p className="text-sm text-gray-400">Chaussures de qualité livrées partout au Sénégal.</p>
            </div>
            <div>
              <h3 className="font-bold mb-3 uppercase tracking-widest text-xs">Navigation</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/catalogue" className="hover:text-[#C4956A] transition-colors">Boutique</Link></li>
                <li><Link href="/suivi" className="hover:text-[#C4956A] transition-colors">Suivi commande</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-3 uppercase tracking-widest text-xs">Contact</h3>
              <a
                href={`https://wa.me/${waNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#25D366] hover:underline"
              >
                WhatsApp : {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "+221 70 000 00 00"}
              </a>
            </div>
          </div>
          <div className="border-t border-gray-800 py-4 text-center text-xs text-gray-600">
            © {new Date().getFullYear()} Mor Talla Sandaga — Dakar, Sénégal
          </div>
        </footer>
      </div>
    </CartProvider>
  );
}
