import pool from '../config.js';

const createTemplatesTables = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Migration: Création des tables de templates...');

    // Table des templates de fiches
    await client.query(`
      CREATE TABLE IF NOT EXISTS templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) DEFAULT 'general',
        is_shared BOOLEAN DEFAULT true,
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Champs de template de fiche (basés sur le schéma de fiches)
        titre VARCHAR(255),
        infrastructure TEXT,
        unspsc_code VARCHAR(50),
        unspsc_desc TEXT,
        localisation TEXT,
        contrainte TEXT,
        environnement TEXT,
        lignerouge TEXT,
        technologie TEXT,
        ingenierie TEXT,
        securite TEXT,
        metrique1_val VARCHAR(50),
        metrique1_titre VARCHAR(255),
        metrique1_desc TEXT,
        metrique2_val VARCHAR(50),
        metrique2_titre VARCHAR(255),
        metrique2_desc TEXT,
        metrique3_val VARCHAR(50),
        metrique3_titre VARCHAR(255),
        metrique3_desc TEXT,
        citation TEXT,
        auteur VARCHAR(255),
        
        CONSTRAINT templates_unique_name_per_user UNIQUE(name, created_by)
      );
    `);
    console.log('✅ Table templates créée');

    // Index pour la recherche et le tri
    await client.query(`
      CREATE INDEX idx_templates_category ON templates(category);
      CREATE INDEX idx_templates_created_by ON templates(created_by);
      CREATE INDEX idx_templates_is_shared ON templates(is_shared);
      CREATE INDEX idx_templates_created_at ON templates(created_at DESC);
    `);
    console.log('✅ Index sur templates créés');

    // Table des sections de template (pour les snippets réutilisables)
    await client.query(`
      CREATE TABLE IF NOT EXISTS template_sections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        section_type VARCHAR(100) NOT NULL, -- 'infrastructure', 'technologie', 'securite', etc.
        content TEXT NOT NULL,
        category VARCHAR(100) DEFAULT 'general',
        is_shared BOOLEAN DEFAULT true,
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT template_sections_unique_name_per_user UNIQUE(name, created_by)
      );
    `);
    console.log('✅ Table template_sections créée');

    // Index pour template_sections
    await client.query(`
      CREATE INDEX idx_template_sections_type ON template_sections(section_type);
      CREATE INDEX idx_template_sections_created_by ON template_sections(created_by);
      CREATE INDEX idx_template_sections_is_shared ON template_sections(is_shared);
    `);
    console.log('✅ Index sur template_sections créés');

    // Table de liaison pour utilisation de sections dans les templates
    await client.query(`
      CREATE TABLE IF NOT EXISTS template_section_usage (
        template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
        section_id UUID REFERENCES template_sections(id) ON DELETE CASCADE,
        field_type VARCHAR(100) NOT NULL,
        PRIMARY KEY (template_id, section_id, field_type)
      );
    `);
    console.log('✅ Table template_section_usage créée');

    // Fonction pour mettre à jour updated_at
    await client.query(`
      CREATE OR REPLACE FUNCTION update_templates_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      CREATE OR REPLACE FUNCTION update_template_sections_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ Fonctions de trigger créées');

    // Triggers
    await client.query(`
      DROP TRIGGER IF EXISTS templates_updated_at_trigger ON templates;
      CREATE TRIGGER templates_updated_at_trigger
      BEFORE UPDATE ON templates
      FOR EACH ROW
      EXECUTE FUNCTION update_templates_updated_at();
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS template_sections_updated_at_trigger ON template_sections;
      CREATE TRIGGER template_sections_updated_at_trigger
      BEFORE UPDATE ON template_sections
      FOR EACH ROW
      EXECUTE FUNCTION update_template_sections_updated_at();
    `);
    console.log('✅ Triggers créés');

    console.log('✅ Migration terminée avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

// Exécution
createTemplatesTables()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
