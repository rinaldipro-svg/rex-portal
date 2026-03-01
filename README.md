# Portail REX - Hydro-Québec

Système de génération et gestion de fiches REX (Retour d'Expérience) avec IA générative.

## Architecture

```
rex-portal/
├── frontend/          # Next.js 14 (Vercel)
├── backend/           # Express API (Railway)
└── shared/            # Types partagés
```

## Stack Technique

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, Anthropic SDK
- **Database**: PostgreSQL (Railway)
- **Storage**: AWS S3 / Cloudflare R2
- **Auth**: NextAuth.js
- **Deploy**: Vercel + Railway

## Démarrage Rapide

### Prérequis
- Node.js 18+
- PostgreSQL 14+
- Compte Anthropic API
- Comptes Vercel et Railway

### Installation

```bash
# Cloner le repo
git clone <votre-repo-privé>
cd rex-portal

# Backend
cd backend
npm install
cp .env.example .env
# Configurer les variables d'environnement
npm run dev

# Frontend (nouveau terminal)
cd ../frontend
npm install
cp .env.local.example .env.local
# Configurer les variables d'environnement
npm run dev
```

### Variables d'environnement

**Backend (.env)**
```
DATABASE_URL=postgresql://user:password@localhost:5432/rex_portal
ANTHROPIC_API_KEY=sk-ant-xxx
JWT_SECRET=your-secret-key
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=rex-reports
PORT=3001
```

**Frontend (.env.local)**
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

## Déploiement

### Railway (Backend + Database)

1. Créer un nouveau projet Railway
2. Ajouter PostgreSQL
3. Déployer depuis GitHub:
   ```bash
   railway up
   ```

### Vercel (Frontend)

1. Importer le projet depuis GitHub
2. Configurer le root directory: `frontend`
3. Ajouter les variables d'environnement
4. Déployer

## Fonctionnalités

- ✅ Génération de fiches REX via Claude 3.5 Sonnet
- ✅ Éditeur WYSIWYG avec preview temps réel
- ✅ Export PDF professionnel
- ✅ Dashboard avec recherche et filtres
- ✅ Authentification et autorisation
- ✅ API REST complète
- ✅ Stockage cloud des PDFs
- ✅ Responsive design

## API Endpoints

```
POST   /api/auth/login
POST   /api/auth/register
GET    /api/fiches
GET    /api/fiches/:id
POST   /api/fiches
PUT    /api/fiches/:id
DELETE /api/fiches/:id
POST   /api/fiches/generate
GET    /api/fiches/:id/pdf
```

## Licence

Propriétaire - Hydro-Québec
