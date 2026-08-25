const fs = require('fs');
let content = fs.readFileSync('src/app/App.jsx', 'utf8');
content = content.replace(/from \"\.\//g, 'from \"../');
content = content.replace(/import CheckoutGuard from \"\.\.\/CheckoutGuard\";/g, 'import CheckoutGuard from \"./guards/CheckoutGuard\";');
fs.writeFileSync('src/app/App.jsx', content, 'utf8');
