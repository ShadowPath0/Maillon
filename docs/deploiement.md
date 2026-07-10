# Déploiement

Deux chemins possibles. Le premier est recommandé : moins de comptes, moins de réglages, aucun contournement technique à comprendre.

Dans les deux cas, la première étape est la même et c'est la seule chose qui bloque tout le reste :

## 0. Créer le dépôt GitHub (obligatoire, quel que soit le chemin choisi)

1. Va sur https://github.com/new, crée un dépôt vide (ex. `maillon`), **sans** README/gitignore (déjà présents).
2. Donne-moi l'URL du dépôt (ou dis "c'est fait" si tu l'as nommé `maillon`) — je pousse le code.

---

## Chemin simple — Vercel + Railway (~5-10 $/mois, un seul compte à gérer côté backend)

Railway héberge l'API, la base Postgres **et** le stockage de fichiers dans un seul projet, avec un disque persistant et un processus toujours actif. Résultat concret : pas de fichiers perdus au redéploiement, pas de mise en veille, pas besoin d'un pingeur de cron externe — tout ce que la version gratuite plus bas doit contourner disparaît simplement.

### 1. Base de données + API — Railway

1. https://railway.app → créer un compte → New Project → **Deploy from GitHub repo** → sélectionner le dépôt.
2. Ajouter une base de données : **New → Database → PostgreSQL** dans le même projet. Railway expose automatiquement `DATABASE_URL` aux autres services du projet.
3. Sur le service créé à partir du dépôt (l'API) :
   - **Root Directory** : `apps/api`
   - **Build Command** : `cd ../.. && npm install && npm run build -w packages/database && npm run build -w packages/shared-types && npm run build -w apps/api`
   - **Start Command** : `node dist/main.js`
   - **Variables** :
     ```
     DATABASE_URL=${{Postgres.DATABASE_URL}}   (référence automatique à la base créée à l'étape 2)
     JWT_ACCESS_SECRET=<valeur aléatoire longue>
     JWT_REFRESH_SECRET=<autre valeur aléatoire longue>
     JWT_ACCESS_EXPIRES_IN=15m
     JWT_REFRESH_EXPIRES_IN=30d
     STORAGE_DRIVER=local
     WEB_URL=https://<ton-projet>.vercel.app   (à mettre à jour après l'étape 2 ci-dessous)
     RESEND_API_KEY=   (laisser vide pour désactiver les emails, ou ta clé Resend)
     EMAIL_FROM=notifications@example.com
     ```
   - Dans **Settings → Volumes**, ajouter un volume monté sur `/app/apps/api/storage` — c'est ce qui rend le stockage de fichiers persistant (pas besoin de S3/R2).
4. Générer un domaine public pour ce service (**Settings → Networking → Generate Domain**) et noter l'URL (ex. `maillon-api.up.railway.app`).
5. Le cron interne (`@nestjs/schedule`) fonctionne tel quel — Railway garde le process actif en permanence, pas besoin du endpoint `/internal/cron/run` ni d'un pingeur externe.

### 2. Frontend — Vercel (gratuit)

1. https://vercel.com → New Project → importer le dépôt GitHub.
2. **Root Directory** : `apps/web`, activer "Include files outside of the root directory" si proposé.
3. Variable d'environnement : `NEXT_PUBLIC_API_URL=https://<ton-url-railway>`
4. Déployer, puis retourner dans Railway pour mettre à jour `WEB_URL` avec l'URL Vercel obtenue.

### 3. Appliquer le schéma et peupler la base

Depuis ta machine, une seule fois :
```bash
cd "C:\Users\anony\OneDrive\Bureau\gestion-sous-traitants"
DATABASE_URL="<connection string Railway, visible dans l'onglet Postgres>" npm run db:migrate -w packages/database -- deploy
DATABASE_URL="<idem>" npm run db:seed -w packages/database   (optionnel, saute si tu veux partir d'une base vide)
```

C'est tout — deux comptes (Railway + Vercel), aucun contournement à retenir.

---

## Chemin gratuit — Vercel + Render + Neon (0 €, plus de réglages)

Trois comptes séparés, et deux limitations du plan gratuit de Render à contourner (mise en veille après 15 min d'inactivité, disque réinitialisé à chaque redéploiement). Utile si le budget doit rester à zéro le temps des premiers tests.

### 1. Base de données — Neon (gratuit, persistant)

1. https://neon.tech → créer un compte → nouveau projet.
2. Copier la "Connection string" (format `postgresql://...`).
3. Depuis ta machine :
   ```bash
   cd "C:\Users\anony\OneDrive\Bureau\gestion-sous-traitants"
   DATABASE_URL="<connection string Neon>" npm run db:migrate -w packages/database -- deploy
   DATABASE_URL="<connection string Neon>" npm run db:seed -w packages/database
   ```

### 2. API — Render (gratuit, avec mise en veille après 15 min d'inactivité)

1. https://render.com → New → Web Service → connecter le dépôt GitHub.
2. **Root Directory** : `apps/api`
3. **Build Command** : `cd ../.. && npm install && npm run build -w packages/database && npm run build -w packages/shared-types && npm run build -w apps/api`
4. **Start Command** : `node dist/main.js`, **Plan** : Free
5. Variables d'environnement :
   ```
   DATABASE_URL=<connection string Neon>
   JWT_ACCESS_SECRET=<valeur aléatoire longue>
   JWT_REFRESH_SECRET=<autre valeur aléatoire longue>
   JWT_ACCESS_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=30d
   CRON_SECRET=<valeur aléatoire>
   WEB_URL=https://<ton-projet>.vercel.app   (à mettre à jour après l'étape 3)
   STORAGE_DRIVER=local
   RESEND_API_KEY=
   EMAIL_FROM=notifications@example.com
   ```
6. Note l'URL Render une fois déployé (ex. `https://maillon-api.onrender.com`).

**Limitation à connaître** : avec `STORAGE_DRIVER=local`, les fichiers uploadés sont réinitialisés à chaque redéploiement et parfois au réveil du service. Pour un usage réel, passer sur Cloudflare R2 (gratuit jusqu'à 10 Go) :
```
STORAGE_DRIVER=s3
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_BUCKET=maillon
S3_ACCESS_KEY_ID=<clé R2>
S3_SECRET_ACCESS_KEY=<secret R2>
S3_PUBLIC_URL_BASE=https://<ton-bucket-public>.r2.dev
```

### 3. Frontend — Vercel

Identique au chemin simple : Root Directory `apps/web`, variable `NEXT_PUBLIC_API_URL`, puis mettre à jour `WEB_URL` sur Render avec l'URL Vercel obtenue.

### 4. Cron externe (compense la mise en veille de Render)

Le endpoint `POST /api/internal/cron/run` (protégé par l'en-tête `x-cron-secret`) déclenche les vérifications quotidiennes (documents qui expirent, factures en retard). Configurer un pingeur gratuit :

1. https://cron-job.org → créer un compte → nouveau cron job.
2. URL : `https://<ton-url-render>.onrender.com/api/internal/cron/run`, méthode POST.
3. En-tête personnalisé : `x-cron-secret: <la valeur de CRON_SECRET>`.
4. Fréquence : une fois par jour (réveille aussi le service au passage).

---

## Vérification finale (les deux chemins)

- Ouvre l'URL Vercel, crée un compte agence de test, vérifie que login/dashboard/missions fonctionnent.
- Erreur CORS → vérifie que `WEB_URL` (Railway ou Render) correspond exactement à l'URL Vercel (`https://`, sans slash final).
- Chemin gratuit uniquement : une erreur 502/503 sur la première requête est normale après une période d'inactivité (le service se réveille, ~30s-1 min).
