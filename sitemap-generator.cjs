const { SitemapStream, streamToPromise } = require('sitemap');
const { createWriteStream } = require('fs');
const { Readable } = require('stream');

// Your website's domain
const hostname = 'https://www.devidaura.com';

// An array of your app's routes
const links = [
    { url: '/', changefreq: 'daily', priority: 1.0 },
    { url: '/products', changefreq: 'weekly', priority: 0.8 },
    { url: '/myorder', changefreq: 'monthly', priority: 0.5 },
    { url: '/wishlist', changefreq: 'monthly', priority: 0.5 },
    { url: '/cart', changefreq: 'monthly', priority: 0.5 },
    { url: '/myaccount', changefreq: 'monthly', priority: 0.5 },
    { url: '/contact', changefreq: 'monthly', priority: 0.5 },
    { url: '/privacy', changefreq: 'yearly', priority: 0.3 },
    { url: '/terms', changefreq: 'yearly', priority: 0.3 },
    // Add other static routes here
];

// The destination file
const destination = './public/sitemap.xml';

// Create a stream to write to
const sitemapStream = new SitemapStream({ hostname });
const writeStream = createWriteStream(destination);

console.log('Starting sitemap generation...');

// Pipe the stream to the file
sitemapStream.pipe(writeStream);

// Create a readable stream from your links and pipe it to the sitemap stream
const linkStream = Readable.from(links);
linkStream.pipe(sitemapStream);

// When the stream is finished, log a success message
streamToPromise(sitemapStream).then(() => {
    console.log('Sitemap generated successfully in ./public/sitemap.xml!');
}).catch((error) => {
    console.error('Sitemap generation failed:', error);
});