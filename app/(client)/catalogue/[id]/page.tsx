import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AddToCartButton } from "../AddToCartButton";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ch = await prisma.chaussure.findUnique({ where: { id: params.id }, select: { nom: true } });
  return { title: ch?.nom ?? "Produit" };
}

export default async function ProduitPage({ params }: Props) {
  const ch = await prisma.chaussure.findFirst({
    where: { id: params.id, actif: true },
  });
  if (!ch) notFound();

  const prix = Number(ch.prix);
  const promo = ch.prixPromo ? Number(ch.prixPromo) : null;
  const images = (ch.images as string[]) ?? [];
  const pointures = (ch.pointuresDisponibles as string[]) ?? [];
  const waNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "221700000000").replace("+", "");
  const waText = encodeURIComponent(`Bonjour, je voudrais commander : ${ch.nom} (Réf: ${ch.reference})`);

  // Suggestions (même catégorie)
  const suggestions = await prisma.chaussure.findMany({
    where: { actif: true, categorie: ch.categorie, NOT: { id: ch.id } },
    take: 4,
    select: { id: true, nom: true, prix: true, prixPromo: true, images: true },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-400 mb-8">
        <Link href="/" className="hover:text-[#C4956A]">Accueil</Link>
        <span className="mx-2">›</span>
        <Link href="/catalogue" className="hover:text-[#C4956A]">Boutique</Link>
        <span className="mx-2">›</span>
        <span className="text-[#1A1A1A]">{ch.nom}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-10">
        {/* ── Images ───────────────────────────────── */}
        <div>
          <div className="bg-[#F5F5F5] aspect-square flex items-center justify-center mb-4">
            {images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={images[0]} alt={ch.nom} className="w-full h-full object-cover" />
            ) : (
              <span className="text-9xl text-gray-200">👠</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.slice(1, 5).map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={img} alt={`${ch.nom} ${i + 2}`} className="aspect-square object-cover bg-[#F5F5F5]" />
              ))}
            </div>
          )}
        </div>

        {/* ── Infos + actions ──────────────────────── */}
        <div>
          {ch.marque && (
            <p className="text-xs font-bold uppercase tracking-widest text-[#C4956A] mb-2">{ch.marque}</p>
          )}
          <h1 className="text-3xl font-display font-black uppercase text-[#1A1A1A] mb-2">{ch.nom}</h1>
          <p className="text-xs text-gray-400 mb-4">Réf: {ch.reference}</p>

          {/* Prix */}
          <div className="flex items-baseline gap-3 mb-6">
            {promo ? (
              <>
                <span className="text-3xl font-black text-[#C4956A]">{promo.toLocaleString("fr-FR")} FCFA</span>
                <span className="text-lg text-gray-400 line-through">{prix.toLocaleString("fr-FR")} FCFA</span>
                <span className="bg-[#C4956A] text-white text-xs px-2 py-0.5 font-bold">
                  -{Math.round(((prix - promo) / prix) * 100)}%
                </span>
              </>
            ) : (
              <span className="text-3xl font-black text-[#1A1A1A]">{prix.toLocaleString("fr-FR")} FCFA</span>
            )}
          </div>

          {/* Couleur */}
          {ch.couleur && (
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-semibold">Couleur :</span> {ch.couleur}
            </p>
          )}

          {/* Pointures */}
          {pointures.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-wider mb-3">Pointure</p>
              <div className="flex flex-wrap gap-2">
                {pointures.map((p) => (
                  <span key={p} className="border border-gray-200 px-3 py-2 text-sm font-medium hover:border-[#1A1A1A] cursor-pointer transition-colors">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="flex flex-col gap-3 mb-8">
            <AddToCartButton
              productId={ch.id}
              name={ch.nom}
              price={promo ?? prix}
              imageUrl={images[0] ?? ""}
            />
            <a
              href={`https://wa.me/${waNumber}?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-wa w-full justify-center py-4"
            >
              💬 Commander via WhatsApp
            </a>
          </div>

          {/* Description */}
          {ch.description && (
            <div className="border-t border-gray-100 pt-6">
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3">Description</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{ch.description}</p>
            </div>
          )}

          {/* Stock */}
          {ch.stockTotal <= 5 && ch.stockTotal > 0 && (
            <p className="text-xs text-orange-600 mt-4">⚠️ Plus que {ch.stockTotal} en stock !</p>
          )}
        </div>
      </div>

      {/* ── Suggestions ──────────────────────────── */}
      {suggestions.length > 0 && (
        <div className="mt-16">
          <h2 className="section-title mb-2">Vous aimerez aussi</h2>
          <p className="section-subtitle">Dans la même catégorie</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {suggestions.map((s) => (
              <Link key={s.id} href={`/catalogue/${s.id}`} className="group block">
                <div className="bg-[#F5F5F5] aspect-square mb-3 overflow-hidden">
                  {(s.images as string[])?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={(s.images as string[])[0]} alt={s.nom} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-gray-200">👠</div>
                  )}
                </div>
                <p className="font-semibold text-sm line-clamp-2">{s.nom}</p>
                <p className="font-bold text-[#C4956A] text-sm mt-1">
                  {(s.prixPromo ? Number(s.prixPromo) : Number(s.prix)).toLocaleString("fr-FR")} FCFA
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
