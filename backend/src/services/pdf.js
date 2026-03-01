import puppeteer from 'puppeteer';

// Template HTML pour le PDF
const generateHTML = (fiche) => {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <style>
        @page {
            size: A4;
            margin: 2cm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            color: #1e293b;
            line-height: 1.6;
            font-size: 11pt;
        }
        
        .header {
            border-bottom: 4px solid #002D72;
            padding-bottom: 1.5cm;
            margin-bottom: 1.5cm;
        }
        
        .logo-area {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.8cm;
        }
        
        .logo-text {
            font-size: 24pt;
            font-weight: 800;
            color: #FF6600;
            letter-spacing: 0.1em;
        }
        
        .doc-type {
            font-size: 9pt;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .title {
            font-size: 20pt;
            font-weight: 700;
            color: #002D72;
            margin-bottom: 0.3cm;
        }
        
        .metadata {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5cm;
            background: #f8fafc;
            padding: 0.6cm;
            border-radius: 0.2cm;
            margin-bottom: 1cm;
        }
        
        .metadata-item {
            font-size: 9pt;
        }
        
        .metadata-label {
            font-weight: 600;
            color: #64748b;
            margin-bottom: 0.1cm;
        }
        
        .metadata-value {
            color: #1e293b;
        }
        
        .section {
            margin-bottom: 1cm;
            page-break-inside: avoid;
        }
        
        .section-title {
            font-size: 12pt;
            font-weight: 700;
            color: #002D72;
            margin-bottom: 0.4cm;
            padding-bottom: 0.2cm;
            border-bottom: 2px solid #e2e8f0;
        }
        
        .section-content {
            font-size: 10pt;
            color: #334155;
        }
        
        .warning-box {
            background: #fef2f2;
            border-left: 4px solid #dc2626;
            padding: 0.6cm;
            margin: 1cm 0;
        }
        
        .warning-title {
            font-weight: 700;
            color: #dc2626;
            margin-bottom: 0.3cm;
        }
        
        .metrics {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.5cm;
            margin: 1cm 0;
        }
        
        .metric-card {
            background: #f1f5f9;
            padding: 0.5cm;
            border-radius: 0.2cm;
            text-align: center;
        }
        
        .metric-value {
            font-size: 18pt;
            font-weight: 700;
            color: #002D72;
            margin-bottom: 0.2cm;
        }
        
        .metric-label {
            font-size: 9pt;
            font-weight: 600;
            color: #64748b;
            margin-bottom: 0.2cm;
        }
        
        .metric-desc {
            font-size: 8pt;
            color: #64748b;
        }
        
        .quote {
            background: #f8fafc;
            border-left: 4px solid #FF6600;
            padding: 0.8cm;
            margin: 1cm 0;
            font-style: italic;
        }
        
        .quote-text {
            font-size: 11pt;
            color: #334155;
            margin-bottom: 0.3cm;
        }
        
        .quote-author {
            font-size: 9pt;
            color: #64748b;
            text-align: right;
        }
        
        .footer {
            position: fixed;
            bottom: 1.5cm;
            left: 2cm;
            right: 2cm;
            border-top: 1px solid #e2e8f0;
            padding-top: 0.5cm;
            font-size: 8pt;
            color: #94a3b8;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo-area">
            <div class="logo-text">PORTAIL REX</div>
            <div class="doc-type">Division Production • Hydro-Québec</div>
        </div>
        <div class="title">${fiche.titre || 'Sans titre'}</div>
    </div>
    
    <div class="metadata">
        <div class="metadata-item">
            <div class="metadata-label">Infrastructure</div>
            <div class="metadata-value">${fiche.infrastructure || 'N/A'}</div>
        </div>
        <div class="metadata-item">
            <div class="metadata-label">Localisation</div>
            <div class="metadata-value">${fiche.localisation || 'N/A'}</div>
        </div>
        <div class="metadata-item">
            <div class="metadata-label">Code UNSPSC</div>
            <div class="metadata-value">${fiche.unspsc_code || 'N/A'}</div>
        </div>
        <div class="metadata-item">
            <div class="metadata-label">Classification</div>
            <div class="metadata-value">${fiche.unspsc_desc || 'N/A'}</div>
        </div>
    </div>
    
    ${fiche.contrainte ? `
    <div class="section">
        <div class="section-title">Contrainte Principale</div>
        <div class="section-content">${fiche.contrainte}</div>
    </div>
    ` : ''}
    
    ${fiche.environnement ? `
    <div class="section">
        <div class="section-title">Contexte Environnemental</div>
        <div class="section-content">${fiche.environnement}</div>
    </div>
    ` : ''}
    
    ${fiche.ligne_rouge ? `
    <div class="warning-box">
        <div class="warning-title">⚠️ LIGNE ROUGE - Limite Critique</div>
        <div>${fiche.ligne_rouge}</div>
    </div>
    ` : ''}
    
    ${fiche.technologie ? `
    <div class="section">
        <div class="section-title">Technologies Déployées</div>
        <div class="section-content">${fiche.technologie}</div>
    </div>
    ` : ''}
    
    ${fiche.ingenierie ? `
    <div class="section">
        <div class="section-title">Approche d'Ingénierie</div>
        <div class="section-content">${fiche.ingenierie}</div>
    </div>
    ` : ''}
    
    ${fiche.securite ? `
    <div class="section">
        <div class="section-title">Mesures de Sécurité</div>
        <div class="section-content">${fiche.securite}</div>
    </div>
    ` : ''}
    
    ${fiche.metrique1_val || fiche.metrique2_val || fiche.metrique3_val ? `
    <div class="section">
        <div class="section-title">Métriques Clés</div>
        <div class="metrics">
            ${fiche.metrique1_val ? `
            <div class="metric-card">
                <div class="metric-value">${fiche.metrique1_val}</div>
                <div class="metric-label">${fiche.metrique1_titre || 'Métrique 1'}</div>
                <div class="metric-desc">${fiche.metrique1_desc || ''}</div>
            </div>
            ` : ''}
            ${fiche.metrique2_val ? `
            <div class="metric-card">
                <div class="metric-value">${fiche.metrique2_val}</div>
                <div class="metric-label">${fiche.metrique2_titre || 'Métrique 2'}</div>
                <div class="metric-desc">${fiche.metrique2_desc || ''}</div>
            </div>
            ` : ''}
            ${fiche.metrique3_val ? `
            <div class="metric-card">
                <div class="metric-value">${fiche.metrique3_val}</div>
                <div class="metric-label">${fiche.metrique3_titre || 'Métrique 3'}</div>
                <div class="metric-desc">${fiche.metrique3_desc || ''}</div>
            </div>
            ` : ''}
        </div>
    </div>
    ` : ''}
    
    ${fiche.citation ? `
    <div class="quote">
        <div class="quote-text">${fiche.citation}</div>
        ${fiche.auteur ? `<div class="quote-author">— ${fiche.auteur}</div>` : ''}
    </div>
    ` : ''}
    
    <div class="footer">
        Document généré le ${new Date().toLocaleDateString('fr-CA')} • Portail REX • Hydro-Québec
    </div>
</body>
</html>
  `;
};

export async function generatePDF(fiche) {
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    const html = generateHTML(fiche);
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '2cm',
        right: '2cm',
        bottom: '2cm',
        left: '2cm'
      }
    });

    await browser.close();
    
    return pdfBuffer;
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    console.error('PDF generation error:', error);
    throw new Error('Erreur lors de la génération du PDF');
  }
}
