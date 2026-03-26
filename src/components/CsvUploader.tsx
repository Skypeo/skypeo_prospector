"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/client";

interface CsvRow {
  societe?: string;
  prenom?: string;
  mobile?: string;
  activite?: string;
  ville?: string;
  [key: string]: string | undefined;
}

type ImportResult = { ok: number; duplicates: number; errors: number };

export default function CsvUploader({
  onImported,
  campagneId,
  showHint = true,
  compact = false,
}: {
  onImported: (result: ImportResult) => void;
  campagneId?: string;
  showHint?: boolean;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setResult(null);

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: ",",
      complete: async ({ data }) => {
        const supabase = createClient();

        const rows = data
          .filter((r) => r["mobile"]?.trim())
          .map((r) => {
            const raw = r["mobile"]!.trim().replace(/\s/g, "");
            const telephone = raw.startsWith("0") ? "+33" + raw.slice(1) : raw;
            return {
              nom: r["prenom"]?.trim() ?? "",
              societe: r["societe"]?.trim() ?? null,
              telephone,
              activite: r["activite"]?.trim() ?? null,
              ville: r["ville"]?.trim() ?? null,
              statut: "en_attente" as const,
              campagne_id: campagneId ?? null,
            };
          });

        if (rows.length === 0) {
          setResult({ ok: 0, duplicates: 0, errors: 1 });
          setLoading(false);
          if (inputRef.current) inputRef.current.value = "";
          return;
        }

        // Pré-vérifier les numéros déjà existants
        const phones = rows.map((r) => r.telephone);
        const { data: existing } = await supabase
          .from("prospects")
          .select("telephone")
          .in("telephone", phones);

        const existingPhones = new Set((existing ?? []).map((p) => p.telephone));
        const newRows = rows.filter((r) => !existingPhones.has(r.telephone));
        const duplicates = rows.length - newRows.length;

        let ok = 0;
        let errors = 0;

        if (newRows.length > 0) {
          const { error } = await supabase.from("prospects").insert(newRows);
          if (error) {
            errors = newRows.length;
          } else {
            ok = newRows.length;
          }
        }

        const importResult = { ok, duplicates, errors };
        setResult(importResult);
        setLoading(false);
        if (ok > 0) onImported(importResult);
        if (inputRef.current) inputRef.current.value = "";
      },
      error: () => {
        setResult({ ok: 0, duplicates: 0, errors: 1 });
        setLoading(false);
      },
    });
  }

  return (
    <div className="text-right">
      <label
        className={`inline-flex items-center gap-2 ${compact ? "px-3.5 py-1.5 text-xs" : "px-4 py-2.5 text-sm"} font-medium text-white/70 hover:text-white cursor-pointer transition-all rounded-xl`}
        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        {loading ? "Import en cours..." : "Importer CSV"}
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFile}
          disabled={loading}
        />
      </label>

      {result && (
        <div className="mt-2 space-y-0.5">
          {result.ok > 0 && (
            <p className="text-xs text-brand-400">{result.ok} prospect(s) importé(s).</p>
          )}
          {result.duplicates > 0 && (
            <p className="text-xs text-yellow-400/80">{result.duplicates} doublon(s) ignoré(s).</p>
          )}
          {result.errors > 0 && (
            <p className="text-xs text-red-400">{result.errors} erreur(s) lors de l&apos;insertion.</p>
          )}
          {result.ok === 0 && result.duplicates > 0 && result.errors === 0 && (
            <p className="text-xs text-white/30">Tous les numéros existent déjà.</p>
          )}
        </div>
      )}

      {showHint && (
        <p className="mt-1 text-xs text-white/25">
          Format CSV — colonnes : societe, prenom, mobile, activite, ville
        </p>
      )}
    </div>
  );
}
