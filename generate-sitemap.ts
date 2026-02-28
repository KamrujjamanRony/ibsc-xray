import { environment } from './src/environments/environment';
import fs from 'fs';
import axios from 'axios';

const domain = environment.webUrl;
const API_URL = environment.apiUrl;
const lastMod = new Date().toISOString().split('T')[0];

const staticRoutes = ['', '/products', '/about', '/contact'];

async function generate() {
  try {
    console.log('fetching dynamic routes from API...');

    // 1. Fetch Products for /product/:id
    const productRes = await axios.post(`${API_URL}/Product/Search`, { "companyID": 1 });
    const productRoutes = productRes.data.map((p: any) => `/product/${p.id}`);

    // 2. Fetch Items for /products/:itemId/:itemSlug
    const itemRes = await axios.post(`${API_URL}/Item/Search`, { "companyID": 1 });
    const itemRoutes = itemRes.data.map((item: any) => `/products/${item.id}/${item.description}`);

    const allRoutes = [...staticRoutes, ...productRoutes, ...itemRoutes];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${allRoutes.map(route => `
        <url>
          <loc>${domain}${route}</loc>
          <lastmod>${lastMod}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>${staticRoutes.includes(route) ? '1.0' : '0.7'}</priority>
        </url>
        `).join('')}
      </urlset>
    `;

    fs.writeFileSync('./public/sitemap.xml', sitemap);
    console.log(`✅ Success! Sitemap generated with ${allRoutes.length} total routes.`);
  } catch (error: any) {
    console.error('❌ Error fetching data for sitemap:', error?.message);
    // Fallback: generate static sitemap if API fails
    const fallbackSitemap = `...`; // (Simple static version)
    fs.writeFileSync('./public/sitemap.xml', fallbackSitemap);
  }
}

generate();