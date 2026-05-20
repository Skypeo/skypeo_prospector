import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Retourne l'ensemble des prospect_id ayant au moins une conversation entrante
 * postérieure à leur derniere_consultation_at (ou jamais consultés).
 *
 * Utilisé pour afficher le badge "Nouveau" dans la liste et le compteur
 * dans la sidebar.
 */
export async function getProspectsAvecNouvelleReponse(
  supabase: SupabaseClient
): Promise<Set<string>> {
  const { data: entrantes } = await supabase
    .from("conversations")
    .select("prospect_id, timestamp")
    .eq("direction", "entrant")
    .order("timestamp", { ascending: false });

  const lastEntranteMap = new Map<string, string>();
  for (const c of entrantes ?? []) {
    if (!lastEntranteMap.has(c.prospect_id)) {
      lastEntranteMap.set(c.prospect_id, c.timestamp);
    }
  }

  const prospectIds = Array.from(lastEntranteMap.keys());
  if (prospectIds.length === 0) return new Set();

  const { data: prospects } = await supabase
    .from("prospects")
    .select("id, derniere_consultation_at")
    .in("id", prospectIds);

  const result = new Set<string>();
  for (const p of prospects ?? []) {
    const lastEntrante = lastEntranteMap.get(p.id);
    if (!lastEntrante) continue;
    if (
      !p.derniere_consultation_at ||
      new Date(lastEntrante) > new Date(p.derniere_consultation_at)
    ) {
      result.add(p.id);
    }
  }
  return result;
}
