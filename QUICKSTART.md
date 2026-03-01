# 🚀 Démarrage Rapide - Portail REX

## Installation en 5 minutes

### 1. Cloner et initialiser

```bash
# Cloner le repository
git clone git@github.com:VOTRE_USERNAME/rex-portal-hq.git
cd rex-portal-hq

# Exécuter le script d'initialisation
chmod +x init.sh
./init.sh
```

### 2. Configuration des variables d'environnement

#### Backend (.env)
```bash
cd backend
cp .env.example .env
nano .env  # ou vim, code, etc.
```

**Configuration minimale pour démarrer:**
```bash
# Base de données locale
DATABASE_URL=postgresql://postgres:password@localhost:5432/rex_portal

# Clé API Anthropic (OBLIGATOIRE)
ANTHROPIC_API_KEY=sk-ant-api03-VOTRE_CLE_ICI

# Secret JWT (générer aléatoirement)
JWT_SECRET=un-secret-tres-long-et-aleatoire-32-caracteres-minimum

# AWS/S3 (optionnel en dev, peut simuler)
AWS_ACCESS_KEY_ID=fake-key-for-dev
AWS_SECRET_ACCESS_KEY=fake-secret-for-dev
AWS_S3_BUCKET=rex-reports-dev
AWS_REGION=us-east-1

# Port et environnement
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env.local)
```bash
cd ../frontend
cp .env.local.example .env.local
nano .env.local
```

**Configuration:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=le-meme-secret-que-jwt-ou-different
```

### 3. Base de données

```bash
# Créer la base de données PostgreSQL
createdb rex_portal

# Ou avec psql:
psql -U postgres
CREATE DATABASE rex_portal;
\q

# Exécuter les migrations
cd backend
npm run migrate
```

### 4. Démarrer les serveurs

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev

# Devrait afficher:
# 🚀 Serveur démarré sur le port 3001
# ✅ Connexion PostgreSQL établie
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev

# Devrait afficher:
# ▲ Next.js 15.1.4
# - Local: http://localhost:3000
```

### 5. Accéder à l'application

Ouvrir votre navigateur: **http://localhost:3000**

1. Créer un compte (Inscription)
2. Tester la génération d'une fiche REX
3. Explorer le dashboard

---

## 🧪 Tests Rapides

### Tester le backend seul

```bash
# Health check
curl http://localhost:3001/health

# Devrait retourner:
# {"status":"ok","timestamp":"..."}

# Test de l'API Anthropic (nécessite authentification)
# 1. Créer un compte via le frontend
# 2. Récupérer le token dans le localStorage
# 3. Tester:

TOKEN="votre-token-jwt"
curl -X GET http://localhost:3001/api/generate/test \
  -H "Authorization: Bearer $TOKEN"
```

### Tester la génération de contenu

```bash
# Via curl (après authentification)
curl -X POST http://localhost:3001/api/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Installation de nouveaux transformateurs à la centrale de Manic-5. Amélioration de la capacité de 15%. Défi: température extrême (-40°C)."
  }'
```

---

## 🔧 Dépannage Rapide

### Erreur: "Cannot connect to database"

```bash
# Vérifier que PostgreSQL est démarré
sudo systemctl status postgresql  # Linux
brew services list                # macOS

# Vérifier la connexion
psql -U postgres -d rex_portal
```

### Erreur: "ANTHROPIC_API_KEY is required"

```bash
# Vérifier que la clé est bien dans .env
cd backend
grep ANTHROPIC_API_KEY .env

# La clé doit commencer par: sk-ant-api03-
```

### Erreur: "Port 3001 already in use"

```bash
# Trouver et tuer le processus
lsof -ti:3001 | xargs kill -9

# Ou changer le port dans backend/.env
PORT=3002
```

### Erreur: "Module not found"

```bash
# Réinstaller les dépendances
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 📦 Générer une clé API Anthropic

1. Aller sur https://console.anthropic.com
2. Créer un compte (si nécessaire)
3. Dans "API Keys", cliquer "Create Key"
4. Copier la clé (format: `sk-ant-api03-...`)
5. La coller dans `backend/.env`

**Note**: La clé API a des limites de taux gratuites. Pour un usage en production, vérifier les tarifs.

---

## 🔑 Générer un secret JWT sécurisé

```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copier le résultat dans `JWT_SECRET` et `NEXTAUTH_SECRET`.

---

## 🎯 Prochaines Étapes

Une fois l'application qui tourne localement:

1. **Développement**:
   - Créer la page dashboard complète
   - Implémenter l'éditeur de fiches
   - Ajouter des tests

2. **Déploiement**:
   - Suivre le guide dans `DEPLOYMENT.md`
   - Configurer Railway (backend + DB)
   - Configurer Vercel (frontend)

3. **Production**:
   - Obtenir un domaine personnalisé
   - Configurer SSL (automatique sur Vercel/Railway)
   - Mettre en place les backups

---

## 📚 Documentation Complète

- **ARCHITECTURE.md**: Architecture technique détaillée
- **DEPLOYMENT.md**: Guide de déploiement complet
- **README.md**: Documentation générale

---

## 🆘 Besoin d'Aide?

### Commandes utiles

```bash
# Voir les logs du backend
cd backend
npm run dev 2>&1 | tee backend.log

# Voir les logs du frontend
cd frontend
npm run dev 2>&1 | tee frontend.log

# Vérifier les versions
node -v    # devrait être >= 18
npm -v
psql --version
```

### Resources

- [Documentation Anthropic](https://docs.anthropic.com)
- [Next.js Troubleshooting](https://nextjs.org/docs/messages)
- [PostgreSQL Guide](https://www.postgresql.org/docs/current/tutorial.html)

---

**Bon développement ! 🚀**
