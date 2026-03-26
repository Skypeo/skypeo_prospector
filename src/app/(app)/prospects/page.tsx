import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import StatutBadge from "@/components/StatutBadge";
import { SearchInput, DeleteProspectButton, CsvUploaderWrapper, PaginationControls } from "./ProspectsClient";
import { Suspense } from "react";
import type { ProspectStatut } from "@/types/database";

const STATUTS: { value: ProspectStatut | "tous"; label: string }[] = [
  { value: "tous", label: "Tous" },
  { value: "en_attente", label: "En attente" },
  { value: "envoye", label: "Envoyé" },
  { value: "repondu", label: "Répondu" },
  { value: "rdv", label: "RDV" },
  { value: "refus", label: "Refus" },
];

const PAGE_SIZE = 20;

export default async function ProspectsPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; q?: string; campagne?: string; page?: string }>;
}) {
  const supabase = await createClient();
  const { statut, q: qRaw, campagne: campagneFilter, page: pageParam } = await searchParams;
  const q = qRaw?.trim();
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const [{ data: campagnes }] = await Promise.all([
    supabase.from("campagnes").select("id, nom").order("created_at", { ascending: false }),
  ]);

  let baseQuery = supabase.from("prospects").select("*", { count: "exact" });
  if (statut && statut !== "tous") baseQuery = baseQuery.eq("statut", statut);
  if (q) baseQuery = baseQuery.or(`nom.ilike.%${q}%,societe.ilike.%${q}%,ville.ilike.%${q}%`);
  if (campagneFilter && campagneFilter !== "toutes") {
    if (campagneFilter === "aucune") {
      baseQuery = baseQuery.is("campagne_id", null);
    } else {
      baseQuery = baseQuery.eq("campagne_id", campagneFilter);
    }
  }

  const { data: prospects, count } = await baseQuery
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const hasFilters = !!(statut && statut !== "tous") || !!q || !!(campagneFilter && campagneFilter !== "toutes");
  const campagneName = campagnes?.find((c) => c.id === campagneFilter)?.nom;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Prospects</h1>
          <p className="text-white/40 text-sm mt-1">
            {totalCount} prospect(s){campagneName ? ` · ${campagneName}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Suspense>
            <SearchInput />
          </Suspense>
          <Suspense>
            <CsvUploaderWrapper />
          </Suspense>
        </div>
      </div>

      {/* Filtres statut */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {STATUTS.map((s) => {
          const current = statut ?? "tous";
          const active = current === s.value;
          const href = new URLSearchParams({
            ...(s.value !== "tous" ? { statut: s.value } : {}),
            ...(campagneFilter && campagneFilter !== "toutes" ? { campagne: campagneFilter } : {}),
            ...(q ? { q } : {}),
          }).toString();
          return (
            <Link
              key={s.value}
              href={`/prospects${href ? `?${href}` : ""}`}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "text-white border border-brand-600/30"
                  : "text-white/45 border border-white/8 hover:text-white hover:border-white/15"
              }`}
              style={active ? { background: "rgba(0,143,120,0.2)" } : {}}
            >
              {s.label}
            </Link>
          );
        })}

        {/* Filtre campagne */}
        {campagnes && campagnes.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-white/30">Campagne :</span>
            <div className="flex gap-1.5">
              {[{ id: "toutes", nom: "Toutes" }, ...campagnes, { id: "aucune", nom: "Sans campagne" }].map((c) => {
                const active = (campagneFilter ?? "toutes") === c.id;
                const href = new URLSearchParams({
                  ...(statut && statut !== "tous" ? { statut } : {}),
                  ...(c.id !== "toutes" ? { campagne: c.id } : {}),
                  ...(q ? { q } : {}),
                }).toString();
                return (
                  <Link
                    key={c.id}
                    href={`/prospects${href ? `?${href}` : ""}`}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      active ? "text-white" : "text-white/35 hover:text-white/60"
                    }`}
                    style={active ? { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" } : { border: "1px solid transparent" }}
                  >
                    {c.nom}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl overflow-hidden glass">
        {!prospects || prospects.length === 0 ? (
          <div className="p-16 text-center">
            <svg className="w-10 h-10 mx-auto mb-3 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {hasFilters ? (
              <>
                <p className="text-sm text-white/35 mb-2">Aucun prospect ne correspond à ces filtres.</p>
                <Link href="/prospects" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                  Réinitialiser les filtres
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-white/50 mb-1">Aucun prospect pour l&apos;instant</p>
                <p className="text-xs text-white/25 mb-4">Importez votre premier fichier CSV pour commencer.</p>
                <Suspense>
                  <CsvUploaderWrapper />
                </Suspense>
              </>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-white/35 uppercase tracking-wider">Nom</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-white/35 uppercase tracking-wider">Société</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-white/35 uppercase tracking-wider">Téléphone</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-white/35 uppercase tracking-wider">Ville</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-white/35 uppercase tracking-wider">Statut</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-white/35 uppercase tracking-wider">Créé le</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {prospects.map((p, i) => (
                <tr
                  key={p.id}
                  className="transition-colors hover:bg-white/3"
                  style={{ borderBottom: i < prospects.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
                >
                  <td className="px-5 py-3.5 font-medium text-white">{p.nom || "—"}</td>
                  <td className="px-5 py-3.5 text-white/50">{p.societe ?? "—"}</td>
                  <td className="px-5 py-3.5 text-white/50">{p.telephone}</td>
                  <td className="px-5 py-3.5 text-white/50">{p.ville ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <StatutBadge statut={p.statut as ProspectStatut} />
                  </td>
                  <td className="px-5 py-3.5 text-white/30 text-xs">
                    {new Date(p.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Link href={`/prospects/${p.id}`} className="text-brand-400 hover:text-brand-300 font-medium text-xs transition-colors">
                        Voir →
                      </Link>
                      <DeleteProspectButton prospectId={p.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Suspense>
        <PaginationControls page={page} totalPages={totalPages} />
      </Suspense>
    </div>
  );
}
