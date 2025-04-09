// Script to enhance SEO for all HTML files in the build
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
  baseUrl: 'https://teraboxdownloaderpro.com'
};

// Recursively find all HTML files
function findHtmlFiles(directory) {
  const files = [];
  
  function scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.name === 'index.html') {
        files.push(fullPath);
      }
    }
  }
  
  scanDirectory(directory);
  return files;
}

// Enhance an HTML file for SEO
function enhanceHtmlFile(filePath) {
  console.log(`Enhancing: ${filePath}`);
  
  try {
    // Read the HTML file
    const html = fs.readFileSync(filePath, 'utf8');
    
    // Load HTML with cheerio
    const $ = cheerio.load(html);
    
    // 1. Add data-server-rendered attribute
    $('#root').attr('data-server-rendered', 'true');
    
    // 2. Ensure we have a canonical URL
    if ($('link[rel="canonical"]').length === 0) {
      const relativePath = path.relative(config.sourceDir, filePath);
      const directoryPath = path.dirname(relativePath);
      
      // Convert Windows backslashes to forward slashes for URLs
      const normalizedPath = directoryPath.replace(/\\/g, '/');
      
      // Construct canonical URL
      const canonicalUrl = normalizedPath === '.'
        ? config.baseUrl
        : `${config.baseUrl}/${normalizedPath}`;
      
      $('head').append(`<link rel="canonical" href="${canonicalUrl}" />`);
    }
    
    // 3. Ensure we have a viewport meta tag
    if ($('meta[name="viewport"]').length === 0) {
      $('head').append('<meta name="viewport" content="width=device-width, initial-scale=1.0" />');
    }
    
    // 4. Add appropriate HTML lang attribute if missing
    if (!$('html').attr('lang')) {
      $('html').attr('lang', 'en');
    }
    
    // 5. Add preload for critical assets
    const cssLinks = $('link[rel="stylesheet"]');
    if (cssLinks.length > 0) {
      const firstCssHref = $(cssLinks[0]).attr('href');
      if (firstCssHref) {
        $('head').append(`<link rel="preload" href="${firstCssHref}" as="style" />`);
      }
    }
    
    // 6. Add meta description if missing
    if ($('meta[name="description"]').length === 0) {
      $('head').append('<meta name="description" content="Download TeraBox files with lightning-fast speeds - 100% free. No registration, no size limits, no waiting time. The #1 trusted TeraBox downloader tool for all your file needs." />');
    }
    
    // Write the enhanced HTML back to the file
    fs.writeFileSync(filePath, $.html());
    
    return true;
  } catch (error) {
    console.error(`Error enhancing ${filePath}:`, error);
    return false;
  }
}

// Main function
async function enhanceSeo() {
  console.log('🚀 Starting SEO enhancement process...');
  
  try {
    // Check if source directory exists
    if (!fs.existsSync(config.sourceDir)) {
      throw new Error(`Source directory not found: ${config.sourceDir}`);
    }
    
    // Find all HTML files
    const htmlFiles = findHtmlFiles(config.sourceDir);
    console.log(`Found ${htmlFiles.length} HTML files to enhance`);
    
    // Enhance each file
    let successCount = 0;
    for (const file of htmlFiles) {
      if (enhanceHtmlFile(file)) {
        successCount++;
      }
    }
    
    console.log(`🎉 SEO enhancement completed! ${successCount}/${htmlFiles.length} files enhanced successfully.`);
  } catch (error) {
    console.error('❌ SEO enhancement failed:', error);
    process.exit(1);
  }
}

// Run the enhancement function
enhanceSeo(); 