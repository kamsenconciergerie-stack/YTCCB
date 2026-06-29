import Link from "next/link";
import { prisma } from "@/lib/prisma";

const CATEGORIES = [
  { label: "Escarpins",   emoji: "👠", slug: "ESCARPINS" },
  { label: "Sandales",    emoji: "👡", slug: "SANDALES" },
  { label: "Bottes",      emoji: "🥾", slug: "BOTTES" },
  { label: "Sneakers",    emoji: "👟", slug: "SNEAKERS" },
  { label: "Femme",       emoji: "👒", slug: "FEMME" },
  { label: "Enfant",      emoji: "🧒", slug: "ENFANT" },
  { label: "Sport",       emoji: "🏃", slug: "SPORT" },
  { label: "Accessoires", emoji: "👜", slug: "ACCESSOIRES" },
];

const BANNER_ITEMS = [
  "LIVRAISON DAKAR & BANLIEUE",
  "PAIEMENT WAVE & ORANGE MONEY",
  "RETOUR 7 JOURS",
  "QUALITÉ GARANTIE",
  "COMMANDEZ SUR WHATSAPP",
  "NOUVELLE COLLECTION 2026",
];

async function getFeatured() {
  return prisma.chaussure.findMany({
    where: { actif: true, featured: true },
    take: 8,
    orderBy: { createdAt: "desc" },
    select: { id: true, nom: true, prix: true, prixPromo: true, images: true, categorie: true },
  });
}

async function getNewArrivals() {
  return prisma.chaussure.findMany({
    where: { actif: true },
    take: 4,
    orderBy: { createdAt: "desc" },
    select: { id: true, nom: true, prix: true, prixPromo: true, images: true, categorie: true },
  });
}

export default async function HomePage() {
  const [featured, newArrivals] = await Promise.all([getFeatured(), getNewArrivals()]);
  const waNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "221700000000").replace("+", "");

  return (
    <div>
      {/* ── Bannière défilante ─────────────────────── */}
      <div className="bg-[#1A1A1A] text-white text-[10px] tracking-widest uppercase overflow-hidden py-2">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...BANNER_ITEMS, ...BANNER_ITEMS].map((item, i) => (
            <span key={i} className="mx-8">
              <span className="text-[#C4956A]">✦</span> {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── Hero ───────────────────────────────────── */}
      <section className="bg-[#F5F5F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-[#C4956A] text-xs tracking-[0.3em] uppercase font-semibold mb-4">
              Collection 2026
            </p>
            <h1 className="text-5xl md:text-7xl font-display font-black uppercase leading-none text-[#1A1A1A] mb-6">
              Vos<br />
              chaussures<br />
              <span style={{ color: "#C4956A" }}>livrées</span>
            </h1>
            <p className="text-gray-500 text-base mb-8 max-w-md">
              Boutique en ligne de chaussures à Dakar. Commandez en quelques clics, payez Wave ou Orange Money.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/catalogue" className="btn-noir px-8 py-4">Voir la boutique</Link>
              <a
                href={`https://wa.me/${waNumber}?text=Bonjour%2C%20je%20voudrais%20commander%20des%20chaussures`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-wa px-8 py-4"
              >
                💬 WhatsApp
              </a>
            </div>
          </div>
          <div className="hidden md:flex justify-center">
            <div className="w-80 h-96 rounded-3xl flex items-center justify-center text-9xl"
              style={{ background: "linear-gradient(135deg, #E8E8E8 0%, #F5F5F5 100%)" }}>
              👠
            </div>
          </div>
        </div>
      </section>

      {/* ── Catégories ─────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="section-title">Nos Catégories</h2>
          <p className="section-subtitle">Trouvez le modèle parfait pour chaque occasion</p>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/catalogue?categorie=${cat.slug}`}
              className="flex flex-col items-center gap-2 p-4 hover:bg-[#F5F5F5] transition-colors group rounded"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform duration-200">{cat.emoji}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] text-center">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Sélection featured ─────────────────────── */}
      {featured.length > 0 && (
        <section className="bg-[#F5F5F5] py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="section-title">Sélection</h2>
                <p className="section-subtitle">Nos coups de cœur</p>
              </div>
              <Link href="/catalogue?featured=true" className="text-sm font-semibold uppercase tracking-wider text-[#C4956A] hover:underline">
                Voir tout →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featured.map((ch) => <ProduitCard key={ch.id} ch={ch} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Nouveautés ─────────────────────────────── */}
      {newArrivals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="section-title">Nouveautés</h2>
              <p className="section-subtitle">Derniers arrivages</p>
            </div>
            <Link href="/catalogue?sort=nouveautes" className="text-sm font-semibold uppercase tracking-wider text-[#C4956A] hover:underline">
              Voir tout →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {newArrivals.map((ch) => <ProduitCard key={ch.id} ch={ch} />)}
          </div>
        </section>
      )}

      {/* ── Avantages ──────────────────────────────── */}
      <section className="bg-[#1A1A1A] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
          {[
            { icon: "🚚", title: "Livraison rapide", desc: "Dakar, banlieue et régions. 24-48h." },
            { icon: "💳", title: "Paiement sécurisé", desc: "Wave & Orange Money. Paiement à la livraison disponible." },
            { icon: "↩️", title: "Retour facile", desc: "7 jours pour changer d'avis, contact WhatsApp." },
          ].map((item) => (
            <div key={item.title} className="flex flex-col items-center gap-3">
              <span className="text-4xl">{item.icon}</span>
              <h3 className="font-bold text-[#C4956A] uppercase tracking-widest text-xs">{item.title}</h3>
              <p className="text-gray-400 text-sm max-w-xs">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

type ChMin = { id: string; nom: string; prix: unknown; prixPromo?: unknown; images: unknown; categorie: string };
function ProduitCard({ ch }: { ch: ChMin }) {
  const prix = Number(ch.prix);
  const promo = ch.prixPromo ? Number(ch.prixPromo) : null;
  const img = (ch.images as string[])?.[0];

  return (
    <Link href={`/catalogue/${ch.id}`} className="group block">
      <div className="relative overflow-hidden bg-[#F5F5F5] aspect-square mb-3">
        {promo && <span className="badge-promo">Promo</span>}
        {img
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={img} alt={ch.nom} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center text-5xl text-gray-300">👠</div>
        }
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-0.5">{ch.categorie}</p>
      <p className="font-semibold text-[#1A1A1A] text-sm line-clamp-2">{ch.nom}</p>
      <div className="flex items-baseline gap-2 mt-1">
        {promo
          ? <><span className="font-bold text-[#C4956A]">{promo.toLocaleString("fr-FR")} FCFA</span><span className="text-xs text-gray-400 line-through">{prix.toLocaleString("fr-FR")}</span></>
          : <span className="font-bold text-[#1A1A1A]">{prix.toLocaleString("fr-FR")} FCFA</span>
        }
      </div>
    </Link>
  );
}
