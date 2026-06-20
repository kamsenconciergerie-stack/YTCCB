import { formatPrice } from "@/lib/format";

export const CATEGORY_ICONS: Record<string, string> = {
  GROS_OEUVRE:    "🏗️",
  ETANCHEITE:     "🛡️",
  CARRELAGE:      "🔲",
  PLOMBERIE:      "🚿",
  ELECTRICITE:    "⚡",
  SANITAIRES:     "🚽",
  ELECTROMENAGER: "🏠",
  SOLAIRE:        "☀️",
};

export const CATEGORY_LABELS: Record<string, string> = {
  GROS_OEUVRE:    "Gros œuvre",
  ETANCHEITE:     "Étanchéité",
  CARRELAGE:      "Carrelage",
  PLOMBERIE:      "Plomberie",
  ELECTRICITE:    "Électricité",
  SANITAIRES:     "Sanitaires",
  ELECTROMENAGER: "Électroménager",
  SOLAIRE:        "Solaire",
};

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: unknown;
  stockQty: number;
  unit: string;
  imageUrl: string | null;
  category: string;
}

const WA_ICON = (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.557 4.126 1.532 5.862L.054 23.333a.5.5 0 0 0 .613.613l5.47-1.478A11.933 11.933 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.7-.513-5.243-1.41l-.375-.214-3.893 1.051 1.051-3.893-.214-.375A9.978 9.978 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
  </svg>
);

export function ProductCard({ id, name, slug, price, stockQty, unit, imageUrl, category }: ProductCardProps) {
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace("+", "") ?? "";
  const waText = encodeURIComponent(`Bonjour CCB, je voudrais commander : ${name}`);

  return (
    <div className="card overflow-hidden flex flex-col group">
      <a href={`/catalogue/${slug}`} className="block">
        <div className="aspect-[4/3] bg-ccb-green-50 flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <span className="text-6xl opacity-25">
              {CATEGORY_ICONS[category] ?? "📦"}
            </span>
          )}
        </div>
      </a>

      <div className="p-4 flex flex-col flex-1">
        <span className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--ccb-gold)" }}>
          {CATEGORY_LABELS[category] ?? category}
        </span>

        <a href={`/catalogue/${slug}`} className="flex-1">
          <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-ccb-green-600 transition-colors">
            {name}
          </h3>
        </a>

        <div className="flex items-baseline gap-1 mt-2 mb-1">
          <span className="text-xl font-bold" style={{ color: "var(--ccb-green)" }}>
            {formatPrice(price)}
          </span>
          <span className="text-sm text-gray-400">/ {unit}</span>
        </div>

        <p className={`text-xs mb-3 font-medium ${stockQty > 0 ? "text-emerald-600" : "text-red-500"}`}>
          {stockQty > 0 ? `${stockQty} en stock` : "Rupture de stock"}
        </p>

        <div className="flex gap-2 mt-auto">
          <a href={`/catalogue/${slug}`} className="flex-1 btn-primary text-sm py-2 px-3 text-center">
            Voir détails
          </a>
          <a
            href={`https://wa.me/${waNumber}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold text-sm py-2 px-3"
            title="Commander sur WhatsApp"
          >
            {WA_ICON}
          </a>
        </div>
      </div>
    </div>
  );
}
