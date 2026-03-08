import pool from './config.js';

const migrateLigneRouge = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Migration: Vérification des colonnes...');

    // Vérifier si la colonne ligne_rouge existe ET que lignerouge n'existe pas
    const checkLineRouge = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fiches' AND column_name = 'ligne_rouge'
      ) AS ligne_rouge_exists,
      EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fiches' AND column_name = 'lignerouge'
      ) AS lignerouge_exists;
    `);

    const { ligne_rouge_exists, lignerouge_exists } = checkLineRouge.rows[0];

    if (ligne_rouge_exists && !lignerouge_exists) {
      console.log('ℹ️ Renaming ligne_rouge to lignerouge...');
      // Renommer la colonne seulement si elle existe et la cible n'existe pas
      await client.query(`
        ALTER TABLE fiches 
        RENAME COLUMN ligne_rouge TO lignerouge;
      `);
      console.log('✅ Colonne renommée: ligne_rouge → lignerouge');
    } else if (lignerouge_exists) {
      console.log('ℹ️ La colonne lignerouge existe déjà (rien à faire)');
    } else {
      console.log('ℹ️ Les colonnes n\'existent pas (probablement table vide ou nouvellement créée)');
    }

    // Mettre à jour le trigger de recherche si nécessaire
    await client.query(`
      CREATE OR REPLACE FUNCTION update_search_vector() 
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.search_vector := 
          setweight(to_tsvector('french', COALESCE(NEW.titre, '')), 'A') ||
          setweight(to_tsvector('french', COALESCE(NEW.infrastructure, '')), 'B') ||
          setweight(to_tsvector('french', COALESCE(NEW.technologie, '')), 'C') ||
          setweight(to_tsvector('french', COALESCE(NEW.localisation, '')), 'D');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ Trigger de recherche mis à jour');

    // Run template migrations from the migrations directory
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
      CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
      CREATE INDEX IF NOT EXISTS idx_templates_created_by ON templates(created_by);
      CREATE INDEX IF NOT EXISTS idx_templates_is_shared ON templates(is_shared);
      CREATE INDEX IF NOT EXISTS idx_templates_created_at ON templates(created_at DESC);
    `);
    console.log('✅ Index sur templates créés');

    // Table des sections de template (pour les snippets réutilisables)
    await client.query(`
      CREATE TABLE IF NOT EXISTS template_sections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        section_type VARCHAR(100) NOT NULL,
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
      CREATE INDEX IF NOT EXISTS idx_template_sections_type ON template_sections(section_type);
      CREATE INDEX IF NOT EXISTS idx_template_sections_created_by ON template_sections(created_by);
      CREATE INDEX IF NOT EXISTS idx_template_sections_is_shared ON template_sections(is_shared);
      CREATE INDEX IF NOT EXISTS idx_template_sections_created_at ON template_sections(created_at DESC);
    `);
    console.log('✅ Index sur template_sections créés');

    // Trigger pour updated_at sur templates
    await client.query(`
      CREATE OR REPLACE FUNCTION update_templates_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS update_templates_timestamp_trigger ON templates;
      CREATE TRIGGER update_templates_timestamp_trigger
      BEFORE UPDATE ON templates
      FOR EACH ROW
      EXECUTE FUNCTION update_templates_timestamp();
    `);
    console.log('✅ Trigger updated_at sur templates créé');

    // Trigger pour updated_at sur template_sections
    await client.query(`
      CREATE OR REPLACE FUNCTION update_template_sections_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS update_template_sections_timestamp_trigger ON template_sections;
      CREATE TRIGGER update_template_sections_timestamp_trigger
      BEFORE UPDATE ON template_sections
      FOR EACH ROW
      EXECUTE FUNCTION update_template_sections_timestamp();
    `);
    console.log('✅ Trigger updated_at sur template_sections créé');

    console.log('✅ Toutes les migrations terminées avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

// Exécution
migrateLigneRouge()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));