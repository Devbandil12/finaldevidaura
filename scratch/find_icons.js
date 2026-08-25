const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\LENOVO\\Desktop\\Devid Aura F\\finaldevidaura\\src\\components\\admin';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const matches = content.match(/className="[^"]*?(bg-[a-z]+-\d+\/\d+\s+text-[a-z]+-\d+|bg-[a-z]+-\d+\s+text-[a-z]+-\d+)[^"]*?"/g);
  if (matches) {
    console.log(`\n--- ${file} ---`);
    matches.forEach(m => console.log(m));
  }
}
