import pool from './config.js';

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Début de la migration...');

    // Table users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table users créée');

    // Table fiches
    await client.query(`
      CREATE TABLE IF NOT EXISTS fiches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        
        -- Métadonnées
        titre VARCHAR(500) NOT NULL,
        status VARCHAR(50) DEFAULT 'draft',
        
        -- Contenu structuré
        infrastructure TEXT,
        unspsc_code VARCHAR(50),
        unspsc_desc TEXT,
        localisation TEXT,
        contrainte TEXT,
        environnement TEXT,
        ligne_rouge TEXT,
        technologie TEXT,
        ingenierie TEXT,
        securite TEXT,
        
        -- Métriques
        metrique1_val VARCHAR(100),
        metrique1_titre VARCHAR(200),
        metrique1_desc TEXT,
        metrique2_val VARCHAR(100),
        metrique2_titre VARCHAR(200),
        metrique2_desc TEXT,
        metrique3_val VARCHAR(100),
        metrique3_titre VARCHAR(200),
        metrique3_desc TEXT,
        
        -- Citation
        citation TEXT,
        auteur VARCHAR(200),
        
        -- PDF
        pdf_url TEXT,
        pdf_key VARCHAR(500),
        
        -- Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        published_at TIMESTAMP,
        
        -- Index pour recherche
        search_vector tsvector
      );
    `);
    console.log('✅ Table fiches créée');

    // Index pour performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_fiches_user_id ON fiches(user_id);
      CREATE INDEX IF NOT EXISTS idx_fiches_status ON fiches(status);
      CREATE INDEX IF NOT EXISTS idx_fiches_created_at ON fiches(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_fiches_search ON fiches USING GIN(search_vector);
    `);
    console.log('✅ Index créés');

    // Trigger pour mise à jour automatique du search_vector
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

      DROP TRIGGER IF EXISTS fiches_search_vector_update ON fiches;
      
      CREATE TRIGGER fiches_search_vector_update 
      BEFORE INSERT OR UPDATE ON fiches
      FOR EACH ROW 
      EXECUTE FUNCTION update_search_vector();
    `);
    console.log('✅ Trigger de recherche créé');

    // Table sessions (optionnel, pour NextAuth)
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(500) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    `);
    console.log('✅ Table sessions créée');

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
createTables()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
