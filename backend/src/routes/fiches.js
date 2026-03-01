import express from 'express';
import { z } from 'zod';
import { query } from '../db/config.js';
import { authenticateToken } from '../middleware/auth.js';
import { generatePDF } from '../services/pdf.js';
import { uploadToS3 } from '../services/storage.js';

const router = express.Router();

// Schéma de validation pour une fiche
const ficheSchema = z.object({
  titre: z.string().min(1),
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
  status: z.enum(['draft', 'published', 'archived']).default('draft')
});

// GET /api/fiches - Liste toutes les fiches de l'utilisateur
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, search, limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT 
        id, titre, infrastructure, localisation, status, 
        pdf_url, created_at, updated_at, published_at
      FROM fiches 
      WHERE user_id = $1
    `;
    const params = [req.user.id];
    let paramIndex = 2;

    // Filtrer par status
    if (status && ['draft', 'published', 'archived'].includes(status)) {
      queryText += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Recherche textuelle
    if (search) {
      queryText += ` AND search_vector @@ plainto_tsquery('french', $${paramIndex})`;
      params.push(search);
      paramIndex++;
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(queryText, params);

    // Compter le total
    let countQuery = 'SELECT COUNT(*) FROM fiches WHERE user_id = $1';
    const countParams = [req.user.id];
    if (status) {
      countQuery += ' AND status = $2';
      countParams.push(status);
    }
    const countResult = await query(countQuery, countParams);

    res.json({
      fiches: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get fiches error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des fiches' });
  }
});

// GET /api/fiches/:id - Récupérer une fiche spécifique
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM fiches WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fiche non trouvée' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get fiche error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la fiche' });
  }
});

// POST /api/fiches - Créer une nouvelle fiche
router.post('/', authenticateToken, async (req, res) => {
  try {
    const data = ficheSchema.parse(req.body);

    const result = await query(
      `INSERT INTO fiches (
        user_id, titre, infrastructure, unspsc_code, unspsc_desc,
        localisation, contrainte, environnement, lignerouge,
        technologie, ingenierie, securite,
        metrique1_val, metrique1_titre, metrique1_desc,
        metrique2_val, metrique2_titre, metrique2_desc,
        metrique3_val, metrique3_titre, metrique3_desc,
        citation, auteur, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
      ) RETURNING *`,
      [
        req.user.id, data.titre, data.infrastructure, data.unspsc_code, data.unspsc_desc,
        data.localisation, data.contrainte, data.environnement, data.lignerouge,
        data.technologie, data.ingenierie, data.securite,
        data.metrique1_val, data.metrique1_titre, data.metrique1_desc,
        data.metrique2_val, data.metrique2_titre, data.metrique2_desc,
        data.metrique3_val, data.metrique3_titre, data.metrique3_desc,
        data.citation, data.auteur, data.status
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    console.error('Create fiche error:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la fiche' });
  }
});

// PUT /api/fiches/:id - Mettre à jour une fiche
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const data = ficheSchema.parse(req.body);

    // Vérifier que la fiche appartient à l'utilisateur
    const check = await query(
      'SELECT id FROM fiches WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Fiche non trouvée' });
    }

    const result = await query(
      `UPDATE fiches SET
        titre = $1, infrastructure = $2, unspsc_code = $3, unspsc_desc = $4,
        localisation = $5, contrainte = $6, environnement = $7, lignerouge = $8,
        technologie = $9, ingenierie = $10, securite = $11,
        metrique1_val = $12, metrique1_titre = $13, metrique1_desc = $14,
        metrique2_val = $15, metrique2_titre = $16, metrique2_desc = $17,
        metrique3_val = $18, metrique3_titre = $19, metrique3_desc = $20,
        citation = $21, auteur = $22, status = $23,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $24
      RETURNING *`,
      [
        data.titre, data.infrastructure, data.unspsc_code, data.unspsc_desc,
        data.localisation, data.contrainte, data.environnement, data.lignerouge,
        data.technologie, data.ingenierie, data.securite,
        data.metrique1_val, data.metrique1_titre, data.metrique1_desc,
        data.metrique2_val, data.metrique2_titre, data.metrique2_desc,
        data.metrique3_val, data.metrique3_titre, data.metrique3_desc,
        data.citation, data.auteur, data.status, id
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    console.error('Update fiche error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la fiche' });
  }
});

// DELETE /api/fiches/:id - Supprimer une fiche
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM fiches WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fiche non trouvée' });
    }

    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error('Delete fiche error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la fiche' });
  }
});

// POST /api/fiches/:id/publish - Publier une fiche et générer le PDF
router.post('/:id/publish', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer la fiche
    const ficheResult = await query(
      'SELECT * FROM fiches WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (ficheResult.rows.length === 0) {
      return res.status(404).json({ error: 'Fiche non trouvée' });
    }

    const fiche = ficheResult.rows[0];

    // Vérifier si on est en mode développement
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
      // MODE DEV : Publier sans générer le PDF
      console.log('🔧 Mode développement : Publication sans génération PDF réelle');
      
      const updateResult = await query(
        `UPDATE fiches SET 
          status = 'published',
          pdf_url = $1,
          published_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *`,
        [`/api/fiches/${id}/pdf-preview`, id]
      );

      return res.json({
        success: true,
        fiche: updateResult.rows[0],
        message: 'Mode développement : PDF simulé (sera généré en production)'
      });
    }

    // MODE PRODUCTION : Générer le PDF réel
    console.log('📄 Génération du PDF...');
    const pdfBuffer = await generatePDF(fiche);
    
    console.log('☁️ Upload sur S3/R2...');
    const { url, key } = await uploadToS3(pdfBuffer, `rex-${id}.pdf`);
    
    const updateResult = await query(
      `UPDATE fiches SET 
        status = 'published',
        pdf_url = $1,
        pdf_key = $2,
        published_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *`,
      [url, key, id]
    );

    res.json({
      success: true,
      fiche: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Publish fiche error:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la publication de la fiche',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/fiches/:id/pdf-preview - Générer et afficher le PDF (dev & prod)
router.get('/:id/pdf-preview', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer la fiche
    const result = await query(
      'SELECT * FROM fiches WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fiche non trouvée' });
    }

    const fiche = result.rows[0];

    // Générer le PDF
    console.log('📄 Génération du PDF pour preview...');
    const pdfBuffer = await generatePDF(fiche);

    // Envoyer le PDF directement
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="rex-${fiche.titre.substring(0, 30)}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF preview error:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la génération du PDF',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;