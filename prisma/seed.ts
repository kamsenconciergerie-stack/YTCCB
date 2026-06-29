import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Mor Talla Sandaga...");

  // ── Zones de livraison ─────────────────────────────────────────
  const zones = await Promise.all([
    prisma.deliveryZone.upsert({
      where: { id: "zone-dakar-centre" },
      update: {},
      create: { id: "zone-dakar-centre", name: "Dakar Centre", baseFee: 1500, isActive: true },
    }),
    prisma.deliveryZone.upsert({
      where: { id: "zone-banlieue" },
      update: {},
      create: { id: "zone-banlieue", name: "Banlieue Dakar", baseFee: 2000, isActive: true },
    }),
    prisma.deliveryZone.upsert({
      where: { id: "zone-thies" },
      update: {},
      create: { id: "zone-thies", name: "Thiès", baseFee: 3500, isActive: true },
    }),
    prisma.deliveryZone.upsert({
      where: { id: "zone-saint-louis" },
      update: {},
      create: { id: "zone-saint-louis", name: "Saint-Louis", baseFee: 5000, isActive: true },
    }),
  ]);
  console.log(`✅ ${zones.length} zones de livraison`);

  // ── Utilisateurs admin ─────────────────────────────────────────
  const adminHash = await hash("MTS@admin2026!", 12);
  const commHash  = await hash("MTS@comm2026!", 12);

  await prisma.user.upsert({
    where: { email: "admin@mortalla.com" },
    update: {},
    create: { email: "admin@mortalla.com", passwordHash: adminHash, name: "Administrateur MTS", role: "ADMIN" },
  });
  await prisma.user.upsert({
    where: { email: "commercial@mortalla.com" },
    update: {},
    create: { email: "commercial@mortalla.com", passwordHash: commHash, name: "Commercial MTS", role: "COMMERCIAL" },
  });
  console.log("✅ 2 utilisateurs admin");

  // ── Livreurs ───────────────────────────────────────────────────
  await prisma.livreur.upsert({
    where: { telephone: "+221771234567" },
    update: {},
    create: { nom: "Mamadou Diallo", telephone: "+221771234567", whatsappNumber: "+221771234567", deliveryZoneId: "zone-dakar-centre", actif: true, disponible: true },
  });
  await prisma.livreur.upsert({
    where: { telephone: "+221781234567" },
    update: {},
    create: { nom: "Ibrahima Sow", telephone: "+221781234567", whatsappNumber: "+221781234567", deliveryZoneId: "zone-banlieue", actif: true, disponible: true },
  });
  console.log("✅ 2 livreurs");

  // ── Catalogue chaussures ───────────────────────────────────────
  const chaussures = [
    {
      reference: "MTS-2026-001",
      nom: "Escarpin Élégance Noir",
      marque: "MTS Collection",
      categorie: "ESCARPINS" as const,
      couleur: "Noir",
      pointuresDisponibles: ["36", "37", "38", "39", "40", "41"],
      prix: 25000,
      stockTotal: 30,
      stocksParPointure: { "36": 5, "37": 6, "38": 7, "39": 6, "40": 4, "41": 2 },
      description: "Escarpin classique à talon aiguille 10 cm, cuir verni noir. Parfait pour vos soirées.",
      images: ["/demo/escarpin-noir.jpg"],
      featured: true,
      sourceImport: "MANUEL" as const,
    },
    {
      reference: "MTS-2026-002",
      nom: "Sandales Dorées Festival",
      marque: "MTS Collection",
      categorie: "SANDALES" as const,
      couleur: "Or",
      pointuresDisponibles: ["36", "37", "38", "39", "40"],
      prix: 18000,
      prixPromo: 14500,
      stockTotal: 25,
      stocksParPointure: { "36": 5, "37": 6, "38": 8, "39": 4, "40": 2 },
      description: "Sandales plates dorées à lanières, légères et élégantes pour l'été.",
      images: ["/demo/sandales-or.jpg"],
      featured: true,
      sourceImport: "MANUEL" as const,
    },
    {
      reference: "MTS-2026-003",
      nom: "Bottines Chelsea Cognac",
      marque: "MTS Collection",
      categorie: "BOTTES" as const,
      couleur: "Cognac",
      pointuresDisponibles: ["37", "38", "39", "40", "41"],
      prix: 35000,
      stockTotal: 20,
      stocksParPointure: { "37": 4, "38": 6, "39": 5, "40": 3, "41": 2 },
      description: "Bottines Chelsea en cuir cognac, semelle compensée 4 cm. Confort optimal.",
      images: ["/demo/bottines-cognac.jpg"],
      featured: true,
      sourceImport: "MANUEL" as const,
    },
    {
      reference: "MTS-2026-004",
      nom: "Sneakers Blanc Cassé Premium",
      marque: "MTS Sport",
      categorie: "SNEAKERS" as const,
      couleur: "Blanc",
      pointuresDisponibles: ["36", "37", "38", "39", "40", "41", "42"],
      prix: 22000,
      stockTotal: 40,
      stocksParPointure: { "36": 5, "37": 7, "38": 8, "39": 8, "40": 6, "41": 4, "42": 2 },
      description: "Sneakers unisexe à semelle épaisse, matière respirante. Style décontracté.",
      images: ["/demo/sneakers-blanc.jpg"],
      featured: true,
      sourceImport: "MANUEL" as const,
    },
    {
      reference: "MTS-2026-005",
      nom: "Mules Tissu Wax Coloré",
      marque: "MTS Afrique",
      categorie: "FEMME" as const,
      couleur: "Multicolore",
      pointuresDisponibles: ["36", "37", "38", "39", "40"],
      prix: 12000,
      stockTotal: 35,
      stocksParPointure: { "36": 7, "37": 8, "38": 8, "39": 7, "40": 5 },
      description: "Mules ouvertes en tissu wax authentique, motifs africains. Fabrication artisanale.",
      images: ["/demo/mules-wax.jpg"],
      featured: false,
      sourceImport: "MANUEL" as const,
    },
    {
      reference: "MTS-2026-006",
      nom: "Ballerines Rose Poudré",
      marque: "MTS Douceur",
      categorie: "FEMME" as const,
      couleur: "Rose poudré",
      pointuresDisponibles: ["35", "36", "37", "38", "39"],
      prix: 15000,
      prixPromo: 11000,
      stockTotal: 28,
      stocksParPointure: { "35": 4, "36": 6, "37": 8, "38": 6, "39": 4 },
      description: "Ballerines confort en satin rose poudré avec nœud décoratif. Légères et élégantes.",
      images: ["/demo/ballerines-rose.jpg"],
      featured: false,
      sourceImport: "MANUEL" as const,
    },
    {
      reference: "MTS-2026-007",
      nom: "Chaussures Sport Enfant Colorées",
      marque: "MTS Kids",
      categorie: "ENFANT" as const,
      couleur: "Multicolore",
      pointuresDisponibles: ["28", "29", "30", "31", "32", "33", "34", "35"],
      prix: 9500,
      stockTotal: 50,
      stocksParPointure: { "28": 6, "29": 7, "30": 8, "31": 8, "32": 7, "33": 6, "34": 5, "35": 3 },
      description: "Chaussures sport enfant légères, semelle antidérapante, velcro. Pour l'école et les loisirs.",
      images: ["/demo/chaussures-enfant.jpg"],
      featured: false,
      sourceImport: "MANUEL" as const,
    },
    {
      reference: "MTS-2026-008",
      nom: "Escarpins Dorés Soirée",
      marque: "MTS Luxe",
      categorie: "ESCARPINS" as const,
      couleur: "Or",
      pointuresDisponibles: ["36", "37", "38", "39", "40"],
      prix: 32000,
      stockTotal: 15,
      stocksParPointure: { "36": 3, "37": 4, "38": 4, "39": 3, "40": 1 },
      description: "Escarpins stiletto dorés à bride cheville. Talon 12 cm. Pour vos mariages et cérémonies.",
      images: ["/demo/escarpins-or.jpg"],
      featured: true,
      sourceImport: "MANUEL" as const,
    },
    {
      reference: "MTS-2026-009",
      nom: "Sandales Plates Confort Cuir",
      marque: "MTS Everyday",
      categorie: "SANDALES" as const,
      couleur: "Marron",
      pointuresDisponibles: ["36", "37", "38", "39", "40", "41"],
      prix: 16500,
      stockTotal: 32,
      stocksParPointure: { "36": 5, "37": 6, "38": 7, "39": 7, "40": 5, "41": 2 },
      description: "Sandales plates en cuir naturel, semelle anatomique. Idéales pour marcher toute la journée.",
      images: ["/demo/sandales-cuir.jpg"],
      featured: false,
      sourceImport: "MANUEL" as const,
    },
  ];

  let count = 0;
  for (const ch of chaussures) {
    await prisma.chaussure.upsert({
      where: { reference: ch.reference },
      update: {},
      create: { ...ch, actif: true, dateImport: new Date() },
    });
    count++;
  }
  console.log(`✅ ${count} chaussures`);

  // ── Paramètres boutique ────────────────────────────────────────
  await prisma.parametresBoutique.upsert({
    where: { cle: "NOM_BOUTIQUE" },
    update: {},
    create: { cle: "NOM_BOUTIQUE", valeur: "Mor Talla Sandaga" },
  });
  await prisma.parametresBoutique.upsert({
    where: { cle: "TEL_WHATSAPP" },
    update: {},
    create: { cle: "TEL_WHATSAPP", valeur: "+221770000000" },
  });
  await prisma.parametresBoutique.upsert({
    where: { cle: "DELAI_EXPIRATION_CMD_MINUTES" },
    update: {},
    create: { cle: "DELAI_EXPIRATION_CMD_MINUTES", valeur: "30" },
  });
  console.log("✅ Paramètres boutique");

  console.log("🎉 Seed terminé !");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
