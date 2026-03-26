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
- **prospects** — id, nom, société, téléphone, activité, ville, statut, created_at
- **conversations** — id, prospect_id, message, direction, timestamp
- **campagnes** — id, nom, nb_envois_par_jour, statut, created_at

## Statuts prospect
`en_attente` → `envoye` → `repondu` → `rdv` ou `refus`

## Setup
1. Copier `.env.local.example` → `.env.local` et remplir les clés Supabase
2. Exécuter `supabase/schema.sql` dans l'éditeur SQL Supabase
3. Créer les users manuellement dans Supabase Auth (pas d'inscription publique)
4. `npm install && npm run dev`
