import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-guard";

const MAX_ARTICLES = 5000;

type CsvRow = {
  reference: string;
  nom: string;
  marque?: string;
  categorie?: string;
  couleur?: string;
  prix: string;
  prix_promo?: string;
  stock_total?: string;
  pointures?: string;     // "36,37,38,39,40"
  description?: string;
  images?: string;        // URLs séparées par |
  actif?: string;
  featured?: string;
  fournisseur_ref?: string;
};

const CATEGORIES_VALIDES = [
  "FEMME","HOMME","ENFANT","SPORT","SANDALES","BOTTES","ESCARPINS","SNEAKERS","ACCESSOIRES",
];

function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(";").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cols = line.split(";").map((c) => c.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = cols[i] ?? ""; });
    return row as CsvRow;
  });
}

function validateRow(row: CsvRow, idx: number): string[] {
  const errors: string[] = [];
  if (!row.reference) errors.push(`Ligne ${idx + 2}: référence manquante`);
  if (!row.nom)        errors.push(`Ligne ${idx + 2}: nom manquant`);
  if (!row.prix || isNaN(parseFloat(row.prix))) errors.push(`Ligne ${idx + 2}: prix invalide`);
  if (row.categorie && !CATEGORIES_VALIDES.includes(row.categorie.toUpperCase())) {
    errors.push(`Ligne ${idx + 2}: catégorie "${row.categorie}" invalide`);
  }
  return errors;
}

// POST /api/admin/chaussures/import
// multipart/form-data: file (CSV), dry_run=true|false
export async function POST(request: NextRequest) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Formulaire invalide" }, { status: 400 });

  const file = formData.get("file") as File | null;
  const dryRun = formData.get("dry_run") === "true";

  if (!file) return NextResponse.json({ error: "Fichier CSV manquant" }, { status: 400 });
  if (!file.name.endsWith(".csv")) return NextResponse.json({ error: "Fichier doit être CSV" }, { status: 400 });

  const text = await file.text();
  const rows = parseCsv(text);

  if (rows.length > MAX_ARTICLES) {
    return NextResponse.json({ error: `Maximum ${MAX_ARTICLES} articles par import` }, { status: 422 });
  }

  const allErrors: string[] = [];
  rows.forEach((row, idx) => allErrors.push(...validateRow(row, idx)));

  if (allErrors.length > 0 && !dryRun) {
    return NextResponse.json({
      error: "Erreurs de validation",
      details: allErrors,
      nbArticles: rows.length,
      nbErreurs: allErrors.length,
    }, { status: 422 });
  }

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      nbArticles: rows.length,
      nbErreurs: allErrors.length,
      erreurs: allErrors,
      apercu: rows.slice(0, 5).map((r) => ({
        reference: r.reference,
        nom: r.nom,
        categorie: r.categorie?.toUpperCase(),
        prix: parseFloat(r.prix),
      })),
    });
  }

  // Import réel avec upsert sur reference
  let imported = 0;
  const importErrors: string[] = [];

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    const errs = validateRow(row, idx);
    if (errs.length > 0) { importErrors.push(...errs); continue; }

    try {
      const pointures = row.pointures
        ? row.pointures.split(",").map((p) => p.trim()).filter(Boolean)
        : [];
      const images = row.images
        ? row.images.split("|").map((u) => u.trim()).filter(Boolean)
        : [];

      await prisma.chaussure.upsert({
        where: { reference: row.reference },
        create: {
          reference: row.reference,
          nom: row.nom,
          marque: row.marque || null,
          categorie: (row.categorie?.toUpperCase() as never) || "FEMME",
          couleur: row.couleur || null,
          prix: parseFloat(row.prix),
          prixPromo: row.prix_promo ? parseFloat(row.prix_promo) : null,
          stockTotal: row.stock_total ? parseInt(row.stock_total) : 0,
          pointuresDisponibles: pointures,
          stocksParPointure: {},
          description: row.description || null,
          images,
          fournisseurRef: row.fournisseur_ref || null,
          actif: row.actif !== "false",
          featured: row.featured === "true",
          sourceImport: "CSV",
          dateImport: new Date(),
        },
        update: {
          nom: row.nom,
          marque: row.marque || null,
          ...(row.categorie ? { categorie: row.categorie.toUpperCase() as never } : {}),
          couleur: row.couleur || null,
          prix: parseFloat(row.prix),
          prixPromo: row.prix_promo ? parseFloat(row.prix_promo) : null,
          stockTotal: row.stock_total ? parseInt(row.stock_total) : 0,
          ...(pointures.length ? { pointuresDisponibles: pointures } : {}),
          ...(images.length ? { images } : {}),
          description: row.description || null,
          fournisseurRef: row.fournisseur_ref || null,
          sourceImport: "CSV",
          dateImport: new Date(),
        },
      });
      imported++;
    } catch (e) {
      importErrors.push(`Ligne ${idx + 2}: ${e instanceof Error ? e.message : "erreur inconnue"}`);
    }
  }

  await prisma.importLog.create({
    data: {
      fichier: file.name,
      nbArticlesImportes: imported,
      nbErreurs: importErrors.length,
      statut: importErrors.length === 0 ? "SUCCESS" : imported > 0 ? "PARTIAL" : "ERROR",
      ...(importErrors.length > 0 ? { detailsErreurs: importErrors } : {}),
    },
  });

  return NextResponse.json({
    message: `Import terminé : ${imported} articles importés, ${importErrors.length} erreurs`,
    nbArticlesImportes: imported,
    nbErreurs: importErrors.length,
    erreurs: importErrors,
  }, { status: 201 });
}

// GET /api/admin/chaussures/import — historique des imports
export async function GET() {
  const { error } = await requireAdminSession();
  if (error) return error;

  const logs = await prisma.importLog.findMany({
    orderBy: { date: "desc" },
    take: 20,
  });

  return NextResponse.json({ data: logs });
}
