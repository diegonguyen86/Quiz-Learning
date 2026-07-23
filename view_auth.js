const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf-8');
const lines = html.split(/\r?\n/);
const idx = lines.findIndex(l => l.includes('id="auth-screen"'));
if (idx !== -1) {
    console.log(lines.slice(idx, idx + 20).join('\n'));
}
