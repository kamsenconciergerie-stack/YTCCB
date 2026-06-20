import { CartProvider } from "@/components/CartContext";
import { CartCount } from "@/components/CartCount";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace("+", "") ?? "";

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col">
        {/* Header blanc avec logo */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="CCB Matériaux"
                className="h-10 w-auto object-contain"
              />
            </a>

            <nav className="flex items-center gap-5 text-sm">
              <a
                href="/catalogue"
                className="text-gray-600 hover:text-[#1D5BB0] font-medium transition-colors hidden md:block"
              >
                Catalogue
              </a>
              <a
                href="/suivi"
                className="text-gray-600 hover:text-[#1D5BB0] font-medium transition-colors hidden md:block"
              >
                Suivi commande
              </a>
              <CartCount />
              <a
                href={`https://wa.me/${waNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold text-sm px-4 py-2 hidden sm:inline-flex"
              >
                WhatsApp
              </a>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-gray-100 py-8 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} CCB Matériaux — Tous droits réservés</p>
          </div>
        </footer>
      </div>
    </CartProvider>
  );
}
