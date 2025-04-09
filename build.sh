#!/bin/bash
set -e

echo "🚀 Starting production build with SEO optimization..."

# Clean the dist folder if it exists
if [ -d "dist" ]; then
  echo "🧹 Cleaning previous build..."
  rm -rf dist
fi

# Run the production build
echo "🏗️ Building the application..."
npm run build

# Try to run react-snap
echo "🔍 Pre-rendering pages for SEO..."
if npx react-snap --source=dist --destination=dist; then
  echo "✅ Pre-rendering with react-snap completed successfully!"
else
  echo "⚠️ react-snap encountered an error, using custom pre-rendering fallback..."
  node scripts/prerender.js
fi

# Apply our SEO enhancement script
echo "🔧 Applying comprehensive SEO enhancements..."
node scripts/enhanceSeo.js

# Add robots.txt if it doesn't exist
if [ ! -f "dist/robots.txt" ]; then
  echo "🤖 Creating robots.txt..."
  cat > dist/robots.txt << EOL
User-agent: *
Allow: /
Sitemap: https://teraboxdownloaderpro.com/sitemap.xml
EOL
fi

# Add sitemap.xml if it doesn't exist
if [ ! -f "dist/sitemap.xml" ]; then
  echo "🗺️ Creating sitemap.xml..."
  cat > dist/sitemap.xml << EOL
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://teraboxdownloaderpro.com/</loc>
    <lastmod>$(date -u +"%Y-%m-%dT%H:%M:%SZ")</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://teraboxdownloaderpro.com/about</loc>
    <lastmod>$(date -u +"%Y-%m-%dT%H:%M:%SZ")</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://teraboxdownloaderpro.com/contact</loc>
    <lastmod>$(date -u +"%Y-%m-%dT%H:%M:%SZ")</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://teraboxdownloaderpro.com/blog</loc>
    <lastmod>$(date -u +"%Y-%m-%dT%H:%M:%SZ")</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://teraboxdownloaderpro.com/privacy-policy</loc>
    <lastmod>$(date -u +"%Y-%m-%dT%H:%M:%SZ")</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://teraboxdownloaderpro.com/terms</loc>
    <lastmod>$(date -u +"%Y-%m-%dT%H:%M:%SZ")</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://teraboxdownloaderpro.com/disclaimer</loc>
    <lastmod>$(date -u +"%Y-%m-%dT%H:%M:%SZ")</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>
EOL
fi

# Verify the build
echo "✅ Build completed successfully!"
echo "📂 The optimized build is available in the 'dist' directory"
echo "🌐 You can preview the build using 'npm run preview'"

# Instructions for deployment
echo ""
echo "📝 To deploy, upload the contents of the 'dist' directory to your web server"
echo "🔎 Your site is now SEO-optimized with pre-rendered HTML content!"
echo "🔬 Verify by viewing the page source in your browser to ensure all content is properly rendered" 