export const optimizeImage = (url, width = 800) => {
  if (!url) return "/placeholder.png";
  if (!url.includes("cloudinary.com")) return url;

  // Split the URL at the "upload/" segment
  const [base, file] = url.split("/upload/");
  
  // Inject transformation parameters:
  // w_${width}  -> Resize to specific width
  // f_auto      -> Convert to WebP/AVIF automatically
  // q_auto      -> Smart compression (no visual quality loss)
  return `${base}/upload/w_${width},f_auto,q_auto/${file}`;
};