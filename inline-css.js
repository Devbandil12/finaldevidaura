import fs from 'node:fs';
import path from 'node:path';
import { glob } from 'glob';

// Configuration
const DIST_DIR = 'dist';

async function inlineCss() {
  const htmlFiles = await glob(`${DIST_DIR}/**/*.html`);

  if (htmlFiles.length === 0) {
    console.log('❌ No HTML files found to process.');
    return;
  }

  for (const file of htmlFiles) {
    let html = fs.readFileSync(file, 'utf-8');
    
    // 1. Find the main CSS file linked in the HTML
    // Looks for: <link rel="stylesheet" crossorigin href="/assets/index-XXXX.css">
    const linkTagRegex = /<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/;
    const match = html.match(linkTagRegex);

    if (!match) {
      console.log(`⚠️ No CSS link found in ${file}`);
      continue;
    }

    const cssPathRelative = match[1]; // e.g., /assets/index-By7X.css
    const cssPath = path.join(DIST_DIR, cssPathRelative);

    if (fs.existsSync(cssPath)) {
      // 2. Read the CSS content
      const cssContent = fs.readFileSync(cssPath, 'utf-8');

      // 3. Replace the <link> tag with a <style> tag containing the CSS
      const styleTag = `<style>${cssContent}</style>`;
      html = html.replace(match[0], styleTag);

      // 4. Save the updated HTML
      fs.writeFileSync(file, html);
      console.log(`✅ Inlined CSS into ${file} (${(cssContent.length / 1024).toFixed(2)} KB)`);
    } else {
      console.log(`⚠️ CSS file not found: ${cssPath}`);
    }
  }
}

inlineCss();