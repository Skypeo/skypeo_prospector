import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import StatutBadge from "@/components/StatutBadge";
import type { ProspectStatut } from "@/types/database";
import ProspectActions from "./ProspectActions";

export default async function ProspectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: prospect }, { data: conversations }, { data: campagnes }] = await Promise.all([
    supabase.from("prospects").select("*").eq("id", id).single(),
    supabase
      .from("conversations")
      .select("*")
      .eq("prospect_id", id)
      .order("timestamp", { ascending: true }),
    supabase.from("campagnes").select("id, nom").order("created_at", { ascending: false }),
  ]);

  if (!prospect) notFound();

  return (
    <div className="max-w-3xl">
      {/* Back */}
      <Link
        href="/prospects"
        className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors mb-5"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour aux prospects
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{prospect.nom}</h1>
          <p className="text-white/40 text-sm mt-0.5">
            {prospect.societe ?? "—"} · {prospect.ville ?? "—"}
          </p>
        </div>
        <StatutBadge statut={prospect.statut as ProspectStatut} />
      </div>

      {/* Infos */}
      <div className="rounded-2xl p-5 mb-5 glass">
        <h2 className="text-xs font-semibold text-white/35 uppercase tracking-wider mb-4">Informations</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <InfoRow label="Téléphone" value={prospect.telephone} />
          <InfoRow label="Activité" value={prospect.activite ?? "—"} />
          <InfoRow label="Ville" value={prospect.ville ?? "—"} />
          <InfoRow
            label="Créé le"
            value={new Date(prospect.created_at).toLocaleDateString("fr-FR")}
          />
        </dl>
      </div>

      {/* Actions */}
      <ProspectActions
        prospectId={prospect.id}
        currentStatut={prospect.statut as ProspectStatut}
        currentCampagneId={prospect.campagne_id ?? null}
        campagnes={campagnes ?? []}
      />

      {/* Historique */}
      <div className="rounded-2xl p-5 glass">
        <h2 className="text-xs font-semibold text-white/35 uppercase tracking-wider mb-4">Historique conversation</h2>

        {!conversations || conversations.length === 0 ? (
          <p className="text-sm text-white/25 text-center py-8">Aucun message pour l&apos;instant.</p>
        ) : (
          <div className="space-y-3">
            {conversations.map((c) => (
              <div
                key={c.id}
                className={`flex ${c.direction === "sortant" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-sm px-4 py-2.5 rounded-2xl text-sm ${
                    c.direction === "sortant"
                      ? "text-white rounded-br-sm"
                      : "rounded-bl-sm"
                  }`}
                  style={
                    c.direction === "sortant"
                      ? { background: "linear-gradient(135deg, #008f78, #2b3475)" }
                      : { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }
                  }
                >
                  <p>{c.message}</p>
                  <p className={`text-xs mt-1 ${c.direction === "sortant" ? "text-white/50" : "text-white/30"}`}>
                    {new Date(c.timestamp).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-white/35 text-xs mb-0.5">{label}</dt>
      <dd className="font-medium text-white text-sm">{value}</dd>
    </div>
  );
}
