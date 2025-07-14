import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to extract SVG content from TSX file
function extractSvgFromTsx(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Find the symbol element
    const symbolMatch = content.match(/<symbol[^>]*>[\s\S]*?<\/symbol>/);
    if (!symbolMatch) {
      console.log(`No symbol found in ${filePath}`);
      return null;
    }
    let symbolContent = symbolMatch[0];
    // Replace symbol with svg
    symbolContent = symbolContent.replace(/<symbol/, '<svg');
    symbolContent = symbolContent.replace(/<\/symbol>/, '</svg>');
    // Remove id="..." or id={...} from the opening <svg ...> tag only
    symbolContent = symbolContent.replace(/(<svg[^>]*?)\s+id=("[^"]*"|\{[^}]*\})([^>]*>)/, '$1$3');
    symbolContent = symbolContent.replace(/xmlSpace="preserve"/g, '');
    // Clean up extra spaces left by attribute removal
    symbolContent = symbolContent.replace(/<svg\s+/g, '<svg ').replace(/\s{2,}/g, ' ');
    return symbolContent;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return null;
  }
}

function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/Symbol$/, '')
    .toLowerCase();
}

function extractSymbols() {
  const symbolsDir = path.join(__dirname, '../src/core/k8s/icons/sprites/Resources/symbols');
  const outputDir = path.join(__dirname, '../src/assets/icons/k8s');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const files = fs.readdirSync(symbolsDir).filter(file => file.endsWith('.tsx') && file !== 'index.ts');
  console.log(`Found ${files.length} symbol files to process...`);
  files.forEach(file => {
    const filePath = path.join(symbolsDir, file);
    const svgContent = extractSvgFromTsx(filePath);
    if (svgContent) {
      const baseName = path.basename(file, '.tsx');
      const kebabName = toKebabCase(baseName);
      const outputPath = path.join(outputDir, `${kebabName}.svg`);
      fs.writeFileSync(outputPath, svgContent);
      console.log(`✓ Created ${kebabName}.svg`);
    }
  });
  console.log('\nExtraction complete!');
  console.log(`SVG files saved to: ${outputDir}`);
}

extractSymbols();