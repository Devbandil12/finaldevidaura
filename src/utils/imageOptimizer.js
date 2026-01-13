/* src/utils/imageOptimizer.js */

// 1. Define standard sizes for your app here.
// This acts as a "Single Source of Truth" for image sizes.
const SIZES = {
  thumbnail: 150,  // For cart items, tiny previews
  card: 400,       // For product grid (Home, Products page)
  feature: 600,    // For "Featured Product" sections
  hero: 1200,      // For full-width banners
  zoom: 1600,      // For Product Detail zoom view
  original: null   // No resizing
};

export const optimizeImage = (url, size = 'card') => {
  // 1. Safety Checks
  if (!url) return "/placeholder.png";
  if (typeof url !== 'string') return "/placeholder.png";
  if (!url.includes("cloudinary.com")) return url;

  // 2. Determine Width
  // If user passes a string ('card'), use preset. 
  // If user passes a number (500), use that number.
  let width = typeof size === 'number' ? size : (SIZES[size] || SIZES.card);

  // 3. Handle URLs that might already have transformations
  // We want to insert our params right after "/upload/"
  const splitUrl = url.split("/upload/");
  
  // If split fails (url format weird), return original
  if (splitUrl.length < 2) return url;

  const [base, file] = splitUrl;

  // 4. Construct Transformation String
  // w_${width}  : Resize
  // f_auto      : WebP/AVIF auto-format
  // q_auto      : Smart compression
  // dpr_auto    : Delivers 2x res for Retina screens (iphones/macs)
  // c_limit     : "Limit" ensures we don't upscale a tiny image to be blurry
  const params = [
    width ? `w_${width}` : '', 
    'f_auto',
    'q_auto',
    'dpr_auto',
    'c_limit'
  ].filter(Boolean).join(',');

  return `${base}/upload/${params}/${file}`;
};

/**
 * Helper to generate a srcSet string for responsive <img> tags
 * Usage: <img src={src} srcSet={generateSrcSet(src)} />
 */
export const generateSrcSet = (url) => {
  if (!url || !url.includes("cloudinary.com")) return undefined;
  
  // Generates 3 versions: 400w, 800w, 1200w
  const sizes = [400, 800, 1200];
  
  return sizes.map(w => {
    return `${optimizeImage(url, w)} ${w}w`;
  }).join(', ');
};