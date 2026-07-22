const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf-8').split(/\r?\n/);
lines.forEach((l, i) => {
    if (l.includes('finish-screen')) {
        console.log(i + ':', l.trim());
    }
});
