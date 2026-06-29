import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-guard";
import { redirect } from "next/navigation";
import { ChaussureForm } from "../../ChaussureForm";

export const dynamic = "force-dynamic";

export default async function ModifierChaussurePage({ params }: { params: { id: string } }) {
  const { error } = await requireAdminSession();
  if (error) redirect("/admin/login");

  const ch = await prisma.chaussure.findUnique({
    where: { id: params.id },
    select: {
      id: true, reference: true, nom: true, marque: true, categorie: true,
      couleur: true, prix: true, prixPromo: true, stockTotal: true,
      pointuresDisponibles: true, stocksParPointure: true,
      description: true, images: true, actif: true, featured: true,
    },
  });

  if (!ch) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-black uppercase mb-6">Modifier — {ch.nom}</h1>
      <ChaussureForm chaussure={ch as never} />
    </div>
  );
}
