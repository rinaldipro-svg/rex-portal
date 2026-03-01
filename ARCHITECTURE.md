# Architecture Complète - Portail REX Hydro-Québec

## 📁 Structure du Projet

```
rex-portal/
├── README.md                    # Documentation principale
├── DEPLOYMENT.md                # Guide de déploiement
├── .gitignore                   # Fichiers à ignorer
├── init.sh                      # Script d'initialisation
│
├── backend/                     # API Node.js + Express
│   ├── package.json
│   ├── railway.json             # Config Railway
│   ├── .env.example
│   └── src/
│       ├── server.js            # Point d'entrée
│       ├── db/
│       │   ├── config.js        # Configuration PostgreSQL
│       │   └── migrate.js       # Migrations de base de données
│       ├── middleware/
│       │   └── auth.js          # Middleware JWT
│       ├── routes/
│       │   ├── auth.js          # Routes d'authentification
│       │   ├── fiches.js        # CRUD des fiches REX
│       │   └── generate.js      # Génération via Anthropic
│       └── services/
│           ├── anthropic.js     # Service API Anthropic
│           ├── pdf.js           # Génération PDF (Puppeteer)
│           └── storage.js       # Upload S3/R2
│
├── frontend/                    # Application Next.js 14
│   ├── package.json
│   ├── next.config.js
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env.local.example
│   └── src/
│       ├── app/
│       │   ├── layout.tsx       # Layout principal
│       │   ├── globals.css      # Styles globaux
│       │   ├── page.tsx         # Page d'accueil (redirect)
│       │   ├── login/
│       │   │   └── page.tsx     # Page de connexion
│       │   └── dashboard/       # À créer
│       │       └── page.tsx
│       └── lib/
│           ├── api.ts           # Client API Axios
│           ├── store.ts         # State management (Zustand)
│           └── utils.ts         # Utilitaires
│
└── shared/                      # Types partagés (optionnel)
    └── types.ts
```

## 🏗️ Architecture Technique

### Stack

**Backend**
- Runtime: Node.js 18+
- Framework: Express.js
- Database: PostgreSQL 14+
- ORM: pg (natif)
- AI: Anthropic SDK (Claude Sonnet 4)
- PDF: Puppeteer
- Storage: AWS S3 / Cloudflare R2
- Auth: JWT (jsonwebtoken)

**Frontend**
- Framework: Next.js 14 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- State: Zustand
- HTTP: Axios
- UI: Radix UI + shadcn/ui

**Infrastructure**
- Backend + DB: Railway
- Frontend: Vercel
- Storage: AWS S3 ou Cloudflare R2
- Repository: GitHub (privé)

### Flux de Données

```
[Utilisateur]
    ↓
[Next.js Frontend - Vercel]
    ↓ (API REST)
[Express Backend - Railway]
    ↓
[PostgreSQL - Railway]

[Backend] ↔ [Anthropic API] (génération de contenu)
[Backend] ↔ [S3/R2] (stockage PDFs)
```

## 🔐 Sécurité

### Authentification
- JWT avec expiration (7 jours)
- Passwords hashés (bcrypt, 12 rounds)
- Refresh token non implémenté (à ajouter si besoin)

### API
- CORS configuré
- Rate limiting (100 req/15min par IP)
- Helmet.js pour headers de sécurité
- Validation des données (Zod)

### Database
- Prepared statements (protection SQL injection)
- Row-level security (via user_id)
- SSL en production
- Backups automatiques (Railway)

## 📊 Base de Données

### Tables Principales

**users**
- id (UUID, PK)
- email (unique)
- password_hash
- first_name, last_name
- role ('user' | 'admin')
- created_at, updated_at

**fiches**
- id (UUID, PK)
- user_id (FK → users)
- titre, infrastructure, localisation
- unspsc_code, unspsc_desc
- contrainte, environnement, ligne_rouge
- technologie, ingenierie, securite
- metrique1_val/titre/desc (x3)
- citation, auteur
- pdf_url, pdf_key
- status ('draft' | 'published' | 'archived')
- search_vector (full-text search)
- created_at, updated_at, published_at

**sessions** (optionnel)
- id, user_id, token, expires_at

### Index
- user_id, status, created_at
- GIN index sur search_vector (recherche full-text)

## 🤖 Intégration Anthropic

### Modèle
- **claude-sonnet-4-20250514**
- Temperature: 0.7
- Max tokens: 2000

### Prompt System
- Expertise: Ingénieur senior Hydro-Québec
- Ton: Souverain, axé pérennité
- Format: JSON structuré strict
- Validation: Zod schemas

### Fonctionnalités
1. **Génération complète**: Notes brutes → Fiche REX complète
2. **Amélioration de champs**: Raffinage d'un champ spécifique
3. **Test de connexion**: Endpoint de vérification

## 📄 Génération PDF

### Template
- Format A4
- Design corporate Hydro-Québec
- Sections: En-tête, Métadonnées, Contenu, Métriques, Citation
- Print-ready avec styles @page

