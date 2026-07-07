# Déploiement (gratuit) — Vercel + Render + Neon

Architecture : Next.js sur Vercel (frontend), NestJS sur Render (API), Postgres sur Neon (persistant, contrairement au Postgres gratuit de Render qui expire à 90 jours).

Le code est prêt (commit initial fait sur la branche `main`, en local). Il reste des étapes qui nécessitent tes propres comptes — je ne peux pas les créer à ta place.

## 1. Créer le dépôt GitHub

1. Va sur https://github.com/new, crée un dépôt vide (ex. `gestion-sous-traitants`), **sans** README/gitignore (déjà présents).
2. En local :
   ```bash
   cd "C:\Users\anony\OneDrive\Bureau\gestion-sous-traitants"
   git remote add origin https://github.com/<ton-pseudo>/gestion-sous-traitants.git
   git push -u origin main
   ```

## 2. Base de données — Neon (gratuit, persistant)

1. https://neon.tech → créer un compte → nouveau projet.
2. Copier la "Connection string" (format `postgresql://...`).
3. Depuis ta machine, appliquer le schéma sur cette base distante :
   ```bash
   cd "C:\Users\anony\OneDrive\Bureau\gestion-sous-traitants"
   DATABASE_URL="<connection string Neon>" npm run db:migrate -w packages/database -- deploy
   DATABASE_URL="<connection string Neon>" npm run db:seed -w packages/database
   ```
   (ou saute le seed si tu veux partir d'une base vide en production)

## 3. API — Render (gratuit, avec limite : le service se met en veille après 15 min d'inactivité)

1. https://render.com → New → Web Service → connecter le dépôt GitHub.
2. Réglages :
   - **Root Directory** : `apps/api`
   - **Build Command** : `cd ../.. && npm install && npm run build -w packages/database && npm run build -w packages/shared-types && npm run build -w apps/api`
   - **Start Command** : `node dist/main.js`
   - **Plan** : Free
3. Variables d'environnement (Render → Environment) :
   ```
   DATABASE_URL=<connection string Neon>
   JWT_ACCESS_SECRET=<génère une valeur aléatoire longue>
   JWT_REFRESH_SECRET=<génère une autre valeur aléatoire longue>
   JWT_ACCESS_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=30d
   CRON_SECRET=<génère une valeur aléatoire>
   WEB_URL=https://<ton-projet>.vercel.app   (à mettre à jour après l'étape 4)
   STORAGE_DRIVER=local
   RESEND_API_KEY=   (laisser vide pour désactiver les emails, ou ta clé Resend)
   EMAIL_FROM=notifications@example.com
   ```
   (le port est géré automatiquement — Render fournit sa propre variable `PORT`, que l'API lit en priorité)
4. Une fois déployé, note l'URL Render (ex. `https://gestion-sous-traitants-api.onrender.com`).

**Limitation actuelle à connaître** : avec `STORAGE_DRIVER=local`, les fichiers uploadés (contrats PDF, livrables, factures, documents) sont stockés sur le disque du service Render — qui est **réinitialisé à chaque redéploiement et parfois au réveil du service gratuit**. Pour un usage réel il faut passer sur du stockage S3-compatible (Cloudflare R2, gratuit jusqu'à 10 Go) :
```
STORAGE_DRIVER=s3
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_BUCKET=gestion-sous-traitants
S3_ACCESS_KEY_ID=<clé R2>
S3_SECRET_ACCESS_KEY=<secret R2>
S3_PUBLIC_URL_BASE=https://<ton-bucket-public>.r2.dev
```
(Cloudflare dashboard → R2 → créer un bucket → "Manage R2 API tokens" pour les clés, et activer l'accès public du bucket pour obtenir l'URL `S3_PUBLIC_URL_BASE`.) Cette partie peut attendre si tu veux d'abord voir le produit en ligne rapidement.

## 4. Frontend — Vercel

1. https://vercel.com → New Project → importer le même dépôt GitHub.
2. Réglages :
   - **Root Directory** : `apps/web`
   - Activer "Include files outside of the root directory" si proposé (nécessaire pour les packages du monorepo)
   - Framework : Next.js (détecté automatiquement)
3. Variable d'environnement :
   ```
   NEXT_PUBLIC_API_URL=https://<ton-url-render>.onrender.com
   ```
4. Déployer. Une fois l'URL Vercel connue, retourne dans Render et mets à jour `WEB_URL` avec cette URL (nécessaire pour que le CORS de l'API accepte les requêtes du frontend).

## 5. Cron externe (pour compenser la mise en veille de Render)

Le endpoint `POST /api/internal/cron/run` (protégé par l'en-tête `x-cron-secret`) déclenche les vérifications quotidiennes (documents qui expirent, factures en retard). Comme Render free ne garde pas de process actif en permanence, configure un pingeur externe gratuit :

1. https://cron-job.org (gratuit) → créer un compte → nouveau cron job.
2. URL : `https://<ton-url-render>.onrender.com/api/internal/cron/run`
3. Méthode : POST
4. En-tête personnalisé : `x-cron-secret: <la valeur de CRON_SECRET>`
5. Fréquence : une fois par jour (ça a aussi l'avantage de réveiller le service).

## 6. Vérification finale

- Ouvre l'URL Vercel, crée un compte agence de test, vérifie que login/dashboard/missions fonctionnent.
- Si erreur CORS : vérifie que `WEB_URL` sur Render correspond exactement à l'URL Vercel (avec `https://`, sans slash final).
- Si erreur 502/503 sur la première requête : normal sur Render free après une période d'inactivité (le service se réveille, ~30s-1min).
