"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Rafraîchit automatiquement les données de la page (Server Components) à
 * intervalle régulier, sans recharger toute la page ni perdre l'état client.
 *
 * Utile sur le dashboard et les campagnes : les envois partent en arrière-plan
 * (cron n8n) et mettent à jour la base. Sans ça, les compteurs ne bougent que
 * lorsqu'on quitte l'onglet puis qu'on revient.
 */
export default function AutoRefresh({ intervalMs = 15000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const tick = () => {
      // On ne rafraîchit pas si l'onglet est en arrière-plan (inutile)
      if (document.visibilityState === "visible") router.refresh();
    };
    const id = setInterval(tick, intervalMs);
    // Rafraîchit aussi dès qu'on revient sur l'onglet
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router, intervalMs]);

  return null;
}
