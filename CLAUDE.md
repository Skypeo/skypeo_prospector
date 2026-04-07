# Skypeo Prospector

Outil de prospection WhatsApp automatisé.

## Stack
- Next.js 14 (App Router)
- Supabase (Auth + PostgreSQL + RLS)
- Tailwind CSS
- TypeScript
- PapaParse (import CSV)

## Structure principale
```
src/
├── app/
│   ├── (app)/              # Layout avec sidebar (pages protégées)
│   │   ├── dashboard/      # Stats globales
│   │   ├── prospects/      # Liste + upload CSV
│   │   │   └── [id]/       # Détail prospect + historique
│   │   └── campagnes/      # Gestion campagnes
│   ├── login/              # Page de connexion
│   ├── layout.tsx
│   └── page.tsx            # Redirect → /dashboard
├── components/
│   ├── Sidebar.tsx
│   ├── StatutBadge.tsx
│   └── CsvUploader.tsx
├── lib/supabase/
│   ├── client.ts           # Browser client
│   └── server.ts           # Server client
├── middleware.ts            # Protection routes + redirect auth
└── types/database.ts       # Types TypeScript

supabase/schema.sql          # Schéma SQL + RLS à exécuter dans Supabase
```

## Tables Supabase
- **prospects** — id, nom, société, téléphone, activité, ville, statut, temperature, notif_chaud_envoyee, notif_brulant_envoyee, created_at
- **conversations** — id, prospect_id, message, direction, timestamp
- **campagnes** — id, nom, nb_envois_par_jour, statut, created_at
- **settings** — id (=1), prompt, tim_whatsapp, updated_at

## Notifications WhatsApp Tim
Quand un prospect devient `chaud` (statut `repondu`) ou `brûlant` (statut `rdv`), Tim reçoit automatiquement une notification WhatsApp via Twilio. Architecture : Database Webhook Supabase → workflow n8n → Twilio Content Templates. Voir `docs/setup-notif-tim.md` pour la procédure complète. Anti-spam : 1 notif max par niveau (chaud/brûlant) par prospect.

## Sécurité
- **Aucun secret en dur** dans les fichiers commités. Le dossier `n8n-workflows/` est dans `.gitignore` car les workflows contiennent des credentials Twilio + Supabase service_role.
- Les numéros de téléphone perso ne doivent **jamais** être hardcodés dans le code, ils vivent en base (`settings.tim_whatsapp` modifiable depuis `/agent`).

## Statuts prospect
`en_attente` → `envoye` → `repondu` → `rdv` ou `refus`

## Température prospect (lead scoring)
`froid` → `tiede` → `chaud` → `brulant`
- Froid : jamais contacté ou aucun intérêt
- Tiède : léger intérêt, a répondu vaguement
- Chaud : intéressé, pose des questions
- Brûlant : prêt à acheter / veut un RDV

## Setup
1. Copier `.env.local.example` → `.env.local` et remplir les clés Supabase
2. Exécuter `supabase/schema.sql` dans l'éditeur SQL Supabase
3. Créer les users manuellement dans Supabase Auth (pas d'inscription publique)
4. `npm install && npm run dev`
