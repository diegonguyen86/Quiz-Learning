const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf-8');
const lines = html.split(/\r?\n/);
let stack = [];
for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.match(/<div|<main/)) {
        let m = l.match(/id="([^">]+)"/);
        stack.push(m ? m[1] : 'unknown');
    }
    if (l.includes('id="quiz-screen"')) {
        console.log('Parents of quiz-screen:', stack);
    }
    if (l.includes('id="preview-screen"')) {
        console.log('Parents of preview-screen:', stack);
    }
    if (l.match(/<\/div|<\/main/)) {
        stack.pop();
    }
}
