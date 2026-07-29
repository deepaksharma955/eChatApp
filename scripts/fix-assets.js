const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distDir, 'index.html');

const flatDir = path.join(distDir, 'fonts');
if (!fs.existsSync(flatDir)) fs.mkdirSync(flatDir, { recursive: true });

function copyAssets(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) copyAssets(full);
    else if (/\.(ttf|woff|woff2|otf|png)$/i.test(e.name)) {
      const dest = path.join(flatDir, e.name);
      if (!fs.existsSync(dest)) fs.copyFileSync(full, dest);
    }
  }
}

copyAssets(path.join(distDir, 'assets'));

const jsDir = path.join(distDir, '_expo', 'static', 'js', 'web');
if (fs.existsSync(jsDir)) {
  const files = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const fp = path.join(jsDir, file);
    let content = fs.readFileSync(fp, 'utf-8');
    const original = content;
    content = content.replace(/\/assets\/node_modules\/(?:@[^\/]+\/)?[^\/]+\/[^"']*?\/?([^\/"']+\.[a-z]+)/g, '/fonts/$1');
    content = content.replace(/node_modules\/(?:@[^\/]+\/)?[^\/]+\/[^"']*?\/?([^\/"']+\.[a-z]+)/g, '/fonts/$1');
    if (content !== original) {
      fs.writeFileSync(fp, content, 'utf-8');
      console.log(`Updated JS: ${file}`);
    }
  }
}

if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf-8');

  const cdnFonts = `<style id="cdn-fonts">
@font-face { font-family: 'material-community'; src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf') format('truetype'); }
@font-face { font-family: 'Material Icons'; src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf') format('truetype'); }
@font-face { font-family: 'Ionicons'; src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf') format('truetype'); }
@font-face { font-family: 'Feather'; src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/Feather.ttf') format('truetype'); }
</style>`;

  html = html.replace('</head>', `${cdnFonts}\n</head>`);
  fs.writeFileSync(indexPath, html, 'utf-8');
  console.log('CDN fonts added to index.html');
}

console.log('Fix complete.');
