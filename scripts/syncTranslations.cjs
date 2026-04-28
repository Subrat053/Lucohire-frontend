const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'src', 'translations');
const enPath = path.join(dir, 'en.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith('.json') || file === 'en.json') continue;
  const full = path.join(dir, file);
  const data = JSON.parse(fs.readFileSync(full, 'utf8'));
  const merged = { ...en, ...data };
  fs.writeFileSync(full, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
}

console.log('Translations synchronized.');
