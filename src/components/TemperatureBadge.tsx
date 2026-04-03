import type { ProspectTemperature } from "@/types/database";

const config: Record<ProspectTemperature, { label: string; className: string }> = {
  froid:   { label: "Froid",    className: "bg-sky-500/15 text-sky-300 border border-sky-500/20" },
  tiede:   { label: "Tiède",    className: "bg-amber-500/15 text-amber-300 border border-amber-500/20" },
  chaud:   { label: "Chaud",    className: "bg-orange-500/15 text-orange-300 border border-orange-500/20" },
  brulant: { label: "Brûlant",  className: "bg-red-500/15 text-red-300 border border-red-500/20" },
};

export default function TemperatureBadge({ temperature }: { temperature: ProspectTemperature }) {
  const { label, className } = config[temperature] ?? config.froid;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
