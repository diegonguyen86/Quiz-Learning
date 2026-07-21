const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');
let match = html.substring(html.indexOf('let questionsData = [];'), html.indexOf('if (parsedQs.length > 0) {'));

let script = `
const fs = require('fs');
let text = fs.readFileSync('bra.txt', 'utf-8');
let lines = text.split('\\n').map(l => l.trim()).filter(l => l !== '');

function checkIsRepeatedFuzzy(txt, options) {
    let isRep = options.some(opt => opt.replace(/\\s+/g, '').toLowerCase() === txt.replace(/\\s+/g, '').toLowerCase());
    if (isRep) return true;
    let m = txt.match(/^([A-H])[\\.\\)](?:\\s+|$)(.*)/i);
    if (m) {
        let letter = m[1].toUpperCase();
        let restTxt = m[2].replace(/\\s+/g, '').toLowerCase();
        let matchingOpt = options.find(opt => opt.toUpperCase().startsWith(letter + ".") || opt.toUpperCase().startsWith(letter + ")"));
        if (matchingOpt) {
            let optRest = matchingOpt.substring(2).replace(/\\s+/g, '').toLowerCase();
            if (restTxt === '' || optRest.includes(restTxt) || restTxt.includes(optRest)) {
                return true;
            }
            let minLen = Math.min(optRest.length, restTxt.length);
            let matchCount = 0;
            for(let i=0; i<minLen; i++) {
                if (optRest[i] === restTxt[i]) matchCount++;
                else break;
            }
            if (matchCount >= 15 || (minLen > 0 && matchCount === minLen)) {
                return true;
            }
        }
    }
    return false;
}

${match.replace(/const isRepeatedOptA = /g, 'let isRepeatedOptA = ')}

let qs = parsedQs;
console.log('Total parsed questions:', qs.length);
let expectedCount = 1;
for (let i = 0; i < qs.length; i++) {
    let qText = qs[i].q;
    let match = qText.match(/^\\d+/);
    if (match) {
        let actualNum = parseInt(match[0]);
        if (actualNum !== expectedCount) {
            console.log('Missing question(s) before: ' + actualNum + ' (Expected: ' + expectedCount + ')');
            expectedCount = actualNum;
        }
    } else {
        // console.log('Question without number:', qText.substring(0, 50));
    }
    expectedCount++;
}
`;
fs.writeFileSync('check_missing.js', script);
