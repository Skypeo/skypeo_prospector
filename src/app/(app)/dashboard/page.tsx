import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

async function getStats() {
  const supabase = await createClient();
  const [{ count: total }, { count: envoyes }, { count: reponses }, { count: rdv }] =
    await Promise.all([
      supabase.from("prospects").select("*", { count: "exact", head: true }),
      // Compter les vrais messages envoyés via WhatsApp (conversations sortantes)
      supabase.from("conversations").select("*", { count: "exact", head: true }).eq("direction", "sortant"),
      supabase.from("prospects").select("*", { count: "exact", head: true }).eq("statut", "repondu"),
      supabase.from("prospects").select("*", { count: "exact", head: true }).eq("statut", "rdv"),
    ]);
  return { total: total ?? 0, envoyes: envoyes ?? 0, reponses: reponses ?? 0, rdv: rdv ?? 0 };
}

const statsConfig = [
  {
    key: "total" as const,
    label: "Total prospects",
    iconBg: "linear-gradient(135deg, #2b3475, #1a2055)",
    iconColor: "#818cf8",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    key: "envoyes" as const,
    label: "Messages WhatsApp envoyés",
    iconBg: "linear-gradient(135deg, #008f78, #006b5a)",
    iconColor: "#4ade80",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
  },
  {
    key: "reponses" as const,
    label: "Réponses reçues",
    iconBg: "linear-gradient(135deg, #008f78, #2b3475)",
    iconColor: "#00b49f",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  {
    key: "rdv" as const,
    label: "RDV obtenus",
    iconBg: "linear-gradient(135deg, #b45309, #92400e)",
    iconColor: "#fbbf24",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-white/40 text-sm mt-1">Vue d&apos;ensemble de vos campagnes</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/prospects"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-all"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Prospects
          </Link>
          <Link
            href="/campagnes"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: "linear-gradient(135deg, #008f78, #2b3475)" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Campagnes
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {statsConfig.map((s) => (
          <div
            key={s.key}
            className="rounded-2xl p-5 glass glass-hover transition-all"
          >
            <div
              className="inline-flex p-2.5 rounded-xl mb-4"
              style={{ background: s.iconBg, color: s.iconColor }}
            >
              {s.icon}
            </div>
            <p className="text-3xl font-bold text-white">{stats[s.key]}</p>
            <p className="text-sm text-white/45 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {stats.total > 0 && stats.envoyes > 0 && (
        <div className="rounded-2xl p-6 glass">
          <h2 className="text-sm font-semibold text-white/70 mb-5">Taux de conversion</h2>
          <div className="space-y-5">
            <ConversionBar
              label="Taux de réponse"
              value={stats.reponses}
              total={stats.envoyes}
              color="#008f78"
            />
            <ConversionBar
              label="Taux de RDV"
              value={stats.rdv}
              total={stats.envoyes}
              color="#f59e0b"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ConversionBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-white/55">{label}</span>
        <span className="font-semibold text-white">
          {value} / {total}{" "}
          <span className="text-white/40 font-normal">({pct}%)</span>
        </span>
      </div>
      <div className="w-full rounded-full h-1.5" style={{ background: "rgba(255,255,255,0.07)" }}>
        <div
          className="h-1.5 rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
