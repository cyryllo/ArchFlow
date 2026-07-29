const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '../../fossflow-app/build');
const dest = path.join(__dirname, '../resources/app-build');

if (!fs.existsSync(src)) {
  console.error(`Nie znaleziono ${src} - najpierw uruchom "npm run build:app" w katalogu głównym.`);
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });

console.log(`Skopiowano ${src} -> ${dest}`);
