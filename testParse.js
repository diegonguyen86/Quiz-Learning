const text = "bbbbbbbbbbs\nA. aeqw\nB. qeqsd\nB";
const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
let questionsData = [];
let currentQ = { textBlock: [], options: [], postOptions: [] };
let phase = 'text';

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let isOption = /^([A-H])[\.\)](?:\s|$)/i.test(line) || (/^([A-H])[\.\)]/i.test(line) && !/^([A-H])[\.\)][a-z][\.\)]/i.test(line) && !/^e\.g\./i.test(line));

    if (phase === 'text') {
        if (isOption) { phase = 'options'; currentQ.options.push(line); }
        else { currentQ.textBlock.push(line); }
    } else if (phase === 'options') {
        if (isOption) {
            let currentOptLetter = line.match(/^([A-H])/i)[1].toUpperCase();
            let prevOptLetter = currentQ.options[currentQ.options.length - 1].match(/^([A-H])/i)[1].toUpperCase();
            if (currentOptLetter > prevOptLetter) currentQ.options.push(line);
            else { phase = 'post'; currentQ.postOptions.push(line); }
        } else {
            let isContinuation = false;
            let lower = line.toLowerCase();
            let m1 = line.match(/^([A-H](?:\s*,?\s*[A-H])*)$/i);
            let m2 = line.match(/^(?:dáp án|k?t qu?|answer|ch?n)[:\s]*([A-H](?:\s*,?\s*[A-H])*)/i);
            let m3 = line.match(/^[A-H][\.\)]?$/i);
            let isAnsFormat = m1 || m2 || m3;
            let isExpl = lower.includes('gi?i thích:');
            let isNewQ = /^câu\s*\d+:/i.test(line) || /^\d+[\.\)]/i.test(line);
            let startsWithLowercase = /^\p{Ll}/u.test(line);
            if (!isAnsFormat && !isExpl && !isNewQ && (isContinuation || startsWithLowercase)) {
                currentQ.options[currentQ.options.length - 1] += " " + line;
            } else { phase = 'post'; currentQ.postOptions.push(line); }
        }
    } else if (phase === 'post') {
        currentQ.postOptions.push(line);
    }
}
if (currentQ.options.length > 0) questionsData.push(currentQ);

function checkIsRepeatedFuzzy(txt, options) {
    let isRep = options.some(opt => opt.replace(/\s+/g, '').toLowerCase() === txt.replace(/\s+/g, '').toLowerCase());
    if (isRep) return true;
    let m = txt.match(/^([A-H])[\.\)](?:\s+|$)(.*)/i);
    if (m) {
        let letter = m[1].toUpperCase();
        let restTxt = m[2].replace(/\s+/g, '').toLowerCase();
        let matchingOpt = options.find(opt => opt.toUpperCase().startsWith(letter + ".") || opt.toUpperCase().startsWith(letter + ")"));
        if (matchingOpt) {
            let optRest = matchingOpt.substring(2).replace(/\s+/g, '').toLowerCase();
            if (restTxt === '' || optRest.includes(restTxt) || restTxt.includes(optRest)) return true;
            let minLen = Math.min(optRest.length, restTxt.length);
            let matchCount = 0;
            for(let i=0; i<minLen; i++) {
                if (optRest[i] === restTxt[i]) matchCount++;
                else break;
            }
            if (matchCount >= 15 || (minLen > 0 && matchCount === minLen)) return true;
        }
    }
    return false;
}

let parsedQs = [];
questionsData.forEach((item, index) => {
    if (item.options.length < 2) return;
    
    let explanationLines = [];
    let inExplanation = false;
    let leftOverText = [];
    let ansLetters = [];

    item.postOptions.forEach(txt => {
        let lower = txt.toLowerCase();
        let m1 = txt.match(/^([A-H](?:\s*,?\s*[A-H])*)$/i);
        let m2 = txt.match(/^(?:dáp án|k?t qu?|answer|ch?n)[:\s]*([A-H](?:\s*,?\s*[A-H])*)/i);
        let m3 = txt.match(/^[A-H][\.\)]?$/i);
        let isAnsFormat = m1 || m2 || m3;
        
        let isRepeated = checkIsRepeatedFuzzy(txt, item.options);

        if (lower.includes('gi?i thích:')) {
            inExplanation = true;
            explanationLines.push(txt);
        } else if (isRepeated) {
            let letterMatch = txt.match(/^([A-H])/i);
            if (letterMatch) {
                let letter = letterMatch[1].toUpperCase();
                if (!ansLetters.includes(letter)) ansLetters.push(letter);
            }
        } else if (isAnsFormat) {
            let matchStr = (m1 ? m1[1] : (m2 ? m2[1] : m3[0]));
            let parts = matchStr.split(',');
            parts.forEach(p => {
                let letter = p.trim().toUpperCase();
                if(letter && !ansLetters.includes(letter)) ansLetters.push(letter);
            });
        }
    });

    let ansArr = [];
    if (ansLetters.length > 0) {
        ansLetters.forEach(lt => {
            let letter = lt.toUpperCase();
            let charCode = letter.charCodeAt(0) - 65;
            if (charCode >= 0 && charCode < item.options.length && !ansArr.includes(charCode)) {
                ansArr.push(charCode);
            }
        });
    }

    let isMissingAnswer = ansArr.length === 0;
    let correctIndexes = [];
    ansLetters.forEach(letter => {
        let idx = item.options.findIndex(o => o.toUpperCase().startsWith(letter + ".") || o.toUpperCase().startsWith(letter + ")"));
        if (idx !== -1 && !correctIndexes.includes(idx)) correctIndexes.push(idx);
    });

    let qText = item.textBlock.length > 0 ? item.textBlock.join('<br>') : "Câu h?i " + (index + 1);
    let explanation = explanationLines.join('<br>');
    parsedQs.push({ q: qText, o: item.options, a: correctIndexes, e: explanation });
});

console.log(JSON.stringify(parsedQs, null, 2));
