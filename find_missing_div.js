const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf-8');
const lines = html.split(/\r?\n/);
let inImport = false;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('id="import-screen"')) inImport = true;
    if (inImport && lines[i].includes('id="preview-screen"')) {
        console.log('preview-screen found at line', i);
        console.log(lines.slice(i-15, i+2).join('\n'));
        break;
    }
}
