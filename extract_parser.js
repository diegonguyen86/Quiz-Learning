const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');
let match = html.substring(html.indexOf('let questionsData = [];'), html.indexOf('if (parsedQs.length > 0) {'));
let logic = `const fs = require('fs');
let text = fs.readFileSync('bra.txt', 'utf-8');
let lines = text.split('\\n').map(l => l.trim()).filter(l => l !== '');
let editQuizId = null;
let oldQuestions = [];
` + match + `
let merged = parsedQs.filter(q => {
    return q.e && (q.e.match(/[A-Z]\\./g) || []).length > 2;
});
console.log('Merged in explanations:', merged.length);
merged.forEach(m => console.log('Merged Q:', m.q.substring(0, 50)));

let longQs = parsedQs.filter(q => q.q.length > 500);
console.log('Very long questions:', longQs.length);
longQs.forEach(m => console.log('Long Q:', m.q.substring(0, 100)));
`;
fs.writeFileSync('test_parser_run.js', logic);
