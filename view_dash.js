const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf-8');
const lines = html.split(/\r?\n/);
const idx = lines.findIndex(l => l.includes('id="dashboard-screen"'));
if (idx !== -1) {
    console.log(lines.slice(idx, idx + 30).join('\n'));
}
