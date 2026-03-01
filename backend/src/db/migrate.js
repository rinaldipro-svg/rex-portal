import pool from './config.js';

const migrateLigneRouge = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Migration: Renommer ligne_rouge en lignerouge...');

    // Renommer la colonne
    await client.query(`
      ALTER TABLE fiches 
      RENAME COLUMN ligne_rouge TO lignerouge;
    `);
    console.log('✅ Colonne renommée: ligne_rouge → lignerouge');

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
migrateLigneRouge()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));