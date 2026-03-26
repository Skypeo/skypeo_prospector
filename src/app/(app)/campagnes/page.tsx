import { createClient } from "@/lib/supabase/server";
import CampagnesClient, { CampagneActions } from "./CampagnesClient";
import type { CampagneStatut } from "@/types/database";

const statutConfig: Record<CampagneStatut, { label: string; dot: string }> = {
  active:   { label: "Active",    dot: "bg-brand-400" },
  pause:    { label: "En pause",  dot: "bg-yellow-400" },
  terminee: { label: "Terminée",  dot: "bg-white/20" },
};

export default async function CampagnesPage() {
  const supabase = await createClient();

  const [{ data: campagnes }, { data: prospectStats }] = await Promise.all([
    supabase.from("campagnes").select("*").order("created_at", { ascending: false }),
    supabase.from("prospects").select("campagne_id, statut").not("campagne_id", "is", null),
  ]);

  type Stats = { en_attente: number; envoye: number; repondu: number; rdv: number };
  const statsByCampagne: Record<string, Stats> = {};
  for (const p of prospectStats ?? []) {
    if (!p.campagne_id) continue;
    if (!statsByCampagne[p.campagne_id]) {
      statsByCampagne[p.campagne_id] = { en_attente: 0, envoye: 0, repondu: 0, rdv: 0 };
    }
    const s = p.statut as keyof Stats;
    if (s in statsByCampagne[p.campagne_id]) statsByCampagne[p.campagne_id][s]++;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Campagnes</h1>
          <p className="text-white/40 text-sm mt-1">{campagnes?.length ?? 0} campagne(s)</p>
        </div>
        <CampagnesClient />
      </div>

      <div className="space-y-3">
        {!campagnes || campagnes.length === 0 ? (
          <div className="rounded-2xl p-16 text-center glass">
            <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}>
              <svg className="w-6 h-6 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <p className="text-sm text-white/35">Aucune campagne. Créez-en une pour commencer.</p>
          </div>
        ) : (
          campagnes.map((c) => {
            const statut = c.statut as CampagneStatut;
            const { label, dot } = statutConfig[statut];
            const stats = statsByCampagne[c.id] ?? { en_attente: 0, envoye: 0, repondu: 0, rdv: 0 };
            const total = stats.en_attente + stats.envoye + stats.repondu + stats.rdv;
            const progress = total > 0 ? Math.round(((total - stats.en_attente) / total) * 100) : 0;

            return (
              <div key={c.id} className="rounded-2xl glass overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                      <h3 className="font-semibold text-white truncate">{c.nom}</h3>
                    </div>
                    <span className="text-xs text-white/30 shrink-0">{label}</span>
                    <span className="text-xs text-white/20 shrink-0">·</span>
                    <span className="text-xs text-white/30 shrink-0">{c.nb_envois_par_jour} / jour</span>
                  </div>
                  <CampagneActions campagneId={c.id} currentStatut={statut} enAttenteCount={stats.en_attente} />
                </div>

                {/* Stats + progress */}
                <div className="px-5 pb-4 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  {total === 0 ? (
                    <p className="text-xs text-white/25 pt-3">Aucun prospect — importez un CSV via le bouton ci-dessus</p>
                  ) : (
                    <div className="pt-3 space-y-3">
                      <div className="flex items-center gap-6">
                        <StatItem value={total} label="Total" color="text-white/60" />
                        <StatItem value={stats.en_attente} label="En attente" color="text-white/40" />
                        <StatItem value={stats.envoye} label="Envoyés" color="text-brand-400" />
                        <StatItem value={stats.repondu} label="Réponses" color="text-green-400" />
                        <StatItem value={stats.rdv} label="RDV" color="text-yellow-400" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-white/25 mb-1.5">
                          <span>Progression</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full h-1 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                          <div className="h-1 rounded-full transition-all" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #008f78, #2b3475)" }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function StatItem({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div>
      <p className={`text-base font-bold ${color}`}>{value}</p>
      <p className="text-xs text-white/30">{label}</p>
    </div>
  );
}
