const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf-8');
const lines = html.split(/\r?\n/);
lines.forEach((l, i) => {
    if (l.includes('<div id="analytics-modal"')) console.log(i + ': ' + l.trim());
});
