import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | CCB Matériaux",
    default: "CCB Matériaux — Matériaux de construction au Sénégal",
  },
  description:
    "Commandez vos matériaux de construction en ligne ou sur WhatsApp. Livraison rapide à Dakar et dans les régions.",
  keywords: ["matériaux construction", "Sénégal", "Dakar", "ciment", "carrelage", "plomberie"],
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
