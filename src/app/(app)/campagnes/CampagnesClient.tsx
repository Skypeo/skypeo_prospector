"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CsvUploader from "@/components/CsvUploader";
import type { CampagneStatut } from "@/types/database";

function CreateModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [nbEnvois, setNbEnvois] = useState(20);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    await supabase.from("campagnes").insert({ nom, nb_envois_par_jour: nbEnvois, statut: "pause" });
    setLoading(false);
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="rounded-2xl p-6 w-full max-w-md mx-4" style={{ background: "#120d24", border: "1px solid rgba(0,143,120,0.2)" }}>
        <h2 className="text-lg font-bold text-white mb-5">Nouvelle campagne</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-1.5">Nom</label>
            <input
              type="text" value={nom} onChange={(e) => setNom(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-brand-600/50 transition-all"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              placeholder="Prospection Avril 2026"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-1.5">Envois par jour</label>
            <input
              type="number" value={nbEnvois} onChange={(e) => setNbEnvois(parseInt(e.target.value))} required min={1} max={200}
              className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-brand-600/50 transition-all"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-all" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              Annuler
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all" style={{ background: "linear-gradient(135deg, #008f78, #2b3475)" }}>
              {loading ? "Création..." : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SelectProspectsModal({ campagneId, onClose }: { campagneId: string; onClose: () => void }) {
  const router = useRouter();
  const [prospects, setProspects] = useState<{ id: string; nom: string; societe: string | null; ville: string | null }[]>([]);
  const [totalDispo, setTotalDispo] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [quickN, setQuickN] = useState("");
  const [quickSaving, setQuickSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const [{ data }, { count }] = await Promise.all([
        supabase
          .from("prospects")
          .select("id, nom, societe, ville")
          .is("campagne_id", null)
          .eq("statut", "en_attente")
          .order("created_at", { ascending: true })
          .limit(200),
        supabase
          .from("prospects")
          .select("*", { count: "exact", head: true })
          .is("campagne_id", null)
          .eq("statut", "en_attente"),
      ]);
      setProspects(data ?? []);
      setTotalDispo(count ?? 0);
      setLoading(false);
    })();
  }, []);

  const filtered = prospects.filter((p) => {
    const s = search.toLowerCase();
    return !s || p.nom?.toLowerCase().includes(s) || p.societe?.toLowerCase().includes(s) || p.ville?.toLowerCase().includes(s);
  });

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function assignerSelection() {
    if (selected.size === 0) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("prospects").update({ campagne_id: campagneId }).in("id", [...selected]);
    setSaving(false);
    router.refresh();
    onClose();
  }

  async function assignerRapide() {
    const n = parseInt(quickN);
    if (!n || n <= 0) return;
    setQuickSaving(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("prospects")
      .select("id")
      .is("campagne_id", null)
      .eq("statut", "en_attente")
      .order("created_at", { ascending: true })
      .limit(n);
    if (data && data.length > 0) {
      await supabase.from("prospects").update({ campagne_id: campagneId }).in("id", data.map((p) => p.id));
    }
    setQuickSaving(false);
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="rounded-2xl w-full max-w-lg mx-4 flex flex-col" style={{ background: "#120d24", border: "1px solid rgba(0,143,120,0.2)", maxHeight: "85vh" }}>

        {/* Header */}
        <div className="px-5 py-4 border-b shrink-0" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-white">Ajouter des prospects</h2>
            <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Sélection rapide */}
          <div className="flex items-center gap-2 mb-3 p-3 rounded-xl" style={{ background: "rgba(0,143,120,0.08)", border: "1px solid rgba(0,143,120,0.2)" }}>
            <span className="text-xs text-white/50 shrink-0">Sélection rapide</span>
            <input
              type="number"
              value={quickN}
              onChange={(e) => setQuickN(e.target.value)}
              placeholder={`1 – ${totalDispo}`}
              min={1}
              max={totalDispo}
              className="flex-1 px-3 py-1.5 rounded-lg text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
            <button
              onClick={assignerRapide}
              disabled={quickSaving || !quickN || parseInt(quickN) <= 0}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40 shrink-0 transition-all"
              style={{ background: "linear-gradient(135deg, #008f78, #2b3475)" }}
            >
              {quickSaving ? "..." : "Assigner"}
            </button>
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Rechercher parmi les 200 premiers affichés…`}
            className="w-full px-3.5 py-2 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-brand-600/50"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
        </div>

        {/* Liste */}
        <div className="overflow-y-auto flex-1 min-h-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-white/30">Chargement...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-white/30">Aucun prospect disponible</div>
          ) : (
            filtered.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 px-5 py-2.5 cursor-pointer hover:bg-white/3 transition-colors border-b"
                style={{ borderColor: "rgba(255,255,255,0.04)" }}
                onClick={() => toggle(p.id)}
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${selected.has(p.id) ? "bg-brand-500" : "border border-white/20"}`}>
                  {selected.has(p.id) && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{p.nom || "—"}</p>
                  <p className="text-xs text-white/35 truncate">{[p.societe, p.ville].filter(Boolean).join(" · ")}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t shrink-0 flex items-center justify-between gap-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <span className="text-xs text-white/30">
            {selected.size > 0 ? `${selected.size} sélectionné(s)` : `${totalDispo} prospects disponibles`}
          </span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white transition-colors" style={{ background: "rgba(255,255,255,0.06)" }}>
              Annuler
            </button>
            <button
              onClick={assignerSelection}
              disabled={selected.size === 0 || saving}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all"
              style={{ background: "linear-gradient(135deg, #008f78, #2b3475)" }}
            >
              {saving ? "Assignation..." : `Ajouter ${selected.size > 0 ? selected.size : ""} prospect(s)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CampagneActions({
  campagneId,
  currentStatut,
  enAttenteCount,
}: {
  campagneId: string;
  currentStatut: CampagneStatut;
  enAttenteCount: number;
}) {
  const router = useRouter();
  const [toggleLoading, setToggleLoading] = useState(false);
  const [sendStatus, setSendStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [showCronInfo, setShowCronInfo] = useState(false);

  async function toggle() {
    setToggleLoading(true);
    const supabase = createClient();
    const newStatut: CampagneStatut = currentStatut === "active" ? "pause" : "active";
    await supabase.from("campagnes").update({ statut: newStatut }).eq("id", campagneId);
    setToggleLoading(false);
    router.refresh();
  }

  async function lancer() {
    setSendStatus("loading");
    try {
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
      if (!webhookUrl) throw new Error("Webhook URL non configurée");
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campagne_id: campagneId }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("[lancer-envoi] HTTP", res.status, text);
      }
      if (res.ok) {
        setSendStatus("ok");
        // Auto-refresh après 5s pour voir les statuts mis à jour
        setTimeout(() => {
          router.refresh();
          setSendStatus("idle");
        }, 5000);
      } else {
        setSendStatus("error");
        setTimeout(() => setSendStatus("idle"), 3000);
      }
    } catch (err) {
      console.error("[lancer-envoi] fetch error:", err);
      setSendStatus("error");
      setTimeout(() => setSendStatus("idle"), 3000);
    }
  }

  async function supprimer() {
    setDeleteLoading(true);
    const supabase = createClient();
    await supabase.from("campagnes").delete().eq("id", campagneId);
    router.refresh();
  }

  return (
    <>
      {showSelectModal && <SelectProspectsModal campagneId={campagneId} onClose={() => setShowSelectModal(false)} />}
      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
        <button
          onClick={() => setShowSelectModal(true)}
          className="px-3.5 py-1.5 text-xs font-medium rounded-xl text-white/55 hover:text-white transition-all"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          + Sélectionner prospects
        </button>
        <CsvUploader campagneId={campagneId} onImported={() => router.refresh()} showHint={false} compact />

        {currentStatut !== "terminee" && (
          <>
            {currentStatut === "active" && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={lancer}
                  disabled={sendStatus === "loading" || enAttenteCount === 0}
                  title={
                    enAttenteCount === 0
                      ? "Aucun prospect en attente dans cette campagne"
                      : `Déclencher l'envoi pour ${enAttenteCount} prospect(s) en attente`
                  }
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl text-white disabled:opacity-40 transition-all"
                  style={{ background: "linear-gradient(135deg, #008f78, #2b3475)" }}
                >
                  {sendStatus === "loading"
                    ? "Envoi..."
                    : sendStatus === "ok"
                    ? "Déclenché ✓ (5s...)"
                    : sendStatus === "error"
                    ? "Erreur ✕"
                    : enAttenteCount > 0
                    ? `▶ Lancer (${enAttenteCount})`
                    : "▶ Lancer l'envoi"}
                </button>
                {/* Info cron */}
                <div className="relative">
                  <button
                    onClick={() => setShowCronInfo((v) => !v)}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white/25 hover:text-white/60 transition-colors"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                    title="Comment fonctionne l'envoi ?"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  {showCronInfo && (
                    <div
                      className="absolute right-0 top-7 w-64 rounded-xl p-3 z-10 text-xs text-white/60 leading-relaxed"
                      style={{ background: "#120d24", border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      <p className="font-semibold text-white/80 mb-1.5">Comment fonctionne l&apos;envoi ?</p>
                      <p>Le cron n8n envoie automatiquement chaque heure entre 9h et 18h, dans la limite du quota journalier.</p>
                      <p className="mt-1.5">Ce bouton déclenche un envoi immédiat — il ne double-envoie pas car n8n vérifie le quota déjà consommé aujourd&apos;hui.</p>
                      <button
                        onClick={() => setShowCronInfo(false)}
                        className="mt-2 text-white/30 hover:text-white/60 transition-colors"
                      >
                        Fermer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            <button
              onClick={toggle}
              disabled={toggleLoading}
              className="px-3.5 py-1.5 text-xs font-medium rounded-xl text-white/55 hover:text-white disabled:opacity-50 transition-all"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              {currentStatut === "active" ? "⏸ Pause" : "▶ Activer"}
            </button>
          </>
        )}

        {deleteConfirm ? (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-white/40">Confirmer ?</span>
            <button onClick={supprimer} disabled={deleteLoading} className="px-2.5 py-1 text-xs font-medium rounded-lg text-red-400 hover:text-red-300 transition-colors" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              {deleteLoading ? "..." : "Oui"}
            </button>
            <button onClick={() => setDeleteConfirm(false)} className="px-2.5 py-1 text-xs font-medium rounded-lg text-white/40 hover:text-white transition-colors" style={{ background: "rgba(255,255,255,0.05)" }}>
              Non
            </button>
          </div>
        ) : (
          <button onClick={() => setDeleteConfirm(true)} className="p-1.5 rounded-lg text-white/20 hover:text-red-400 transition-colors" title="Supprimer">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </>
  );
}

export default function CampagnesClient() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-xl transition-all"
        style={{ background: "linear-gradient(135deg, #008f78, #2b3475)" }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Nouvelle campagne
      </button>
      {showModal && <CreateModal onClose={() => setShowModal(false)} />}
    </>
  );
}
