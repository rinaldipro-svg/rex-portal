#!/bin/bash

# Script d'initialisation du Portail REX
# Usage: ./init.sh

set -e

echo "🚀 Initialisation du Portail REX - Hydro-Québec"
echo "================================================"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    echo "Installez Node.js 18+ depuis https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version 18+ requis (actuellement: $(node -v))${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) détecté${NC}"

# Vérifier PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL n'est pas installé (optionnel pour dev local)${NC}"
else
    echo -e "${GREEN}✓ PostgreSQL détecté${NC}"
fi

echo ""
echo "📦 Installation des dépendances..."
echo ""

# Backend
echo "Backend..."
cd backend
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Fichier .env créé - CONFIGUREZ VOS VARIABLES !${NC}"
fi
npm install
echo -e "${GREEN}✓ Backend installé${NC}"
cd ..

# Frontend
echo ""
echo "Frontend..."
cd frontend
if [ ! -f ".env.local" ]; then
    cp .env.local.example .env.local
    echo -e "${YELLOW}⚠️  Fichier .env.local créé - CONFIGUREZ VOS VARIABLES !${NC}"
fi
npm install
echo -e "${GREEN}✓ Frontend installé${NC}"
cd ..

echo ""
echo "================================================"
echo -e "${GREEN}✅ Installation terminée !${NC}"
echo ""
echo "📝 Prochaines étapes:"
echo ""
echo "1. Configurez les variables d'environnement:"
echo "   - backend/.env"
echo "   - frontend/.env.local"
echo ""
echo "2. Créez une base de données PostgreSQL locale:"
echo "   createdb rex_portal"
echo ""
echo "3. Exécutez les migrations:"
echo "   cd backend && npm run migrate"
echo ""
echo "4. Démarrez les serveurs de développement:"
echo ""
echo "   Terminal 1 (Backend):"
echo "   cd backend && npm run dev"
echo ""
echo "   Terminal 2 (Frontend):"
echo "   cd frontend && npm run dev"
echo ""
echo "5. Ouvrez http://localhost:3000"
echo ""
echo "📖 Guide complet de déploiement: voir DEPLOYMENT.md"
echo ""
