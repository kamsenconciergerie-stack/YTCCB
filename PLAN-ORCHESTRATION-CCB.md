# Plan d'orchestration — Plateforme CCB Matériaux
## Portail Next.js + Bot WhatsApp + n8n + Pipeline commercial — Déploiement Railway

> **Usage** : ce document est conçu pour être collé dans Claude Code (en local, dans le dossier du projet) et servir de feuille de route. Il référence des *rôles* d'agents (backend, frontend, n8n, devops, QA...). Si vos agents dans `~/.claude/agents/` ont des noms différents, adaptez les invocations `@nom-agent` à vos noms réels — la logique de séquençage reste valable.
>
> **Avant de lancer Claude Code**, vérifiez la présence de vos agents pertinents :
> ```bash
> ls ~/.claude/agents/ | grep -iE "backend|frontend|next|database|postgres|n8n|devops|deploy|railway|qa|test|security|payment"
> ```

---

## 0. Pré-requis à réunir AVANT de lancer Claude Code

Ces éléments bloquent plusieurs étapes si absents — à collecter en premier.

| Élément | Pourquoi c'est bloquant | Qui le fournit |
|---|---|---|
| Accès admin/export ccbmateriaux.com (CSV, ou identifiants CMS) | Source de vérité du catalogue | CCB / hébergeur actuel du site |
| Compte WhatsApp Business + accès Meta Cloud API (ou BSP type Twilio/360dialog) | Sans ça, pas de bot WhatsApp possible | Awa / CCB (vérification Meta Business requise, peut prendre plusieurs jours) |
| Comptes marchands Wave Business + Orange Money Marchand | Paiement en ligne | CCB (KYC entreprise requis) |
| Compte Railway + token API | Déploiement | Awa |
| Nom de domaine (ex. commande.ccbmateriaux.com ou autre) | Front public | CCB |
| Liste des commerciaux + leurs numéros WhatsApp | Alertes temps réel | CCB |

**Action immédiate recommandée** : lancer la vérification du compte WhatsApp Business Meta en parallèle de tout le reste — c'est l'étape la plus lente côté tiers.

---

## 1. Architecture cible (rappel)

```
Railway
├── service: web (Next.js — front client + admin)
├── service: api (peut être fusionné dans Next.js via API routes, ou séparé si besoin de scaling indépendant)
├── service: postgres (DB managée Railway)
├── service: n8n (automatisation — bot, alertes, sync catalogue, reporting)
└── service: redis (optionnel — cache + queue pour webhooks WhatsApp à fort volume)
```

Domaines fonctionnels à construire :
1. Base de données (schéma unique, source de vérité)
2. Backend API (commandes, produits, leads, paiements, auth)
3. Front client (catalogue, commande, paiement, suivi)
4. Front admin (dashboard temps réel, CRUD catalogue, pipeline, reporting)
5. n8n workflows (bot WhatsApp, alertes, sync, paiement, relances)
6. Intégrations paiement (Wave, Orange Money)
7. Déploiement Railway + CI/CD
8. Sécurité / QA / observabilité

---

## 2. Séquençage des phases (ordre d'exécution recommandé)

### Phase 1 — Fondations (séquentiel, ne pas paralléliser)

