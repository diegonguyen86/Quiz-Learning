const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf-8');
const lines = html.split(/\r?\n/);
let openDivs = 0;
let inImport = false;
for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.includes('<div id="import-screen"')) {
        inImport = true;
    }
    if (inImport) {
        let opens = (l.match(/<div/g) || []).length;
        let closes = (l.match(/<\/div>/g) || []).length;
        openDivs += opens - closes;
        console.log(i + ': (' + openDivs + ') ' + l.trim());
    }
    if (inImport && l.includes('id="preview-screen"')) break;
}
