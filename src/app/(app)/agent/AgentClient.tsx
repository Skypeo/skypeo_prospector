"use client";

import { useState, useCallback } from "react";
import Toast from "@/components/Toast";

export default function AgentClient({ initialPrompt }: { initialPrompt: string }) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const clearToast = useCallback(() => setToast(null), []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error();
      setToast({ message: "Prompt sauvegardé", type: "success" });
    } catch {
      setToast({ message: "Erreur lors de la sauvegarde", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Agent IA</h1>
          <p className="text-white/40 text-sm mt-1">Paramétrez le comportement de l&apos;agent WhatsApp</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #008f78, #2b3475)" }}
        >
          {saving ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          Sauvegarder
        </button>
      </div>

      <div className="rounded-2xl glass overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: "linear-gradient(135deg, #008f78, #2b3475)" }}
            />
            <span className="text-sm font-medium text-white/70">System prompt</span>
          </div>
          <span className="text-xs text-white/25">
            Variables disponibles :{" "}
            {["{{nom}}", "{{societe}}", "{{activite}}", "{{ville}}", "{{telephone}}"].map((v) => (
              <code key={v} className="mx-1 px-1.5 py-0.5 rounded text-[10px]" style={{ background: "rgba(255,255,255,0.07)" }}>
                {v}
              </code>
            ))}
          </span>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          spellCheck={false}
          className="w-full bg-transparent text-white/80 text-sm font-mono leading-relaxed resize-none focus:outline-none p-5"
          style={{ minHeight: "65vh" }}
        />
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onDone={clearToast} />}
    </>
  );
}
