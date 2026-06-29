import type { Metadata } from "next";
import Link from "next/link";
import { ChaussureForm } from "../ChaussureForm";

export const metadata: Metadata = { title: "Nouvelle chaussure — Admin MTS" };

export default function NouvelleChaussurePage() {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/catalogue" className="text-sm text-gray-400 hover:text-[#C4956A]">← Catalogue</Link>
        <h1 className="text-xl font-black uppercase">Nouvelle chaussure</h1>
      </div>
      <ChaussureForm />
    </div>
  );
}