### Process
1. Génération HTML depuis template
2. Puppeteer: HTML → PDF
3. Upload sur S3/R2
4. URL signée pour téléchargement

## 🚀 API Endpoints

### Auth
```
POST   /api/auth/register    # Inscription
POST   /api/auth/login       # Connexion
GET    /api/auth/me          # Profil utilisateur
```

### Fiches
```
GET    /api/fiches           # Liste (filtres, pagination)
GET    /api/fiches/:id       # Détail
POST   /api/fiches           # Créer
PUT    /api/fiches/:id       # Modifier
DELETE /api/fiches/:id       # Supprimer
POST   /api/fiches/:id/publish  # Publier + générer PDF
```

### Génération
```
POST   /api/generate         # Générer une fiche
POST   /api/generate/improve # Améliorer un champ
GET    /api/generate/test    # Test API Anthropic
```

## 🎨 Features Frontend

### Pages
- `/` - Redirect vers dashboard ou login
- `/login` - Authentification (login/register)
- `/dashboard` - Liste des fiches
- `/editor` - Création/édition de fiches
- `/editor/:id` - Édition d'une fiche existante

### Composants (à créer)
- `<Navbar />` - Navigation principale
- `<FicheCard />` - Carte de fiche dans la liste
- `<FicheEditor />` - Éditeur WYSIWYG
- `<GenerateModal />` - Modal de génération IA
- `<PDFPreview />` - Preview du PDF

### State Management
- **Auth Store**: user, token, login/logout
- **Editor Store**: currentFiche, isModified

## 📈 Performance

### Backend
- Connection pooling PostgreSQL (max 20)
- Rate limiting
- Gzip compression
- Cache headers

### Frontend
- Next.js optimizations (SSR, ISR)
- Image optimization
- Code splitting automatique
- Static generation où possible

## 🔄 CI/CD

### Déploiement Automatique
- **Push sur `main`**:
  - Frontend: Vercel rebuild automatique
  - Backend: Railway redeploy automatique

### Environnements
- **Production**: branche `main`
- **Preview**: branches feature (Vercel)
- **Local**: `npm run dev`

## 📦 Variables d'Environnement

### Backend (Railway)
```bash
DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=sk-ant-...
JWT_SECRET=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=rex-reports
FRONTEND_URL=https://...vercel.app
NODE_ENV=production
```

### Frontend (Vercel)
```bash
NEXT_PUBLIC_API_URL=https://...railway.app
NEXTAUTH_URL=https://...vercel.app
NEXTAUTH_SECRET=...
```

## 🛠️ Commandes Essentielles

### Installation
```bash
./init.sh                    # Installation complète

# Ou manuellement:
cd backend && npm install
cd frontend && npm install
```

### Développement
```bash
# Backend
cd backend
npm run dev                  # Port 3001

# Frontend
cd frontend
npm run dev                  # Port 3000
```

### Base de données
```bash
cd backend
npm run migrate              # Créer les tables
npm run seed                 # Données de test (à créer)
```

### Production
```bash
# Automatique via git push
git add .
git commit -m "..."
git push origin main

# Déploiement manuel
railway up                   # Backend
vercel --prod                # Frontend
```

## 📝 TODO / Améliorations Futures

### Priorité Haute
- [ ] Page dashboard complète
- [ ] Éditeur de fiches avec preview temps réel
- [ ] Tests unitaires (Jest + Supertest)
- [ ] Gestion des erreurs améliorée
- [ ] Logs structurés (Winston)

### Priorité Moyenne
- [ ] Refresh tokens
- [ ] Pagination côté serveur
- [ ] Filtres avancés (tags, dates)
- [ ] Export Excel des fiches
- [ ] Statistiques et analytics
- [ ] Recherche full-text dans le frontend

### Priorité Basse
- [ ] Notifications email
- [ ] Thème sombre
- [ ] Multi-langues (EN/FR)
- [ ] Versioning des fiches
- [ ] Commentaires et revue

## 🐛 Debug

### Activer les logs détaillés

**Backend:**
```javascript
// Dans server.js
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});
```

**Frontend:**
```typescript
// Dans api.ts
api.interceptors.request.use(config => {
  console.log('Request:', config);
  return config;
});
```

## 📚 Ressources

- [Anthropic API Docs](https://docs.anthropic.com)
- [Next.js Docs](https://nextjs.org/docs)
- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 👥 Contribution

Ce projet est privé et propriétaire d'Hydro-Québec.

### Workflow Git
```bash
# Créer une branche feature
git checkout -b feature/nouvelle-fonctionnalite

# Développer et commiter
git add .
git commit -m "feat: description"

# Push et créer une PR
git push origin feature/nouvelle-fonctionnalite
```

## 📄 Licence

Propriétaire - Hydro-Québec © 2024

---

**Version**: 1.0.0  
**Dernière mise à jour**: 2024  
**Contact**: Division Production - Hydro-Québec
