import { PrismaClient, ProductCategory } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding CCB database...");

  // ── Zones de livraison ─────────────────────────────────────────────────────
  const zones = await Promise.all([
    prisma.deliveryZone.upsert({
      where: { id: "zone-dakar-centre" },
      update: {},
      create: {
        id: "zone-dakar-centre",
        name: "Dakar Centre",
        description: "Plateau, Médina, Fann, Mermoz, Point E",
        baseFee: 2000,
      },
    }),
    prisma.deliveryZone.upsert({
      where: { id: "zone-dakar-banlieue" },
      update: {},
      create: {
        id: "zone-dakar-banlieue",
        name: "Dakar Banlieue",
        description: "Pikine, Guédiawaye, Parcelles Assainies, Thiaroye",
        baseFee: 3000,
      },
    }),
    prisma.deliveryZone.upsert({
      where: { id: "zone-rufisque" },
      update: {},
      create: {
        id: "zone-rufisque",
        name: "Rufisque / Bargny",
        description: "Rufisque, Bargny, Diamniadio, Sébikotane",
        baseFee: 4000,
      },
    }),
    prisma.deliveryZone.upsert({
      where: { id: "zone-thies" },
      update: {},
      create: {
        id: "zone-thies",
        name: "Thiès",
        description: "Ville de Thiès et environs",
        baseFee: 6000,
      },
    }),
    prisma.deliveryZone.upsert({
      where: { id: "zone-saint-louis" },
      update: {},
      create: {
        id: "zone-saint-louis",
        name: "Saint-Louis",
        baseFee: 12000,
      },
    }),
  ]);

  console.log(`✅ ${zones.length} zones de livraison créées`);

  // ── Commerciaux ─────────────────────────────────────────────────────────────
  const salesRep = await prisma.salesRep.upsert({
    where: { whatsappNumber: "+221770000001" },
    update: {},
    create: {
      id: "rep-demo",
      name: "Commercial Démo",
      whatsappNumber: "+221770000001",
      email: "commercial@ccbmateriaux.com",
      deliveryZoneId: "zone-dakar-centre",
    },
  });

  console.log(`✅ Commercial démo créé : ${salesRep.name}`);

  // ── Utilisateurs admin ───────────────────────────────────────────────────────
  const adminPasswordHash = await hash("changeme-admin-2024!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@ccbmateriaux.com" },
    update: {},
    create: {
      email: "admin@ccbmateriaux.com",
      passwordHash: adminPasswordHash,
      name: "Administrateur CCB",
      role: "ADMIN",
    },
  });

  console.log(`✅ Admin créé : ${admin.email} (mot de passe à changer impérativement)`);

  const commercialPasswordHash = await hash("changeme-commercial-2024!", 12);
  await prisma.user.upsert({
    where: { email: "commercial@ccbmateriaux.com" },
    update: {},
    create: {
      email: "commercial@ccbmateriaux.com",
      passwordHash: commercialPasswordHash,
      name: "Commercial Démo",
      role: "COMMERCIAL",
      salesRepId: "rep-demo",
    },
  });

  console.log("✅ Compte commercial démo créé");

  // ── Produits exemples (catalogue minimal pour tests) ─────────────────────────
  const sampleProducts: Array<{
    id: string;
    name: string;
    slug: string;
    category: ProductCategory;
    price: number;
    stockQty: number;
    unit: string;
    description?: string;
  }> = [
    // Gros œuvre
    {
      id: "prod-ciment-50kg",
      name: "Ciment Portland CPA 325 — sac 50 kg",
      slug: "ciment-portland-cpa-325-50kg",
      category: "GROS_OEUVRE",
      price: 5500,
      stockQty: 200,
      unit: "sac",
      description: "Ciment Portland artificiel CPA 325, idéal pour béton armé et maçonnerie",
    },
    {
      id: "prod-fer-rond-10mm",
      name: "Fer à béton HA10 — barre 12m",
      slug: "fer-beton-ha10-12m",
      category: "GROS_OEUVRE",
      price: 8500,
      stockQty: 150,
      unit: "barre",
      description: "Acier HA 10mm pour béton armé, longueur 12 mètres",
    },
    // Carrelage
    {
      id: "prod-carrelage-60x60",
      name: "Carrelage grès cérame 60×60 — blanc mat",
      slug: "carrelage-gres-cerame-60x60-blanc-mat",
      category: "CARRELAGE",
      price: 12000,
      stockQty: 80,
      unit: "m²",
      description: "Carrelage intérieur/extérieur antidérapant, finition mate",
    },
    // Plomberie
    {
      id: "prod-tuyau-pvc-32",
      name: "Tuyau PVC pression 32mm — barre 6m",
      slug: "tuyau-pvc-pression-32mm-6m",
      category: "PLOMBERIE",
      price: 3500,
      stockQty: 120,
      unit: "barre",
    },
    // Électricité
    {
      id: "prod-cable-1-5mm",
      name: "Câble électrique 1,5mm² — rouleau 100m",
      slug: "cable-electrique-1-5mm-100m",
      category: "ELECTRICITE",
      price: 18000,
      stockQty: 50,
      unit: "rouleau",
    },
    // Étanchéité
    {
      id: "prod-membrane-toiture",
      name: "Membrane d'étanchéité bitumineuse 4mm — rouleau 10m²",
      slug: "membrane-etancheite-bitumineuse-4mm",
      category: "ETANCHEITE",
      price: 22000,
      stockQty: 35,
      unit: "rouleau",
    },
    // Solaire
    {
      id: "prod-panneau-solaire-200w",
      name: "Panneau solaire monocristallin 200W",
      slug: "panneau-solaire-monocristallin-200w",
      category: "SOLAIRE",
      price: 85000,
      stockQty: 20,
      unit: "unité",
      description: "Panneau solaire 200Wc, rendement 21%, garantie 25 ans",
    },
    // Sanitaires
    {
      id: "prod-wc-suspendu",
      name: "WC suspendu céramique blanc — pack complet",
      slug: "wc-suspendu-ceramique-blanc",
      category: "SANITAIRES",
      price: 95000,
      stockQty: 15,
      unit: "unité",
    },
    // Électroménager
    {
      id: "prod-climatiseur-9000btu",
      name: "Climatiseur split 9000 BTU — inverter",
      slug: "climatiseur-split-9000-btu-inverter",
      category: "ELECTROMENAGER",
      price: 280000,
      stockQty: 8,
      unit: "unité",
      description: "Climatiseur inverter basse consommation, classe énergétique A++",
    },
  ];

  for (const product of sampleProducts) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {},
      create: product,
    });
  }

  console.log(`✅ ${sampleProducts.length} produits exemples créés`);
  console.log("\n🎉 Seed terminé avec succès !");
  console.log("\n⚠️  IMPORTANT : Changer les mots de passe par défaut avant tout déploiement !");
}

main()
  .catch((e) => {
    console.error("❌ Erreur seed :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
