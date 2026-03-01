import express from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth.js';
import { generateREXContent, improveField } from '../services/anthropic.js';

const router = express.Router();

// Schéma de validation
const generateSchema = z.object({
  input: z.string().min(10, 'Les notes doivent contenir au moins 10 caractères'),
  context: z.string().optional()
});

const improveSchema = z.object({
  fieldName: z.string(),
  currentValue: z.string(),
  context: z.string().optional()
});

// POST /api/generate - Génération complète d'une fiche REX
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { input, context } = generateSchema.parse(req.body);

    console.log(`🤖 Génération REX pour l'utilisateur ${req.user.email}`);

    const result = await generateREXContent(input);

    res.json({
      success: true,
      data: result.data,
      meta: {
        tokens: result.usage,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: error.errors 
      });
    }
    
    console.error('Generate error:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur lors de la génération'
    });
  }
});

// POST /api/generate/improve - Amélioration d'un champ spécifique
router.post('/improve', authenticateToken, async (req, res) => {
  try {
    const { fieldName, currentValue, context } = improveSchema.parse(req.body);

    console.log(`🔧 Amélioration du champ "${fieldName}" pour ${req.user.email}`);

    const result = await improveField(fieldName, currentValue, context || '');

    res.json({
      success: true,
      improved: result.improved
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: error.errors 
      });
    }
    
    console.error('Improve error:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur lors de l\'amélioration'
    });
  }
});

// GET /api/generate/test - Test de connexion à l'API
router.get('/test', authenticateToken, async (req, res) => {
  try {
    const result = await generateREXContent('Test de connexion à l\'API Anthropic');
    res.json({ 
      success: true, 
      message: 'Connexion à l\'API Anthropic fonctionnelle',
      model: 'claude-sonnet-4-20250514'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
