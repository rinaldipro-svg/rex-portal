# 🚀 Guide de Déploiement - Portail REX

## Prérequis

- [ ] Compte GitHub (repository privé créé)
- [ ] Compte Railway (https://railway.app)
- [ ] Compte Vercel (https://vercel.com)
- [ ] Clé API Anthropic (https://console.anthropic.com)
- [ ] Compte AWS ou Cloudflare R2 (stockage)

---

## 📦 1. Configuration du Repository GitHub

### 1.1 Créer le repository privé

```bash
# Sur GitHub, créer un nouveau repository privé: rex-portal-hq

# Localement, initialiser le projet
cd rex-portal
git init
git add .
git commit -m "Initial commit: Portail REX avec API Anthropic"
git branch -M main
git remote add origin git@github.com:VOTRE_USERNAME/rex-portal-hq.git
git push -u origin main
```

---

## 🗄️ 2. Déploiement Backend + Database sur Railway

### 2.1 Créer le projet Railway

1. Aller sur https://railway.app
2. Cliquer sur "New Project"
3. Choisir "Deploy from GitHub repo"
4. Sélectionner votre repository `rex-portal-hq`
5. Railway détectera automatiquement le backend

### 2.2 Ajouter PostgreSQL

1. Dans votre projet Railway, cliquer sur "+ New"
2. Sélectionner "Database" > "PostgreSQL"
3. Railway créera automatiquement la base de données
4. Une variable `DATABASE_URL` sera générée automatiquement

### 2.3 Configurer les variables d'environnement

Dans Railway > Votre service backend > Variables:

```bash
# Copiées automatiquement depuis PostgreSQL
DATABASE_URL=${{Postgres.DATABASE_URL}}

# À configurer manuellement
ANTHROPIC_API_KEY=sk-ant-api03-VOTRE_CLE_ICI
JWT_SECRET=generez-une-cle-securisee-32-caracteres-minimum
AWS_ACCESS_KEY_ID=votre-access-key-aws
AWS_SECRET_ACCESS_KEY=votre-secret-key-aws
AWS_S3_BUCKET=rex-reports
AWS_REGION=us-east-1
NODE_ENV=production

# URL du frontend (à mettre à jour après déploiement Vercel)
FRONTEND_URL=https://votre-app.vercel.app
```

### 2.4 Configuration du build

Railway détectera automatiquement le `package.json`, mais vérifiez:

**Root Directory:** `backend`
**Build Command:** `npm install`
**Start Command:** `npm start`

### 2.5 Exécuter les migrations

Une fois déployé, dans Railway CLI ou via le dashboard:

```bash
# Option 1: Via Railway CLI
railway run npm run migrate

# Option 2: Via l'onglet "Deploy Logs", ajouter une commande de déploiement
# Dans Settings > Deploy > Custom Start Command (temporaire):
npm run migrate && npm start
```

### 2.6 Récupérer l'URL du backend

Railway génère automatiquement une URL publique:
- Format: `https://votre-service.railway.app`
- Notez cette URL pour la configuration frontend

---

## 🌐 3. Déploiement Frontend sur Vercel

### 3.1 Importer le projet

1. Aller sur https://vercel.com
2. Cliquer sur "Add New" > "Project"
3. Importer votre repository GitHub `rex-portal-hq`
4. Vercel détectera Next.js automatiquement

### 3.2 Configuration du projet

**Framework Preset:** Next.js
**Root Directory:** `frontend`
**Build Command:** `npm run build`
**Output Directory:** `.next`
**Install Command:** `npm install`

### 3.3 Configurer les variables d'environnement

Dans Vercel > Project Settings > Environment Variables:

```bash
NEXT_PUBLIC_API_URL=https://votre-backend.railway.app

NEXTAUTH_URL=https://votre-app.vercel.app
NEXTAUTH_SECRET=meme-secret-que-jwt-ou-different-32-caracteres

# Production
NODE_ENV=production
```

### 3.4 Déployer

1. Cliquer sur "Deploy"
2. Vercel va build et déployer automatiquement
3. Récupérer l'URL: `https://votre-app.vercel.app`

### 3.5 Mettre à jour le backend

Retourner sur Railway et mettre à jour la variable:

```bash
FRONTEND_URL=https://votre-app.vercel.app
```

---

## 🔐 4. Configuration AWS S3 / Cloudflare R2

### Option A: AWS S3

1. Créer un bucket S3: `rex-reports`
2. Configurer les permissions (privé)
3. Créer un utilisateur IAM avec accès S3
4. Générer les clés d'accès
5. Variables déjà configurées sur Railway

### Option B: Cloudflare R2 (recommandé, moins cher)

1. Aller sur Cloudflare Dashboard > R2
2. Créer un bucket: `rex-reports`
3. Générer des tokens API
4. Sur Railway, ajouter:

```bash
AWS_ENDPOINT=https://VOTRE_ACCOUNT_ID.r2.cloudflarestorage.com
AWS_ACCESS_KEY_ID=votre-r2-access-key
AWS_SECRET_ACCESS_KEY=votre-r2-secret-key
AWS_S3_BUCKET=rex-reports
AWS_REGION=auto
```

---

## ✅ 5. Vérification du déploiement

### 5.1 Tester le backend

```bash
# Health check
curl https://votre-backend.railway.app/health

# Devrait retourner:
# {"status":"ok","timestamp":"..."}
```

### 5.2 Tester le frontend

1. Ouvrir `https://votre-app.vercel.app`
2. Créer un compte
3. Générer une fiche REX de test
4. Vérifier que le PDF est généré

### 5.3 Checklist de vérification

- [ ] Backend accessible et health check OK
- [ ] Base de données PostgreSQL fonctionnelle
- [ ] Frontend accessible
- [ ] Inscription/connexion fonctionne
- [ ] Génération de fiches avec Anthropic fonctionne
- [ ] Export PDF fonctionne
- [ ] Stockage S3/R2 fonctionne

---

## 🔄 6. CI/CD Automatique

### GitHub Actions (optionnel)

Les deux plateformes se déploient automatiquement:

- **Vercel**: À chaque push sur `main`
- **Railway**: À chaque push sur `main`

### Branches de développement

```bash
# Créer une branche de dev
git checkout -b dev

# Sur Vercel et Railway, configurer:
# - Production: branche main
# - Preview: branche dev
```

---

## 🛠️ 7. Commandes de développement local

### Backend

```bash
cd backend

# Installer les dépendances
npm install

# Configurer .env
cp .env.example .env
# Éditer .env avec vos valeurs

# Créer la base de données locale (PostgreSQL requis)
createdb rex_portal

# Exécuter les migrations
npm run migrate

# Démarrer en mode dev
npm run dev
```

### Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Configurer .env.local
cp .env.local.example .env.local
# Éditer .env.local

# Démarrer en mode dev
npm run dev

# Ouvrir http://localhost:3000
```

---

## 📊 8. Monitoring et Logs

### Railway

- **Logs**: Railway > Votre service > Logs
- **Métriques**: CPU, RAM, Network dans le dashboard
- **Alerts**: Configurable dans Settings

### Vercel

- **Logs**: Vercel > Deployments > Logs
- **Analytics**: Vercel Analytics (gratuit)
- **Performance**: Core Web Vitals

---

## 🔒 9. Sécurité

### Checklist de sécurité

- [ ] Variables d'environnement ne sont JAMAIS commitées
- [ ] Clés API stockées uniquement dans les services cloud
- [ ] HTTPS activé (automatique sur Vercel/Railway)
- [ ] CORS configuré correctement
- [ ] Rate limiting activé (déjà dans le code)
- [ ] JWT avec expiration
- [ ] Passwords hashés avec bcrypt (12 rounds)

---

## 📝 10. Maintenance

### Mise à jour des dépendances

```bash
# Backend
cd backend
npm update
npm audit fix

# Frontend
cd frontend
npm update
npm audit fix

# Commit et push
git add .
git commit -m "chore: update dependencies"
git push
```

### Backup de la base de données

```bash
# Sur Railway, utiliser:
railway run pg_dump $DATABASE_URL > backup.sql

# Ou configurer des backups automatiques dans Railway
```

---

## 🆘 Troubleshooting

### Backend ne démarre pas

```bash
# Vérifier les logs Railway
railway logs

# Problèmes communs:
# - DATABASE_URL mal configuré
# - ANTHROPIC_API_KEY invalide
# - Port déjà utilisé
```

### Frontend erreur API

```bash
# Vérifier que NEXT_PUBLIC_API_URL est correct
# Format: https://... (pas de / à la fin)

# Vérifier CORS sur le backend
# FRONTEND_URL doit correspondre exactement
```

### Génération de PDF échoue

```bash
# Puppeteer nécessite des dépendances système
# Railway les installe automatiquement via Nixpacks

# Vérifier les logs pour les erreurs Puppeteer
# Augmenter la RAM si nécessaire (Railway settings)
```

---

## 📞 Support

- **Documentation Anthropic**: https://docs.anthropic.com
- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs

---

## 🎉 Félicitations !

Votre Portail REX est maintenant déployé en production !

URL Backend: `https://votre-backend.railway.app`
URL Frontend: `https://votre-app.vercel.app`
