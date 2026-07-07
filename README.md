# Gestion de sous-traitants

SaaS B2B pour agences (marketing, création, dev, communication) qui gèrent un pool de freelances réguliers : brief → contrat → livrable → validation → paiement, avec un espace agence et un portail sous-traitant externe.

## Démarrage rapide

Prérequis : [Node.js 20+](https://nodejs.org/) et une base **PostgreSQL** locale (native, port 5432, utilisateur `postgres` / mot de passe `postgres`).

```bash
# 1. Copier la config d'environnement
cp .env.example .env

# 2. Installer les dépendances du monorepo
npm install

# 3. Générer le client Prisma et builder les packages partagés
npm run db:generate
npm run build -w packages/database
npm run build -w packages/shared-types

# 4. Créer la base puis appliquer le schéma
# (créer la base "gestion_sous_traitants" si elle n'existe pas encore)
npm run db:migrate

# 5. Peupler des données de démo (3 agences, 10 sous-traitants, 20 missions)
npm run db:seed

# 6. Lancer l'API et le frontend (deux terminaux)
npm run dev:api    # http://localhost:3001/api
npm run dev:web    # http://localhost:3000
```

### Comptes de démo (mot de passe : `password123`)

| Agence | Admin | Membre |
|---|---|---|
| Studio Pixel | admin@studiopixel.demo | membre@studiopixel.demo |
| Créa Nord | admin@creanord.demo | membre@creanord.demo |
| Agence Lumière | admin@agencelumiere.demo | membre@agencelumiere.demo |

Sous-traitants : `freelance1@sous-traitant.demo` à `freelance10@sous-traitant.demo`.

## Structure du monorepo

```
apps/
  api/    NestJS — auth JWT, agences, sous-traitants, missions, contrats, livrables, factures, notifications
  web/    Next.js — espace agence (dashboard/sous-traitants/missions/contrats/factures/paramètres) + portail sous-traitant
packages/
  database/      Schéma Prisma + client + seed
  shared-types/  Enums + DTOs Zod partagés front/back
infra/
  docker-compose.yml   Postgres (alternative à l'installation native)
```

## Modules implémentés (MVP)

1. **Auth** — inscription agence, invitation membres/sous-traitants par email, JWT access+refresh, guards par rôle (ADMIN/MEMBRE/SOUS_TRAITANT).
2. **Utilisateurs** — gestion des membres de l'agence (liste, désactivation).
3. **Sous-traitants** — annuaire par agence, profil (compétences/tarifs/disponibilité), documents administratifs avec date d'expiration.
4. **Missions** — CRUD, brief (texte + pièces jointes), vue Kanban (drag & drop) + liste filtrable, commentaires.
5. **Contrats** — génération PDF depuis un template, statut brouillon/envoyé/signé, upload du PDF signé.
6. **Livrables** — dépôt (fichier ou lien), versioning, validation/rejet avec commentaire.
7. **Factures** — dépôt par le sous-traitant, suivi reçue/à payer/payée/en retard, export CSV.
8. **Notifications** — en base + email (Resend), alertes automatiques (document qui expire, facture en retard) via cron quotidien.
9. **Dashboard agence** — vue d'ensemble des missions par statut, sous-traitants actifs, factures en attente/retard, prochaines échéances, alertes.
10. **Portail sous-traitant** — mes missions, dépôt de livrables/factures, mon profil (disponibilité, documents).

## Limitations connues (hors périmètre du MVP)

- Signature électronique intégrée, facturation client final, calendrier de disponibilité partagé, évaluation post-mission, rapport de rentabilité, marque blanche, intégrations (Slack/Zapier/QuickBooks) : voir la roadmap V2 du produit.
- Abonnement Stripe de l'agence à l'outil : non implémenté (placeholder dans `/parametres`).
- Emails transactionnels désactivés par défaut en local (log en console) tant que `RESEND_API_KEY` n'est pas renseigné dans `.env`.
