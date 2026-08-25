const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const tokens = {};
const adminPath = path.resolve('src');

walkDir(adminPath, (filePath) => {
  if (filePath.endsWith('.jsx') || filePath.endsWith('.js') || filePath.endsWith('.css')) {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = content.match(/var\(--[a-zA-Z0-9-]+\)/g);
    if (matches) {
      matches.forEach(match => {
        tokens[match] = (tokens[match] || 0) + 1;
      });
    }
  }
});

console.log('--- Token Audit ---');
Object.entries(tokens).sort((a,b) => b[1] - a[1]).forEach(([token, count]) => {
  console.log(`${token}: ${count}`);
});
