let text = `436. Sky is blue.
C. General information about particular attributes and benefits of the brand and specific information about the
function of the product or service
D. General information about the function of the product or service and specific information about
particular attributes and benefits of the brand
Đáp án: C
437. Grass is green.
A. True
B. False`;

let lines = text.split('\n');
let questionsData = [];
let currentQ = { textBlock: [], options: [], postOptions: [] };
let phase = 'text';

for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;
    let isOption = /^([A-H])[\.\)]\s/i.test(line) || /^([A-H])[\.\)]$/i.test(line);

    if (phase === 'text') {
        if (isOption) { phase = 'options'; currentQ.options.push(line); }
        else currentQ.textBlock.push(line);
    } else if (phase === 'options') {
        if (isOption) {
            let currentOptLetter = line.match(/^([A-H])/i)[1].toUpperCase();
            let prevOptLetter = currentQ.options[currentQ.options.length - 1].match(/^([A-H])/i)[1].toUpperCase();
            if (currentOptLetter > prevOptLetter) currentQ.options.push(line);
            else { phase = 'post'; currentQ.postOptions.push(line); }
        } else {
            let isContinuation = false;
            for(let j = i + 1; j < lines.length; j++) {
                let nextLine = lines[j].trim();
                if (!nextLine) continue;
                let isNextOption = /^([A-H])[\.\)]\s/i.test(nextLine) || /^([A-H])[\.\)]$/i.test(nextLine);
                let isNewQ = /^câu\s*\d+:/i.test(nextLine) || /^\d+[\.\)]/i.test(nextLine);
                let isExpl = nextLine.toLowerCase().includes('giải thích:');
                let m1 = nextLine.match(/^([A-H](?:\s*,\s*[A-H])*)$/i);
                let m2 = nextLine.match(/^(?:đáp án|kết quả|answer|chọn)[:\s]*([A-H](?:\s*,\s*[A-H])*)/i);
                
                if (isNewQ || isExpl || m1 || m2) break;
                if (isNextOption) {
                    let nextOptLetter = nextLine.match(/^([A-H])/i)[1].toUpperCase();
                    if (nextOptLetter !== 'A') isContinuation = true;
                    break;
                }
            }
            
            let lower = line.toLowerCase();
            let m1 = line.match(/^([A-H](?:\s*,\s*[A-H])*)$/i);
            let m2 = line.match(/^(?:đáp án|kết quả|answer|chọn)[:\s]*([A-H](?:\s*,\s*[A-H])*)/i);
            let m3 = line.match(/^[A-H][\.\)]?$/i);
            let isAnsFormat = m1 || m2 || m3;
            let isExpl = lower.includes('giải thích:');
            let isNewQ = /^câu\s*\d+:/i.test(line) || /^\d+[\.\)]/i.test(line);
            let startsWithLowercase = /^\p{Ll}/u.test(line);

            if (!isAnsFormat && !isExpl && !isNewQ && (isContinuation || startsWithLowercase)) {
                currentQ.options[currentQ.options.length - 1] += " " + line;
            } else {
                phase = 'post';
                currentQ.postOptions.push(line);
            }
        }
    } else if (phase === 'post') {
        if (isOption) {
            let currentOptLetter = line.match(/^([A-H])/i)[1].toUpperCase();
            if (currentOptLetter === 'A') {
                let newQText = [];
                let cleanPost = [];
                let hitAnswerOrExpl = false;

                for(let k = currentQ.postOptions.length - 1; k >= 0; k--) {
                    let txt = currentQ.postOptions[k];
                    let lower = txt.toLowerCase();
                    let m1 = txt.match(/^([A-H](?:\s*,\s*[A-H])*)$/i);
                    let m2 = txt.match(/^(?:đáp án|kết quả|answer|chọn)[:\s]*([A-H](?:\s*,\s*[A-H])*)/i);
                    let m3 = txt.match(/^[A-H][\.\)]?$/i);
                    let isAnsFormat = m1 || m2 || m3;
                    
                    let isRepeated = currentQ.options.some(opt => opt.replace(/\s+/g, '').toLowerCase() === txt.replace(/\s+/g, '').toLowerCase());
                    let isExpl = lower.includes('giải thích:');
                    
                    if (isAnsFormat || isRepeated || isExpl) { hitAnswerOrExpl = true; }
                    
                    if (!hitAnswerOrExpl) newQText.unshift(txt);
                    else cleanPost.unshift(txt);
                }

                let isOnlyPrefix = newQText.length > 0 && newQText.every(t => /^(?:đáp án|kết quả|answer|chọn)[:\s]*$/i.test(t.trim()));
                let isRepeatedOptA = currentQ.options.some(opt => opt.replace(/\s+/g, '').toLowerCase() === line.replace(/\s+/g, '').toLowerCase());
                
                let isNewQuestion = false;
                if (newQText.length > 0 && !isOnlyPrefix) {
                    isNewQuestion = true;
                } else if (!isRepeatedOptA && newQText.length === 0) {
                    isNewQuestion = true;
                }
                
                if (isNewQuestion) {
                    currentQ.postOptions = cleanPost;
                    questionsData.push(currentQ);
                    currentQ = { textBlock: newQText, options: [line], postOptions: [] };
                    phase = 'options';
                } else {
                    currentQ.postOptions.push(line);
                }
            } else {
                currentQ.postOptions.push(line);
            }
        } else {
            if (/^câu\s*\d+:/i.test(line) || /^\d+[\.\)]/i.test(line)) {
                questionsData.push(currentQ);
                currentQ = { textBlock: [line], options: [], postOptions: [] };
                phase = 'text';
            } else {
                currentQ.postOptions.push(line);
            }
        }
    }
}
questionsData.push(currentQ);
console.log(JSON.stringify(questionsData, null, 2));
