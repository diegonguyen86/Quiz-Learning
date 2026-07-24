const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf-8');
const lines = html.split(/\r?\n/);
const start = lines.findIndex(l => l.includes('id="import-screen"'));
const end = lines.findIndex((l, i) => i > start && l.includes('<!-- Close import-screen -->'));
console.log(lines.slice(start, end + 1).join('\n'));
