const { SitemapStream, streamToPromise } = require('sitemap');
const { createWriteStream } = require('fs');
const { Readable } = require('stream');
require('dotenv').config(); // Load environment variables

// 1. CONFIGURATION
const hostname = 'https://www.devidaura.com';
const BACKEND_URL = process.env.VITE_BACKEND_URL?.replace(/\/$/, "") || 'http://localhost:5000';
const destination = './public/sitemap.xml';

// 2. STATIC ROUTES (Cleaned: Removed Cart, Account, Orders)
const staticLinks = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/products', changefreq: 'daily', priority: 0.9 },
  { url: '/custom-combo', changefreq: 'weekly', priority: 0.8 },
  { url: '/about', changefreq: 'monthly', priority: 0.7 },
  { url: '/contact', changefreq: 'monthly', priority: 0.6 },
  { url: '/privacy', changefreq: 'yearly', priority: 0.3 },
  { url: '/terms', changefreq: 'yearly', priority: 0.3 },
];

async function generateSitemap() {
  console.log('⏳ Starting sitemap generation...');

  try {
    // 3. FETCH DYNAMIC PRODUCTS FROM BACKEND
    console.log(`🔍 Fetching products from ${BACKEND_URL}...`);
    const response = await fetch(`${BACKEND_URL}/api/products`);
    const productsData = await response.json();
    
    // Handle array or { data: [] } structure
    const productList = Array.isArray(productsData) ? productsData : (productsData.data || []);

    // 4. MAP PRODUCTS TO SITEMAP LINKS
    const productLinks = productList.map(product => ({
      // ⚠️ Check if your route is /product/:id or /product/:slug
      url: `/product/${product.id}`,
      changefreq: 'weekly',
      priority: 0.8
    }));

    console.log(`✅ Found ${productLinks.length} products.`);

    // 5. COMBINE ALL LINKS
    const allLinks = [...staticLinks, ...productLinks];

    // 6. CREATE STREAM & WRITE
    const stream = new SitemapStream({ hostname });
    const writeStream = createWriteStream(destination);

    // Pipe results to file
    Readable.from(allLinks).pipe(stream).pipe(writeStream);

    // Wait for completion
    await streamToPromise(stream);
    console.log(`🎉 Sitemap successfully generated at ${destination}`);

  } catch (error) {
    console.error('❌ Sitemap generation failed:', error);
    process.exit(1);
  }
}

generateSitemap();