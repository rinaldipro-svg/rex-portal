import puppeteer from 'puppeteer';

async function testPuppeteer() {
  console.log('🧪 Test de Puppeteer...');
  
  try {
    console.log('1️⃣ Lancement du navigateur...');
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    console.log('2️⃣ Création d\'une page...');
    const page = await browser.newPage();
    
    console.log('3️⃣ Génération d\'un PDF test...');
    await page.setContent('<h1>Test PDF</h1><p>Si vous voyez ce message, Puppeteer fonctionne !</p>');
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true
    });
    
    console.log('4️⃣ Fermeture du navigateur...');
    await browser.close();
    
    console.log('✅ SUCCÈS ! Puppeteer fonctionne correctement.');
    console.log(`📄 PDF généré : ${pdf.length} bytes`);
    
  } catch (error) {
    console.error('❌ ERREUR Puppeteer:', error.message);
    console.log('\n💡 Solutions possibles:');
    console.log('1. Réinstaller Puppeteer: npm install puppeteer --force');
    console.log('2. Utiliser l\'aperçu HTML en dev (Option 2)');
  }
}

testPuppeteer();