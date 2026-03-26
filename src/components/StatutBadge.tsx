import type { ProspectStatut } from "@/types/database";

const config: Record<ProspectStatut, { label: string; className: string }> = {
  en_attente: { label: "En attente", className: "bg-white/8 text-white/50 border border-white/10" },
  envoye:     { label: "Envoyé",     className: "bg-blue-500/15 text-blue-300 border border-blue-500/20" },
  repondu:    { label: "Répondu",    className: "bg-brand-600/15 text-brand-400 border border-brand-600/20" },
  rdv:        { label: "RDV",        className: "bg-yellow-500/15 text-yellow-300 border border-yellow-500/20" },
  refus:      { label: "Refus",      className: "bg-red-500/15 text-red-400 border border-red-500/20" },
};

export default function StatutBadge({ statut }: { statut: ProspectStatut }) {
  const { label, className } = config[statut] ?? config.en_attente;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
