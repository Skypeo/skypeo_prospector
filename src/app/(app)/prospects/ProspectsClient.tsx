"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import CsvUploader from "@/components/CsvUploader";
import Toast from "@/components/Toast";
import { createClient } from "@/lib/supabase/client";

export function DeleteProspectButton({ prospectId }: { prospectId: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  async function handleDelete() {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("conversations").delete().eq("prospect_id", prospectId);
    const { error } = await supabase.from("prospects").delete().eq("id", prospectId);
    if (error) {
      setToast({ message: "Erreur lors de la suppression.", type: "error" });
      setLoading(false);
      setConfirm(false);
    } else {
      router.refresh();
    }
  }

  if (confirm) {
    return (
      <>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-2 py-1 text-xs font-medium rounded-lg text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            {loading ? "..." : "Oui"}
          </button>
          <button
            onClick={() => setConfirm(false)}
            className="px-2 py-1 text-xs rounded-lg text-white/30 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            Non
          </button>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
      </>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="p-1.5 rounded-lg text-white/20 hover:text-red-400 transition-colors"
      title="Supprimer"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  );
}

export function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const params = new URLSearchParams(searchParams.toString());
      if (e.target.value) {
        params.set("q", e.target.value);
      } else {
        params.delete("q");
      }
      params.delete("statut");
      params.delete("page");
      router.push(`/prospects?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <input
      type="text"
      defaultValue={searchParams.get("q") ?? ""}
      onChange={handleChange}
      placeholder="Rechercher nom, société, ville..."
      className="w-56 px-4 py-2 rounded-xl text-sm text-white/80 placeholder-white/25 outline-none focus:ring-1 focus:ring-brand-500/50"
      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
    />
  );
}

export function CsvUploaderWrapper() {
  const router = useRouter();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  return (
    <>
      <CsvUploader
        showHint={false}
        compact
        onImported={({ ok, duplicates }) => {
          const msg = duplicates > 0
            ? `${ok} importé(s), ${duplicates} doublon(s) ignoré(s).`
            : `${ok} prospect(s) importé(s).`;
          setToast({ message: msg, type: "success" });
          router.refresh();
        }}
      />
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </>
  );
}

export function PaginationControls({ page, totalPages }: { page: number; totalPages: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function goTo(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (p === 1) {
      params.delete("page");
    } else {
      params.set("page", String(p));
    }
    router.push(`/prospects?${params.toString()}`);
  }

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <span className="text-xs text-white/30">
        Page {page} sur {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-xl text-xs font-medium text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          ← Précédent
        </button>
        <button
          onClick={() => goTo(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 rounded-xl text-xs font-medium text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          Suivant →
        </button>
      </div>
    </div>
  );
}
