import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accueil",
};

const CATEGORIES = [
  { label: "Gros œuvre",     emoji: "🏗️", slug: "GROS_OEUVRE" },
  { label: "Étanchéité",     emoji: "🛡️", slug: "ETANCHEITE" },
  { label: "Carrelage",      emoji: "🔲", slug: "CARRELAGE" },
  { label: "Plomberie",      emoji: "🚿", slug: "PLOMBERIE" },
  { label: "Électricité",    emoji: "⚡", slug: "ELECTRICITE" },
  { label: "Sanitaires",     emoji: "🚽", slug: "SANITAIRES" },
  { label: "Électroménager", emoji: "🏠", slug: "ELECTROMENAGER" },
  { label: "Solaire",        emoji: "☀️", slug: "SOLAIRE" },
];

export default function HomePage() {
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace("+", "") ?? "";

  return (
    <>
      {/* Hero — fond bleu */}
      <section
        className="relative py-20 px-4 text-white text-center"
        style={{ backgroundColor: "var(--ccb-green)" }}
      >
        <div className="max-w-3xl mx-auto">
          {/* Logo CCB centré dans le hero */}
          <div className="flex justify-center mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="CCB Matériaux"
              className="h-20 w-auto object-contain brightness-0 invert"
            />
          </div>

          <h1 className="text-4xl sm:text-5xl font-display font-bold mb-4">
            Vos matériaux de construction,{" "}
            <span style={{ color: "var(--ccb-gold)" }}>livrés rapidement</span>
          </h1>
          <p className="text-lg text-white/80 mb-8">
            Commandez en ligne ou sur WhatsApp — Dakar et régions
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/catalogue" className="btn-primary bg-white text-base px-8 py-4" style={{ backgroundColor: "white", color: "var(--ccb-green)" }}>
              Voir le catalogue
            </a>
            <a
              href={`https://wa.me/${waNumber}?text=Bonjour%20CCB%2C%20je%20voudrais%20commander%20des%20mat%C3%A9riaux`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold text-base px-8 py-4"
            >
              Commander sur WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Catégories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2
          className="text-3xl font-display font-semibold text-center mb-10"
          style={{ color: "var(--ccb-green)" }}
        >
          Nos catégories
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => (
            <a
              key={cat.slug}
              href={`/catalogue?category=${cat.slug}`}
              className="card p-6 flex flex-col items-center gap-3 text-center group hover:border-ccb-green-600/30 transition-colors"
            >
              <span className="text-4xl">{cat.emoji}</span>
              <span
                className="font-semibold text-sm text-gray-700 group-hover:transition-colors"
                style={{ color: "inherit" }}
              >
                {cat.label}
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* CTA WhatsApp — fond bleu clair */}
      <section className="bg-ccb-green-50 py-12 px-4 text-center">
        <p className="text-lg font-medium text-gray-700 mb-4">
          Besoin d&apos;un devis ou d&apos;un conseil ?
        </p>
        <a
          href={`https://wa.me/${waNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gold inline-flex items-center gap-2 text-base px-8 py-4"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.557 4.126 1.532 5.862L.054 23.333a.5.5 0 0 0 .613.613l5.47-1.478A11.933 11.933 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.7-.513-5.243-1.41l-.375-.214-3.893 1.051 1.051-3.893-.214-.375A9.978 9.978 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
          </svg>
          Discuter sur WhatsApp
        </a>
      </section>
    </>
  );
}
