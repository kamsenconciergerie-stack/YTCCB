"use client";
import { useEffect, useState, useCallback } from "react";
import { formatPrice, formatDate } from "@/lib/format";

interface Lead {
  id: string; status: string; name: string | null; company: string | null;
  whatsappNumber: string | null; estimatedValue: string | null;
  notes: string | null; createdAt: string;
  customer: { name: string | null; whatsappNumber: string } | null;
  assignments: { salesRep: { id: string; name: string } }[];
}

const COLUMNS: { status: string; label: string; color: string; next: string[] }[] = [
  { status: "NEW",        label: "Nouveau",       color: "bg-gray-100",   next: ["CONTACTED"] },
  { status: "CONTACTED",  label: "Contacté",      color: "bg-blue-50",    next: ["QUOTE_SENT", "LOST"] },
  { status: "QUOTE_SENT", label: "Devis envoyé",  color: "bg-purple-50",  next: ["WON", "LOST"] },
  { status: "WON",        label: "Gagné",         color: "bg-green-50",   next: [] },
  { status: "LOST",       label: "Perdu",         color: "bg-red-50",     next: [] },
];

const STATUS_BTN: Record<string, string> = {
  CONTACTED:  "Marquer contacté",
  QUOTE_SENT: "Devis envoyé",
  WON:        "✓ Gagné",
  LOST:       "✕ Perdu",
};

const STATUS_BTN_STYLE: Record<string, string> = {
  CONTACTED:  "bg-blue-100 hover:bg-blue-200 text-blue-700",
  QUOTE_SENT: "bg-purple-100 hover:bg-purple-200 text-purple-700",
  WON:        "bg-green-100 hover:bg-green-200 text-green-700",
  LOST:       "bg-red-100 hover:bg-red-200 text-red-700",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", whatsappNumber: "", company: "", estimatedValue: "" });
  const [creating, setCreating] = useState(false);

  const fetchLeads = useCallback(async () => {
    const res = await fetch("/api/admin/leads");
    const json = await res.json();
    setLeads(json.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  async function changeStatus(id: string, status: string) {
    setChanging(id + status);
    await fetch(`/api/admin/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchLeads();
    setChanging(null);
  }

  async function createLead(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const INTERNAL_KEY = process.env.NEXT_PUBLIC_INTERNAL_API_KEY ?? "";
    await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": INTERNAL_KEY },
      body: JSON.stringify({ ...newForm, estimatedValue: newForm.estimatedValue ? Number(newForm.estimatedValue) : undefined }),
    });
    setNewForm({ name: "", whatsappNumber: "", company: "", estimatedValue: "" });
    setShowNew(false);
    setCreating(false);
    fetchLeads();
  }

  const displayName = (l: Lead) => l.name ?? l.customer?.name ?? l.whatsappNumber ?? "—";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-semibold" style={{ color: "var(--mts-primary)" }}>Pipeline commercial</h1>
        <button onClick={() => setShowNew(!showNew)} className="btn-gold text-sm px-4 py-2">+ Nouveau lead</button>
      </div>

      {showNew && (
        <form onSubmit={createLead} className="card p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <input required type="text" placeholder="Nom" value={newForm.name} onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mts-primary-600/40" />
          <input required type="tel" placeholder="WhatsApp *" value={newForm.whatsappNumber} onChange={(e) => setNewForm((f) => ({ ...f, whatsappNumber: e.target.value }))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mts-primary-600/40" />
          <input type="text" placeholder="Entreprise" value={newForm.company} onChange={(e) => setNewForm((f) => ({ ...f, company: e.target.value }))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" />
          <div className="flex gap-2">
            <input type="number" placeholder="Valeur est." value={newForm.estimatedValue} onChange={(e) => setNewForm((f) => ({ ...f, estimatedValue: e.target.value }))}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" />
            <button type="submit" disabled={creating} className="btn-primary text-sm px-4 py-2 shrink-0">OK</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-400">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
          {COLUMNS.map((col) => {
            const colLeads = leads.filter((l) => l.status === col.status);
            return (
              <div key={col.status} className={`rounded-xl p-3 min-h-32 ${col.color}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-gray-600">{col.label}</h3>
                  <span className="text-xs bg-white px-1.5 py-0.5 rounded-full font-semibold text-gray-500">{colLeads.length}</span>
                </div>
                <div className="space-y-2">
                  {colLeads.map((lead) => (
                    <div key={lead.id} className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="font-semibold text-sm text-gray-900 truncate">{displayName(lead)}</p>
                      {lead.company && <p className="text-xs text-gray-400 truncate">{lead.company}</p>}
                      {lead.whatsappNumber && (
                        <p className="text-xs text-gray-400">{lead.whatsappNumber}</p>
                      )}
                      {lead.estimatedValue && (
                        <p className="text-xs font-medium mt-1" style={{ color: "var(--mts-accent)" }}>
                          {formatPrice(lead.estimatedValue)}
                        </p>
                      )}
                      {lead.assignments[0] && (
                        <p className="text-xs text-gray-400 mt-1">@{lead.assignments[0].salesRep.name}</p>
                      )}
                      <p className="text-xs text-gray-300 mt-1">{formatDate(lead.createdAt)}</p>
                      {col.next.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {col.next.map((next) => (
                            <button key={next} onClick={() => changeStatus(lead.id, next)}
                              disabled={changing === lead.id + next}
                              className={`text-xs px-2 py-1 rounded font-medium transition-colors ${STATUS_BTN_STYLE[next] ?? "bg-gray-100 text-gray-600"}`}>
                              {changing === lead.id + next ? "..." : STATUS_BTN[next] ?? next}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {colLeads.length === 0 && <p className="text-xs text-gray-400 text-center py-4">—</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
