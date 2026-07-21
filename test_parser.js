const fs = require('fs');

// The test inputs
const testInput = `
1. This is standard question
A. Opt A
B. Opt B
C. Opt C
D. Opt D
Đáp án: B
Giải thích: B is correct

2. This is repeated option question (no blank lines)
A. States.
B. Regions.
C. Cities.
D. People.
A. States.
B. Regions.
C. Cities.
3. This is question with parenthesis and just letter as answer
A) One
B) Two
C) Three
C
Giải thích: Three is the magic number.
Line 2 of explanation.
4. Next question without number, right after explanation
A. Yes
B. No
A

5. Random missing answer question
A. Foo
B. Bar

6. Answer has typo or strange format like 'Chọn: A, c'
A. Apple
B. Banana
C. Cherry
Chọn: A, c
`;

// Simulate the parser
const lines = testInput.split('\n').map(l => l.trim()).filter(l => l !== '');
let questionsData = [];
let currentQ = { textBlock: [], options: [], postOptions: [] };
let phase = 'text';

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let isOption = /^([A-H])[\.\)]\s/i.test(line) || /^([A-H])[\.\)]$/i.test(line);

    if (phase === 'text') {
        if (isOption) {
            phase = 'options';
            currentQ.options.push(line);
        } else {
            currentQ.textBlock.push(line);
        }
    } else if (phase === 'options') {
        if (isOption) {
            let currentOptLetter = line.match(/^([A-H])/i)[1].toUpperCase();
            let prevOptLetter = currentQ.options[currentQ.options.length - 1].match(/^([A-H])/i)[1].toUpperCase();
            
            if (currentOptLetter > prevOptLetter) {
                currentQ.options.push(line);
            } else {
                phase = 'post';
                currentQ.postOptions.push(line);
            }
        } else {
            phase = 'post';
            currentQ.postOptions.push(line);
        }
    } else if (phase === 'post') {
        if (isOption) {
            let optLetter = line.match(/^([A-H])/i)[1].toUpperCase();
            if (optLetter === 'A') {
                let isAnswerNotation = line.trim().length <= 3;
                let isRepeatedOption = currentQ.options.some(opt => opt.replace(/\s+/g, '').toLowerCase() === line.replace(/\s+/g, '').toLowerCase());
                
                if (isRepeatedOption || isAnswerNotation) {
                    currentQ.postOptions.push(line);
                } else {
                    let newQText = [];
                    let cleanPost = [];
                    let hitAnswerOrExpl = false;
                    
                    for(let k = currentQ.postOptions.length - 1; k >= 0; k--) {
                        let txt = currentQ.postOptions[k];
                        let lower = txt.toLowerCase();
                        
                        let isAnsFormat = /^([A-H](?:\s*,\s*[A-H])*)$/i.test(txt) || /^(?:đáp án|kết quả|answer|chọn)[:\s]*([A-H])/i.test(lower) || /^[A-H][\.\)]?$/i.test(txt);
                        let isRepeated = currentQ.options.some(opt => opt.replace(/\s+/g, '').toLowerCase() === txt.replace(/\s+/g, '').toLowerCase());
                        let isExpl = lower.includes('giải thích:');
                        
                        if (isAnsFormat || isRepeated || isExpl) {
                            hitAnswerOrExpl = true;
                        }
                        
                        if (!hitAnswerOrExpl) {
                            newQText.unshift(txt);
                        } else {
                            cleanPost.unshift(txt);
                        }
                    }
                    
                    let hasExplInClean = cleanPost.some(t => t.toLowerCase().includes('giải thích:'));
                    if (hasExplInClean) {
                        let actualNewQText = [];
                        let stillExpl = true;
                        for(let txt of newQText) {
                            if (stillExpl && (/^câu\s*\d+:/i.test(txt) || /^\d+[\.\)]/i.test(txt) || txt.includes('?'))) {
                                stillExpl = false;
                            }
                            if (stillExpl) {
                                cleanPost.push(txt);
                            } else {
                                actualNewQText.push(txt);
                            }
                        }
                        newQText = actualNewQText;
                    }
                    
                    currentQ.postOptions = cleanPost;
                    questionsData.push(currentQ);
                    
                    currentQ = { textBlock: newQText, options: [line], postOptions: [] };
                    phase = 'options';
                }
            } else {
                currentQ.postOptions.push(line);
            }
        } else {
            currentQ.postOptions.push(line);
        }
    }
}
if (currentQ.options.length > 0) questionsData.push(currentQ);

let parsedQs = [];
questionsData.forEach((item, index) => {
    if (item.options.length < 2) return;
    
    let explanation = "";
    let leftOverText = [];
    let ansLetters = [];

    item.postOptions.forEach(txt => {
        let lower = txt.toLowerCase();
        let m1 = txt.match(/^([A-H](?:\s*,\s*[A-H])*)$/i);
        let m2 = txt.match(/^(?:đáp án|kết quả|answer|chọn)[:\s]*([A-H](?:\s*,\s*[A-H])*)/i);
        let m3 = txt.match(/^[A-H][\.\)]?$/i);
        let isAnsFormat = m1 || m2 || m3;
        
        let isRepeated = item.options.some(opt => opt.replace(/\s+/g, '').toLowerCase() === txt.replace(/\s+/g, '').toLowerCase());

        if (lower.includes('giải thích:')) {
            explanation = txt;
        } else if (isRepeated) {
            let letterMatch = txt.match(/^([A-H])/i);
            if (letterMatch) {
                let c = letterMatch[1].toUpperCase();
                if (!ansLetters.includes(c)) ansLetters.push(c);
            }
        } else if (isAnsFormat) {
            let matchedStr = (m1 ? m1[1] : (m2 ? m2[1] : txt));
            let chars = matchedStr.toUpperCase().split(',').map(s => s.trim().replace(/[\.\)]/g, ''));
            chars.forEach(c => {
                if (c.match(/^[A-H]$/) && !ansLetters.includes(c)) ansLetters.push(c);
            });
        } else {
            leftOverText.push(txt);
        }
    });

    if (item.textBlock.length === 0 && leftOverText.length > 0) {
        item.textBlock = leftOverText;
    }

    let qText = item.textBlock.length > 0 ? item.textBlock.join(' | ') : 'Câu hỏi ' + (index + 1);
    let correctIndexes = [];
    
    ansLetters.forEach(letter => {
        let idx = item.options.findIndex(o => o.toUpperCase().startsWith(letter + ".") || o.toUpperCase().startsWith(letter + ")"));
        if (idx !== -1 && !correctIndexes.includes(idx)) correctIndexes.push(idx);
    });
    
    if (correctIndexes.length === 0 && leftOverText.length > 0) {
        let possibleAnsLine = leftOverText.join(' ').toUpperCase();
        item.options.forEach((opt, idx) => {
            let optLetterMatch = opt.match(/^([A-H])/i);
            if (optLetterMatch) {
                let letter = optLetterMatch[1].toUpperCase();
                let regex = new RegExp(`\\b${letter}\\b`, 'i');
                if (regex.test(possibleAnsLine)) {
                    correctIndexes.push(idx);
                }
            }
        });
    }
    
    parsedQs.push({ q: qText, o: item.options, a: correctIndexes, e: explanation });
});
console.log(JSON.stringify(parsedQs, null, 2));
