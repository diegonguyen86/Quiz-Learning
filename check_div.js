const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf-8');
const lines = html.split(/\r?\n/);
let openDivs = 0;
for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.includes('<div id="import-screen"')) {
        openDivs = 1;
        console.log('import-screen starts at', i);
    } else if (openDivs > 0) {
        let opens = (l.match(/<div/g) || []).length;
        let closes = (l.match(/<\/div>/g) || []).length;
        openDivs += opens - closes;
        if (openDivs <= 0) {
            console.log('import-screen ends at', i, 'with openDivs', openDivs);
            break;
        }
    }
}
