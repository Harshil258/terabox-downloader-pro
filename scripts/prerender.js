// Custom pre-rendering script for SEO
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cheerio from 'cheerio';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  sourceDir: path.resolve(__dirname, '../dist'),
  routes: [
    '/',
    '/player',
    '/about',
    '/contact',
    '/privacy-policy',
    '/terms',
    '/disclaimer',
    '/blog'
  ]
};

// Main function
async function prerender() {
  console.log('🚀 Starting custom pre-rendering for SEO...');
  
  try {
    // Check if source directory exists
    if (!fs.existsSync(config.sourceDir)) {
      throw new Error(`Source directory not found: ${config.sourceDir}`);
    }
    
    // Read the source HTML
    const indexPath = path.join(config.sourceDir, 'index.html');
    const originalHtml = fs.readFileSync(indexPath, 'utf8');
    
    // Load HTML with cheerio
    const $ = cheerio.load(originalHtml);
    
    // Add data-server-rendered attribute for hydration
    $('#root').attr('data-server-rendered', 'true');
    
    // Update HTML with SEO enhancements
    const enhancedHtml = $.html();
    
    // Create route directories and write HTML files
    for (const route of config.routes) {
      // Skip root as it's already handled
      if (route === '/') continue;
      
      const routePath = path.join(config.sourceDir, route);
      const htmlPath = path.join(routePath, 'index.html');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(routePath)) {
        fs.mkdirSync(routePath, { recursive: true });
      }
      
      // Write the HTML file
      fs.writeFileSync(htmlPath, enhancedHtml);
      console.log(`✅ Pre-rendered route: ${route}`);
    }
    
    // Update the root index.html
    fs.writeFileSync(indexPath, enhancedHtml);
    console.log('✅ Updated root index.html');
    
    console.log('🎉 Pre-rendering completed successfully!');
  } catch (error) {
    console.error('❌ Pre-rendering failed:', error);
    process.exit(1);
  }
}

// Run the prerender function
prerender(); 