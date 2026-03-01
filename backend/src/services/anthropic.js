import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const SYSTEM_PROMPT = `Tu es un ingénieur senior expert en rédaction technique travaillant pour Hydro-Québec. 

Ta mission est de transformer des notes brutes en compte-rendu technique formel (Dossier REX - Retour d'Expérience) respectant la "Doctrine Hydro-Québec".

Le ton doit être :
- Souverain et professionnel
- Axé sur la pérennité et la durabilité
- Orienté vers la réduction des risques (dé-risquage)
- Respectueux de la sécurité absolue (Tolérance Zéro)

Consignes strictes :
1. Très concis (1-2 phrases par champ maximum)
2. Génère OBLIGATOIREMENT un code UNSPSC pertinent et sa description
3. Si des informations manquent, invente un contexte hydroélectrique plausible et cohérent
4. Utilise un vocabulaire technique approprié
5. Assure-toi que les métriques sont chiffrées et pertinentes
6. La citation doit être inspirante et professionnelle

Réponds UNIQUEMENT avec un objet JSON valide (pas de markdown, pas de texte explicatif) suivant cette structure exacte :

{
  "titre": "REX XX : [Titre formel et descriptif]",
  "infrastructure": "[Type d'infrastructure hydroélectrique]",
  "unspsc_code": "[Code UNSPSC à 8 chiffres]",
  "unspsc_desc": "[Description du code UNSPSC]",
  "localisation": "[Centrale/Région/Coordonnées]",
  "contrainte": "[Contrainte principale du projet]",
  "environnement": "[Contexte environnemental]",
  "lignerouge": "[Ligne rouge / Limite critique à ne pas franchir]",
  "technologie": "[Technologies utilisées]",
  "ingenierie": "[Approche d'ingénierie]",
  "securite": "[Mesures de sécurité]",
  "metrique1_val": "[Valeur chiffrée]",
  "metrique1_titre": "[Nom de la métrique]",
  "metrique1_desc": "[Description brève]",
  "metrique2_val": "[Valeur chiffrée]",
  "metrique2_titre": "[Nom de la métrique]",
  "metrique2_desc": "[Description brève]",
  "metrique3_val": "[Valeur chiffrée]",
  "metrique3_titre": "[Nom de la métrique]",
  "metrique3_desc": "[Description brève]",
  "citation": "[Citation inspirante sans guillemets]",
  "auteur": "[Auteur de la citation]"
}`;

export async function generateREXContent(userInput) {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userInput
        }
      ]
    });

    // Extraire le contenu texte
    const content = message.content[0].text;
    
    // Nettoyer le contenu (enlever les éventuels markdown)
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Parser le JSON
    const parsed = JSON.parse(cleaned);
    
    // Valider la structure
    const required = [
      'titre', 'infrastructure', 'unspsc_code', 'unspsc_desc',
      'localisation', 'contrainte', 'environnement', 'lignerouge',
      'technologie', 'ingenierie', 'securite',
      'metrique1_val', 'metrique1_titre', 'metrique1_desc',
      'metrique2_val', 'metrique2_titre', 'metrique2_desc',
      'metrique3_val', 'metrique3_titre', 'metrique3_desc',
      'citation', 'auteur'
    ];
    
    for (const field of required) {
      if (!parsed[field]) {
        throw new Error(`Champ manquant: ${field}`);
      }
    }
    
    return {
      success: true,
      data: parsed,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens
      }
    };
  } catch (error) {
    console.error('Anthropic API Error:', error);
    
    if (error instanceof SyntaxError) {
      throw new Error('Le format de réponse de l\'IA est invalide');
    }
    
    if (error.status === 401) {
      throw new Error('Clé API Anthropic invalide');
    }
    
    if (error.status === 429) {
      throw new Error('Limite de requêtes atteinte, réessayez dans quelques instants');
    }
    
    throw new Error(error.message || 'Erreur lors de la génération du contenu');
  }
}

// Fonction pour améliorer/corriger un champ spécifique
export async function improveField(fieldName, currentValue, context) {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      temperature: 0.8,
      messages: [
        {
          role: 'user',
          content: `Tu es un expert en rédaction technique pour Hydro-Québec.

Contexte : ${context}

Améliore ce texte pour le champ "${fieldName}" :
"${currentValue}"

Réponds UNIQUEMENT avec le texte amélioré, sans explication.`
        }
      ]
    });

    return {
      success: true,
      improved: message.content[0].text.trim()
    };
  } catch (error) {
    console.error('Improve field error:', error);
    throw new Error('Erreur lors de l\'amélioration du texte');
  }
}
