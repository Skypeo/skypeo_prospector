# Setup — Notifications WhatsApp Tim

Checklist pour activer les notifs WhatsApp à Tim quand un prospect devient **chaud** ou **brûlant** (RDV).

## Architecture

```
Prospect répond
   ↓
n8n agent IA met à jour statut prospect
   ↓
Trigger SQL met à jour température (chaud / brulant)
   ↓
Supabase Database Webhook fire sur UPDATE prospects
   ↓
Workflow n8n "notif-tim" filtre, envoie WhatsApp à Tim, marque le flag anti-spam
```

## Étape 1 — Exécuter la migration SQL

Dans le dashboard Supabase → **SQL Editor** → New query, coller et exécuter le contenu de :

```
supabase/migration_notif_tim.sql
```

Ce que ça fait :
- Ajoute `notif_chaud_envoyee` et `notif_brulant_envoyee` (boolean) à `prospects`
- Ajoute `tim_whatsapp` à `settings` (vide par défaut, à configurer depuis l'UI `/agent`)
- **Marque les prospects déjà chauds/brûlants comme "déjà notifiés"** pour éviter un déluge à l'activation

## Étape 2 — Créer les deux templates Twilio

Dans **Twilio Console → Content Template Builder → Create new template** :

**Notes importantes sur les rejets Meta rencontrés :**

1. **URL `vercel.app`** = sous-domaine non-vérifié (red flag Meta) → résolu en branchant un domaine custom `auror-ia.fr` sur Vercel
2. **Emojis** = peuvent être vus comme marketing → retirés
3. **Variables au début ou à la fin du template** = interdit par Meta (rejet technique avec `subCode=2388299`) → ajout d'une ligne fixe en fin de template
4. **Wording trop "alerte marketing"** → wording neutre type alerte système

La variable `{{1}}` est un identifiant lisible construit côté n8n à partir du nom et de la société (`"Michael — Skypeo"`, ou juste l'un des deux si l'autre est vide).

### Template 1 — Prospect chaud

- **Friendly name :** `skypeo_notif_chaud`
- **Language :** `fr` (French)
- **Category :** `UTILITY`
- **Body :**
```
Skypeo Prospector

Nouveau prospect chaud : {{1}}

Telephone : {{2}}
Fiche : {{3}}

Connectez-vous au tableau de bord pour repondre.
```

### Template 2 — Prospect brûlant (RDV)

- **Friendly name :** `skypeo_notif_brulant`
- **Language :** `fr` (French)
- **Category :** `UTILITY`
- **Body :**
```
Skypeo Prospector

Nouvelle demande de rendez-vous : {{1}}

Telephone : {{2}}
Fiche : {{3}}

Connectez-vous au tableau de bord pour repondre.
```

**Sample data à fournir lors de la soumission Meta** (pareil pour les 2 templates) :
- `{{1}}` → `Michael — Skypeo`
- `{{2}}` → `+33744529073`
- `{{3}}` → `https://auror-ia.fr/prospects/abc-123`

⚠️ **Avant de soumettre les templates** : vérifier que `https://auror-ia.fr` est bien actif et accessible (la page de login Skypeo doit s'afficher). Si Meta clique sur l'URL pendant la validation et qu'elle ne marche pas, refus garanti.

➡️ Submit for WhatsApp Approval. Validation Meta en quelques heures généralement.

➡️ Une fois validés, **récupère les deux Content SID** (format `HX...`).

## Étape 3 — Importer le workflow n8n

1. n8n → **Import from File** → `n8n-workflows/workflow-notif-tim.json`
2. Ouvrir le node **"Filtrer & enrichir"** et remplacer :
   - `TODO_CONTENT_SID_CHAUD` par le Content SID du template chaud
   - `TODO_CONTENT_SID_BRULANT` par le Content SID du template brûlant
3. Vérifier que `APP_BASE_URL` correspond bien à ton URL Vercel de prod (par défaut `https://skypeo-prospector.vercel.app`)
4. **Activer le workflow** (toggle en haut à droite)
5. **Copier l'URL du webhook** (Webhook Supabase → Production URL) — ressemble à :
   ```
   https://ton-n8n.com/webhook/notif-tim
   ```

## Étape 4 — Créer la Database Webhook Supabase

Dashboard Supabase → **Database → Webhooks → Create a new hook** :

| Champ | Valeur |
|---|---|
| **Name** | `notif-tim-prospect-chaud` |
| **Table** | `prospects` |
| **Events** | ✅ `Update` uniquement |
| **Type** | `HTTP Request` |
| **HTTP Method** | `POST` |
| **URL** | l'URL du webhook n8n copiée à l'étape 3 |
| **HTTP Headers** | (par défaut, rien à ajouter) |
| **HTTP Params** | (rien) |

➡️ **Save**

## Étape 5 — Test end-to-end

1. Sur l'app, prendre un prospect en `tiede` / `envoye`
2. Changer son statut à `repondu` (ou laisser un client répondre via WhatsApp)
3. La température doit passer à `chaud` automatiquement
4. Tim doit recevoir le message WhatsApp dans la minute
5. Vérifier en SQL que `notif_chaud_envoyee = true` sur ce prospect
6. Refaire un changement sur ce prospect → **Tim ne doit PAS être renotifié** (anti-spam)
7. Passer le prospect à `rdv` → température `brulant` → 2e notif différente envoyée

## Étape 6 — Modifier le numéro de Tim depuis l'UI

Page `/agent` de l'app → champ "Notifications WhatsApp — Tim" → modifier → Sauvegarder.
Le workflow n8n lit cette valeur à chaque exécution, donc pas de redémarrage nécessaire.

## Reset manuel des flags (en cas de besoin)

Si tu veux re-tester sur un prospect déjà notifié :

```sql
update public.prospects
set notif_chaud_envoyee = false,
    notif_brulant_envoyee = false
where id = 'uuid-du-prospect';
```

Pour TOUT remettre à zéro (à n'utiliser qu'en dev) :

```sql
update public.prospects
set notif_chaud_envoyee = false,
    notif_brulant_envoyee = false;
```

⚠️ Si tu fais ça en prod, **désactive d'abord le workflow n8n** sinon Tim va recevoir des dizaines/centaines de notifs d'un coup.
