const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf-8');
console.log('Has quiz-list:', html.includes('id="quiz-list"'));
