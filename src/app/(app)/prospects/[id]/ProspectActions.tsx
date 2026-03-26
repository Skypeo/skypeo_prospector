"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ProspectStatut } from "@/types/database";
import Toast from "@/components/Toast";

const STATUTS: { value: ProspectStatut; label: string }[] = [
  { value: "en_attente", label: "En attente" },
  { value: "envoye", label: "Envoyé" },
  { value: "repondu", label: "Répondu" },
  { value: "rdv", label: "RDV" },
  { value: "refus", label: "Refus" },
];

export default function ProspectActions({
  prospectId,
  currentStatut,
  currentCampagneId,
  campagnes,
}: {
  prospectId: string;
  currentStatut: ProspectStatut;
  currentCampagneId: string | null;
  campagnes: { id: string; nom: string }[];
}) {
  const router = useRouter();
  const [statut, setStatut] = useState<ProspectStatut>(currentStatut);
  const [pendingStatut, setPendingStatut] = useState<ProspectStatut | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Campagne
  const [campagneId, setCampagneId] = useState<string | null>(currentCampagneId);
  const [showCampagneEdit, setShowCampagneEdit] = useState(false);
  const [selectedCampagne, setSelectedCampagne] = useState<string>(currentCampagneId ?? "");
  const [resetStatut, setResetStatut] = useState(false);
  const [savingCampagne, setSavingCampagne] = useState(false);

  async function handleConfirm() {
    if (!pendingStatut) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("prospects").update({ statut: pendingStatut }).eq("id", prospectId);
    if (error) {
      setToast({ message: "Erreur lors de la mise à jour.", type: "error" });
    } else {
      setStatut(pendingStatut);
      setToast({ message: "Statut mis à jour.", type: "success" });
      router.refresh();
    }
    setPendingStatut(null);
    setSaving(false);
  }

  async function handleSaveCampagne() {
    setSavingCampagne(true);
    const supabase = createClient();
    const updates: Record<string, string | null> = {
      campagne_id: selectedCampagne === "" ? null : selectedCampagne,
    };
    if (resetStatut) updates.statut = "en_attente";
    const { error } = await supabase.from("prospects").update(updates).eq("id", prospectId);
    if (error) {
      setToast({ message: "Erreur lors de la mise à jour.", type: "error" });
    } else {
      setCampagneId(updates.campagne_id as string | null);
      if (resetStatut) setStatut("en_attente");
      setToast({ message: "Campagne mise à jour.", type: "success" });
      setShowCampagneEdit(false);
      router.refresh();
    }
    setSavingCampagne(false);
  }

  async function handleDelete() {
    setDeleteLoading(true);
    const supabase = createClient();
    await supabase.from("conversations").delete().eq("prospect_id", prospectId);
    await supabase.from("prospects").delete().eq("id", prospectId);
    router.push("/prospects");
  }

  const currentCampagneName = campagnes.find((c) => c.id === campagneId)?.nom ?? null;

  return (
    <>
      {/* Statut */}
      <div className="rounded-2xl p-5 mb-5 glass">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white/60">Changer le statut</h2>
          {deleteConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">Supprimer ce prospect ?</span>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-3 py-1 text-xs font-medium rounded-lg text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                {deleteLoading ? "..." : "Confirmer"}
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-3 py-1 text-xs font-medium rounded-lg text-white/40 hover:text-white transition-colors"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                Annuler
              </button>
            </div>
          ) : (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg text-white/30 hover:text-red-400 transition-colors"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Supprimer
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUTS.map((s) => {
            const isActive = s.value === statut;
            const isPending = s.value === pendingStatut;
            return (
              <button
                key={s.value}
                onClick={() => {
                  if (isActive) return;
                  setPendingStatut(isPending ? null : s.value);
                }}
                disabled={saving}
                className="px-4 py-1.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                style={
                  isActive
                    ? { background: "linear-gradient(135deg, #008f78, #2b3475)", color: "white" }
                    : isPending
                    ? { background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.4)", color: "rgba(251,191,36,0.9)" }
                    : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.55)" }
                }
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {pendingStatut && (
          <div className="mt-4 flex items-center gap-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <span className="text-xs text-white/40">
              Changer vers <span className="text-white/70 font-medium">{STATUTS.find((s) => s.value === pendingStatut)?.label}</span> ?
            </span>
            <button
              onClick={handleConfirm}
              disabled={saving}
              className="px-3 py-1 text-xs font-semibold rounded-lg text-white transition-colors disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #008f78, #2b3475)" }}
            >
              {saving ? "..." : "Confirmer"}
            </button>
            <button
              onClick={() => setPendingStatut(null)}
              className="px-3 py-1 text-xs rounded-lg text-white/35 hover:text-white transition-colors"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              Annuler
            </button>
          </div>
        )}
      </div>

      {/* Campagne */}
      <div className="rounded-2xl p-5 mb-5 glass">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white/60 mb-0.5">Campagne</h2>
            <p className="text-sm text-white">
              {currentCampagneName ?? <span className="text-white/30 italic">Aucune campagne assignée</span>}
            </p>
          </div>
          {!showCampagneEdit && (
            <button
              onClick={() => {
                setSelectedCampagne(campagneId ?? "");
                setResetStatut(false);
                setShowCampagneEdit(true);
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-xl text-white/40 hover:text-white transition-all"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              Changer
            </button>
          )}
        </div>

        {showCampagneEdit && (
          <div className="mt-4 pt-4 space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <select
              value={selectedCampagne}
              onChange={(e) => setSelectedCampagne(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500/50 appearance-none"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <option value="">— Aucune campagne —</option>
              {campagnes.map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>

            {selectedCampagne !== (campagneId ?? "") && selectedCampagne !== "" && (
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div
                  onClick={() => setResetStatut((v) => !v)}
                  className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors cursor-pointer ${resetStatut ? "bg-brand-500" : "border border-white/20"}`}
                >
                  {resetStatut && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-white/50">Remettre le statut à "En attente"</span>
              </label>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowCampagneEdit(false)}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl text-white/40 hover:text-white transition-colors"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                Annuler
              </button>
              <button
                onClick={handleSaveCampagne}
                disabled={savingCampagne}
                className="flex-1 px-3 py-1.5 text-xs font-semibold rounded-xl text-white disabled:opacity-50 transition-all"
                style={{ background: "linear-gradient(135deg, #008f78, #2b3475)" }}
              >
                {savingCampagne ? "..." : "Enregistrer"}
              </button>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />
      )}
    </>
  );
}
