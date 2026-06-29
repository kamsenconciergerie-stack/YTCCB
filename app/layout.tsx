import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | Mor Talla Sandaga",
    default: "Mor Talla Sandaga — Chaussures femme au Sénégal",
  },
  description:
    "Commandez vos chaussures femme en ligne ou sur WhatsApp. Livraison rapide à Dakar et dans les régions.",
  keywords: ["chaussures femme", "Sénégal", "Dakar", "escarpins", "sandales", "bottes"],
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
