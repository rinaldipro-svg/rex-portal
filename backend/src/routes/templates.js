import express from 'express';
import { z } from 'zod';
import { query } from '../db/config.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ============ TEMPLATE SECTIONS (MUST BE BEFORE :id ROUTES) ============

const sectionSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
  section_type: z.string().min(1, 'Le type de section est requis'),
  content: z.string().min(1, 'Le contenu est requis'),
  category: z.string().default('general'),
  is_shared: z.boolean().default(true),
});

// GET /api/templates/sections - Lister toutes les sections de template
router.get('/sections', authenticateToken, async (req, res) => {
  try {
    const { section_type, category, search, limit = 50, offset = 0 } = req.query;

    const conditions = ['(is_shared = true OR created_by = $1)'];
    const params = [req.user.id];
    let paramIndex = 2;

    if (section_type) {
      conditions.push(`section_type = $${paramIndex}`);
      params.push(section_type);
      paramIndex++;
    }

    if (category && category !== 'all') {
      conditions.push(`category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    if (search) {
      conditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const result = await query(
      `SELECT 
        id, name, description, section_type, category, is_shared, created_by,
        created_at, updated_at,
        COUNT(*) OVER() AS total_count
      FROM template_sections
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    res.json({
      sections: result.rows.map(({ total_count, ...section }) => section),
      total: result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get template sections error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des sections' });
  }
});

// GET /api/templates/sections/:id - Récupérer une section spécifique
router.get('/sections/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT * FROM template_sections 
       WHERE id = $1 AND (is_shared = true OR created_by = $2)`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Section non trouvée' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get template section error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la section' });
  }
});

// POST /api/templates/sections - Créer une nouvelle section de template
router.post('/sections', authenticateToken, async (req, res) => {
  try {
    const data = sectionSchema.parse(req.body);

    const result = await query(
      `INSERT INTO template_sections (name, description, section_type, content, category, is_shared, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [data.name, data.description, data.section_type, data.content, data.category, data.is_shared, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Une section avec ce nom existe déjà' });
    }
    console.error('Create template section error:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la section' });
  }
});

// PUT /api/templates/sections/:id - Mettre à jour une section
router.put('/sections/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const data = sectionSchema.partial().parse(req.body);

    const existingSection = await query(
      'SELECT created_by FROM template_sections WHERE id = $1',
      [id]
    );

    if (existingSection.rows.length === 0) {
      return res.status(404).json({ error: 'Section non trouvée' });
    }

    if (existingSection.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: 'Vous n\'avez pas la permission de modifier cette section' });
    }

    const updates = [];
    const params = [id, req.user.id];
    let paramIndex = 3;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
    }

    const result = await query(
      `UPDATE template_sections SET ${updates.join(', ')}
       WHERE id = $1 AND created_by = $2
       RETURNING *`,
      params
    );

    res.json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    console.error('Update template section error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la section' });
  }
});

// DELETE /api/templates/sections/:id - Supprimer une section
router.delete('/sections/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM template_sections WHERE id = $1 AND created_by = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Section non trouvée ou pas autorisée' });
    }

    res.json({ message: 'Section supprimée avec succès' });
  } catch (error) {
    console.error('Delete template section error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la section' });
  }
});

// ============ FICHE TEMPLATES ============

// Schéma de validation pour un template de fiche
const templateSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
  category: z.string().default('general'),
  is_shared: z.boolean().default(true),
  titre: z.string().optional(),
  infrastructure: z.string().optional(),
  unspsc_code: z.string().optional(),
  unspsc_desc: z.string().optional(),
  localisation: z.string().optional(),
  contrainte: z.string().optional(),
  environnement: z.string().optional(),
  lignerouge: z.string().optional(),
  technologie: z.string().optional(),
  ingenierie: z.string().optional(),
  securite: z.string().optional(),
  metrique1_val: z.string().optional(),
  metrique1_titre: z.string().optional(),
  metrique1_desc: z.string().optional(),
  metrique2_val: z.string().optional(),
  metrique2_titre: z.string().optional(),
  metrique2_desc: z.string().optional(),
  metrique3_val: z.string().optional(),
  metrique3_titre: z.string().optional(),
  metrique3_desc: z.string().optional(),
  citation: z.string().optional(),
  auteur: z.string().optional(),
});

// GET /api/templates - Lister tous les templates (partagés + personnels de l'utilisateur)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { category, search, limit = 50, offset = 0 } = req.query;
    
    const conditions = ['(is_shared = true OR created_by = $1)'];
    const params = [req.user.id];
    let paramIndex = 2;

    if (category && category !== 'all') {
      conditions.push(`category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    if (search) {
      conditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const result = await query(
      `SELECT 
        id, name, description, category, is_shared, created_by, 
        created_at, updated_at,
        COUNT(*) OVER() AS total_count
      FROM templates
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    res.json({
      templates: result.rows.map(({ total_count, ...template }) => template),
      total: result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des templates' });
  }
});

// GET /api/templates/:id - Récupérer un template spécifique
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT * FROM templates 
       WHERE id = $1 AND (is_shared = true OR created_by = $2)`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du template' });
  }
});

// POST /api/templates - Créer un nouveau template
router.post('/', authenticateToken, async (req, res) => {
  try {
    const data = templateSchema.parse(req.body);

    const result = await query(
      `INSERT INTO templates (
        name, description, category, is_shared, created_by,
        titre, infrastructure, unspsc_code, unspsc_desc,
        localisation, contrainte, environnement, lignerouge,
        technologie, ingenierie, securite,
        metrique1_val, metrique1_titre, metrique1_desc,
        metrique2_val, metrique2_titre, metrique2_desc,
        metrique3_val, metrique3_titre, metrique3_desc,
        citation, auteur
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
      ) RETURNING *`,
      [
        data.name, data.description, data.category, data.is_shared, req.user.id,
        data.titre, data.infrastructure, data.unspsc_code, data.unspsc_desc,
        data.localisation, data.contrainte, data.environnement, data.lignerouge,
        data.technologie, data.ingenierie, data.securite,
        data.metrique1_val, data.metrique1_titre, data.metrique1_desc,
        data.metrique2_val, data.metrique2_titre, data.metrique2_desc,
        data.metrique3_val, data.metrique3_titre, data.metrique3_desc,
        data.citation, data.auteur
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    if (error.code === '23505') { // UNIQUE constraint violation
      return res.status(409).json({ error: 'Un template avec ce nom existe déjà' });
    }
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Erreur lors de la création du template' });
  }
});

// PUT /api/templates/:id - Mettre à jour un template (propriétaire uniquement)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const data = templateSchema.partial().parse(req.body);

    // Vérifier que l'utilisateur est le propriétaire
    const existingTemplate = await query(
      'SELECT created_by FROM templates WHERE id = $1',
      [id]
    );

    if (existingTemplate.rows.length === 0) {
      return res.status(404).json({ error: 'Template non trouvé' });
    }

    if (existingTemplate.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: 'Vous n\'avez pas la permission de modifier ce template' });
    }

    // Construire la requête de mise à jour
    const updates = [];
    const params = [id, req.user.id];
    let paramIndex = 3;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune données à mettre à jour' });
    }

    const result = await query(
      `UPDATE templates SET ${updates.join(', ')} 
       WHERE id = $1 AND created_by = $2 
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du template' });
  }
});

// DELETE /api/templates/:id - Supprimer un template (propriétaire uniquement)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM templates WHERE id = $1 AND created_by = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template non trouvé ou pas autorisé' });
    }

    res.json({ message: 'Template supprimé avec succès' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du template' });
  }
});

export default router;