**Étape 1.1 — Schéma de base de données**
```
@database-admin (ou @backend-architect si pas d'agent DB dédié)
```
Prompt à donner à l'agent :
> Conçois le schéma PostgreSQL pour une plateforme e-commerce B2B/B2C de matériaux de construction (CCB Sénégal). Tables nécessaires : `products` (catégories : gros œuvre, étanchéité, carrelage, plomberie, électricité, sanitaires, électroménager, solaire ; champs prix, stock, image, statut actif), `customers` (identifié par numéro WhatsApp), `orders` (statuts : pré-confirmée, confirmée, en préparation, en livraison, livrée, annulée ; canal d'origine : whatsapp/web/manuel/téléphone), `order_items`, `leads` (pipeline commercial : nouveau, contacté, devis envoyé, gagné, perdu), `lead_assignments` (commercial assigné), `sales_reps` (commerciaux, zones, numéro WhatsApp), `payments` (provider : wave/orange_money/livraison, statut, référence transaction), `delivery_zones` (tarifs par zone), `loyalty_points`, `product_reviews`. Génère le schéma Prisma (ou Drizzle) + migrations. Utilise des UUID pour les clés primaires. Ajoute des index sur les colonnes de recherche fréquente (numéro WhatsApp, statut commande, catégorie produit).

**Étape 1.2 — Setup du repo et structure Next.js**
```
@frontend-developer ou @nextjs-developer (selon nommage)
```
> Initialise un projet Next.js 14+ (App Router, TypeScript) avec la structure suivante : `/app/(client)` pour le portail public, `/app/admin` pour le back-office (avec middleware d'auth), `/app/api` pour les routes API internes. Configure Tailwind avec une charte graphique vert foncé/dorée cohérente avec l'identité visuelle CCB existante (vous pouvez réutiliser les codes couleur #1B3B2F vert foncé et #9C7A3C or déjà utilisés dans d'autres projets de la marque Yaqin si CCB n'a pas de charte stricte imposée — sinon respecter les couleurs CCB vues sur ccbmateriaux.com). Connecte Prisma/Drizzle au schéma de l'étape 1.1.

---

### Phase 2 — Backend (peut paralléliser avec Phase 3 front une fois Phase 1 terminée)

**Étape 2.1 — API commandes & catalogue**
```
@backend-architect / @api-developer
```
> Construis les routes API REST (ou tRPC) suivantes dans Next.js API routes : `GET/POST /api/products`, `GET /api/products/:id`, `POST /api/orders` (création commande, calcul total + frais livraison par zone), `PATCH /api/orders/:id/status`, `GET /api/orders` (avec filtres statut/canal/date pour le dashboard admin), `POST /api/leads`, `PATCH /api/leads/:id/assign`. Toutes les routes consommées par n8n doivent être protégées par une clé API (header `X-API-Key`), pas par session utilisateur. Ajoute validation des payloads avec Zod.

**Étape 2.2 — Authentification admin**
```
@security-engineer ou @backend-architect
```
> Implémente l'authentification pour `/app/admin` avec NextAuth (ou Lucia/Auth.js) : rôles `admin` (accès total) et `commercial` (accès limité à ses propres leads/commandes assignées). Pas d'inscription publique — comptes créés manuellement en DB ou via un seed script.

**Étape 2.3 — Intégration paiement Wave + Orange Money**
```
@payment-integration-specialist (sinon @backend-architect)
```
> Intègre les API marchands Wave Business et Orange Money Sénégal. Crée `POST /api/payments/initiate` (génère un lien de paiement Wave ou un push USSD Orange Money selon le choix client) et un webhook `POST /api/payments/webhook/wave` + `POST /api/payments/webhook/orange-money` qui met à jour le statut de la commande et déclenche la notification n8n correspondante. Gère les cas d'échec/timeout de paiement avec retry. **Note** : ces intégrations nécessitent les credentials marchands réels de CCB — prévoir un mode sandbox/mock en attendant.

---

### Phase 3 — Front client (en parallèle de Phase 2 backend, après Phase 1)

**Étape 3.1 — Pages publiques**
```
@frontend-developer / @ui-developer
```
> Construis les pages : page d'accueil (présentation CCB, catégories, CTA WhatsApp), catalogue avec filtres par catégorie + recherche, fiche produit (avec bouton "Commander sur WhatsApp" générant un lien `wa.me/[numero]?text=[message pré-rempli avec nom produit]"), panier + checkout avec choix paiement (Wave/Orange Money/à la livraison), page de suivi de commande par numéro de commande.

**Étape 3.2 — Design system**
```
@frontend-design (skill déjà disponible — consulter /mnt/skills/public/frontend-design/SKILL.md en local si répliqué, sinon appliquer les mêmes principes : typographie intentionnelle, pas de défaut générique Tailwind)
```
> Applique un système de design cohérent : éviter le look "template Tailwind par défaut", choisir une typographie distinctive, des composants de carte produit soignés avec hiérarchie visuelle claire (prix, disponibilité, catégorie).

---

### Phase 4 — Front admin (après Phase 2, peut chevaucher fin de Phase 3)

**Étape 4.1 — Dashboard temps réel**
```
@frontend-developer + @realtime-systems-engineer (si dispo, sinon @backend-architect pour la partie websocket/polling)
```
> Construis `/app/admin/dashboard` : vue commandes en temps réel groupées par statut (Kanban ou liste avec filtres), utilisant soit Server-Sent Events soit polling court (5-10s) soit Pusher/Ably si un agent realtime est disponible. KPI cards : commandes du jour, CA du jour, panier moyen, taux conversion WhatsApp.

**Étape 4.2 — Gestion catalogue (CRUD)**
```
@frontend-developer
```
> Interface CRUD produits : ajout/édition/désactivation, gestion stock avec alerte seuil bas, upload images (vers Railway volume ou S3-compatible storage).

**Étape 4.3 — Pipeline commercial / prospection**
```
@frontend-developer
```
> Vue pipeline type Kanban (Nouveau → Contacté → Devis envoyé → Gagné/Perdu) par commercial, avec drag & drop pour changer le statut d'un lead. Vue individuelle par commercial (mes leads, mon taux de transformation).

**Étape 4.4 — Reporting**
```
@data-analyst ou @frontend-developer
```
> Page reporting : CA par période, top produits vendus, performance par commercial, taux de conversion par canal (WhatsApp/web/manuel/téléphone), export CSV/Excel compatible SYSCOHADA pour la comptabilité.

**Étape 4.5 — Saisie manuelle de commande**
```
@frontend-developer
```
> Formulaire admin "Créer une commande" pour les ventes téléphone/boutique physique, alimentant les mêmes tables que les commandes WhatsApp/web — garantit un reporting unifié tous canaux.

---

### Phase 5 — n8n (peut démarrer en parallèle dès que les routes API de la Phase 2.1 ont une spec, même avant qu'elles soient finies — utiliser des mocks)

**Étape 5.1 — Setup n8n sur Railway**
```
@devops-engineer / @n8n-specialist
```
> Déploie n8n sur Railway (image Docker officielle `n8nio/n8n`), configure la persistance (volume Railway pour la DB SQLite n8n, ou connecte à PostgreSQL partagé), configure les variables d'environnement (webhook URL publique, credentials).

**Étape 5.2 — Workflow bot commande WhatsApp**
```
@n8n-specialist / @automation-engineer
```
> Construis le workflow : trigger webhook WhatsApp Cloud API → parsing du message → machine à états conversationnelle (catégorie → produit → quantité → adresse → récap → choix paiement) → appel `POST /api/orders` → réponse WhatsApp de confirmation. Gérer les cas de reprise de conversation interrompue (stocker l'état en cours dans une table `conversation_states` ou via n8n's built-in memory).

**Étape 5.3 — Workflow sync catalogue**
```
@n8n-specialist / @data-engineer
```
> **Priorité** : tenter d'abord un import régulier (CSV/export) plutôt qu'un scraping, vu que ccbmateriaux.com bloque le crawl automatisé via robots.txt (à clarifier avec CCB qui gère déjà ce site). Si scraping retenu en solution de repli, prévoir : user-agent identifié, rate limiting respectueux, gestion d'erreur si la structure HTML change, upsert idempotent dans `products`.

**Étape 5.4 — Workflow alertes commerciales**
```
@n8n-specialist
```
> Trigger sur nouvelle commande (webhook depuis l'API ou polling DB) → résolution du/des commercial(aux) concerné(s) (par zone géographique de livraison) → envoi WhatsApp via Cloud API avec résumé commande + lien direct vers la fiche admin.

**Étape 5.5 — Workflow paiement confirmé**
```
@n8n-specialist
```
> Trigger sur webhook paiement (relayé depuis l'API Next.js ou directement si n8n reçoit le webhook Wave/OM) → mise à jour statut → notification client + commercial.

**Étape 5.6 — Workflow relances et reporting automatique**
```
@n8n-specialist
```
> Cron quotidien : leads sans suite depuis X jours → rappel commercial. Cron 18h : rapport du jour (CA, nb commandes, conversion) envoyé par WhatsApp/email à la direction.

---

### Phase 6 — Déploiement & CI/CD

**Étape 6.1 — Configuration Railway**
```
@deployment-engineer / @devops-engineer
```
> Configure le projet Railway avec les services : `web` (Next.js, build via Nixpacks ou Dockerfile), `postgres` (plugin Railway), `n8n` (Docker image), `redis` (si retenu). Variables d'environnement séparées par environnement (staging/production). Configure les domaines custom.

**Étape 6.2 — CI/CD GitHub Actions**
```
@devops-engineer
```
> Pipeline GitHub Actions : lint + type-check + tests sur PR, déploiement automatique sur Railway au merge sur `main` (cohérent avec le pattern déjà utilisé pour StudioKay Africa). Déploiement séparé pour les workflows n8n (export/import JSON versionné).

---

### Phase 7 — Sécurité, QA, observabilité (transverse, à activer dès la Phase 2)

**Étape 7.1 — Tests**
```
@qa-engineer / @test-automation-engineer
```
> Tests d'intégration sur les routes API critiques (création commande, paiement, changement statut). Tests E2E sur le parcours client (catalogue → commande → paiement) avec Playwright.

**Étape 7.2 — Sécurité**
```
@security-engineer
```
> Audit : protection des routes admin, rate limiting sur les webhooks publics (n8n, paiement), validation stricte des webhooks entrants (vérification de signature Meta/Wave/Orange Money), gestion des secrets (jamais en dur, variables Railway uniquement), RGPD-like pour les données clients (numéros WhatsApp, adresses).

**Étape 7.3 — Observabilité**
```
@devops-engineer / @monitoring-specialist
```
> Logs structurés, alerting si un workflow n8n échoue de façon répétée, monitoring uptime du bot WhatsApp (un webhook qui ne répond plus = perte de ventes immédiate).

---

## 3. Tableau récapitulatif (vue d'ensemble pour suivi d'avancement)

| Phase | Agent(s) | Dépend de | Peut paralléliser avec |
|---|---|---|---|
| 1.1 Schéma DB | database-admin | — | — |
| 1.2 Setup Next.js | frontend-developer | — | 1.1 |
| 2.1 API core | backend-architect | 1.1 | 3.x |
| 2.2 Auth admin | security-engineer | 2.1 | 3.x, 4.x |
| 2.3 Paiement | payment-integration-specialist | 2.1 | 3.x |
| 3.1-3.2 Front client | frontend-developer | 1.2 | 2.x |
| 4.1-4.5 Front admin | frontend-developer | 2.1, 2.2 | 5.x |
| 5.1-5.6 n8n | n8n-specialist | 2.1 (spec API suffit) | 3.x, 4.x |
| 6.1-6.2 Déploiement | devops-engineer | Tout le reste fonctionnel en local | — |
| 7.x QA/Sécu/Obs | qa-engineer, security-engineer | Transverse, dès Phase 2 | Tout |

---

## 4. Points de vigilance à rappeler à chaque agent

- **Source de vérité catalogue** : la base Railway, jamais une dépendance directe au site ccbmateriaux.com en production (sync, pas de lecture live).
- **Idempotence des webhooks** : WhatsApp, Wave et Orange Money peuvent renvoyer le même événement plusieurs fois — toujours vérifier avant de dupliquer une commande/paiement.
- **Tous les canaux de commande (WhatsApp, web, manuel, téléphone) doivent écrire dans les mêmes tables** pour que le reporting soit unifié.
- **Le numéro WhatsApp est l'identifiant client** — attention à la normalisation du format (+221 7X XXX XX XX) pour éviter les doublons clients.

---

## 5. Première commande à lancer dans Claude Code

```
Lis PLAN-ORCHESTRATION-CCB.md. Commence par l'étape 1.1 (schéma de base de données) 
en invoquant l'agent le plus adapté disponible dans ~/.claude/agents/. 
Une fois le schéma validé, propose-moi de lancer 1.2 et 2.1 en parallèle.
```
