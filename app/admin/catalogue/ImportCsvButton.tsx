"use client";
import { useRef, useState } from "react";

type ImportResult = {
  nbArticlesImportes: number;
  nbErreurs: number;
  erreurs: string[];
  apercu?: unknown[];
  dryRun?: boolean;
};

export function ImportCsvButton() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  async function handleUpload() {
    if (!file) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("dry_run", String(dryRun));
      const res = await fetch("/api/admin/chaussures/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur d'import"); return; }
      setResult(data);
    } catch { setError("Erreur réseau"); }
    finally { setLoading(false); }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-outline text-xs px-4 py-2">
        📥 Import CSV
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded w-full max-w-lg p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black uppercase text-sm tracking-wider">Import CSV Chaussures</h2>
              <button onClick={() => { setOpen(false); setResult(null); setFile(null); setError(""); }} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
              <strong>Colonnes attendues</strong> (séparateur ;) :<br/>
              reference ; nom ; marque ; categorie ; couleur ; prix ; prix_promo ; stock_total ; pointures ; description ; images ; actif ; featured ; fournisseur_ref
            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="input mb-4 text-sm"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />

            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="dryrun"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="dryrun" className="text-sm font-semibold">Mode aperçu (dry-run) — ne pas enregistrer</label>
            </div>

            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

            {result && (
              <div className={`p-4 rounded mb-4 text-sm ${result.dryRun ? "bg-blue-50 border border-blue-200" : "bg-green-50 border border-green-200"}`}>
                <p className="font-bold mb-1">{result.dryRun ? "Aperçu (rien enregistré)" : "Import terminé"}</p>
                <p>Articles : <strong>{result.nbArticlesImportes}</strong> — Erreurs : <strong className={result.nbErreurs > 0 ? "text-red-600" : ""}>{result.nbErreurs}</strong></p>
                {result.erreurs?.length > 0 && (
                  <ul className="mt-2 text-xs text-red-700 max-h-32 overflow-y-auto list-disc pl-4">
                    {result.erreurs.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                )}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button onClick={() => { setOpen(false); setResult(null); setFile(null); }} className="btn-outline text-xs px-4 py-2">
                Annuler
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className="btn-noir text-xs px-4 py-2 disabled:opacity-50"
              >
                {loading ? "Traitement…" : dryRun ? "Prévisualiser" : "Importer"}
              </button>
              {result?.dryRun && result.nbErreurs === 0 && (
                <button
                  onClick={() => { setDryRun(false); void handleUpload(); }}
                  disabled={loading}
                  className="btn-or text-xs px-4 py-2 disabled:opacity-50"
                >
                  ✓ Confirmer l&apos;import
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
