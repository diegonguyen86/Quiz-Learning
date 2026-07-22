const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');
const faviconHtml = '<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎓</text></svg>">';
html = html.replace('<title>', faviconHtml + '\n    <title>');
fs.writeFileSync('index.html', html);
console.log('Added favicon');
