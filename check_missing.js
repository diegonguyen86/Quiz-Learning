
const fs = require('fs');
let text = fs.readFileSync('bra.txt', 'utf-8');
let lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');

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

let questionsData = [];
            let currentQ = { textBlock: [], options: [], postOptions: [] };
            let phase = 'text'; // 'text', 'options', 'post'

            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];
                let isOption = /^([A-H])[\.\)](?:\s|$)/i.test(line) || (/^([A-H])[\.\)]/i.test(line) && !/^([A-H])[\.\)][a-z][\.\)]/i.test(line) && !/^e\.g\./i.test(line));

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
                        let isContinuation = false;
                        for(let j = i + 1; j < lines.length; j++) {
                            let nextLine = lines[j].trim();
                            if (!nextLine) continue;
                            let isNextOption = /^([A-H])[\.\)](?:\s|$)/i.test(nextLine) || (/^([A-H])[\.\)]/i.test(nextLine) && !/^([A-H])[\.\)][a-z][\.\)]/i.test(nextLine) && !/^e\.g\./i.test(nextLine));
                            let isNewQ = /^câu\s*\d+:/i.test(nextLine) || /^\d+[\.\)]/i.test(nextLine);
                            let isExpl = nextLine.toLowerCase().includes('giải thích:');
                            let m1 = nextLine.match(/^([A-H](?:\s*,?\s*[A-H])*)$/i);
                            let m2 = nextLine.match(/^(?:đáp án|kết quả|answer|chọn)[:\s]*([A-H](?:\s*,?\s*[A-H])*)/i);
                            
                            if (isNewQ || isExpl || m1 || m2) break;
                            if (isNextOption) {
                                let nextOptLetter = nextLine.match(/^([A-H])/i)[1].toUpperCase();
                                if (nextOptLetter !== 'A') isContinuation = true;
                                break;
                            }
                        }
                        
                        let lower = line.toLowerCase();
                        let m1 = line.match(/^([A-H](?:\s*,?\s*[A-H])*)$/i);
                        let m2 = line.match(/^(?:đáp án|kết quả|answer|chọn)[:\s]*([A-H](?:\s*,?\s*[A-H])*)/i);
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
                                let m1 = txt.match(/^([A-H](?:\s*,?\s*[A-H])*)$/i);
                                let m2 = txt.match(/^(?:đáp án|kết quả|answer|chọn)[:\s]*([A-H](?:\s*,?\s*[A-H])*)/i);
                                let m3 = txt.match(/^[A-H][\.\)]?$/i);
                                let isAnsFormat = m1 || m2 || m3;
                                
                                let isRepeated = checkIsRepeatedFuzzy(txt, currentQ.options);
                                let isExpl = lower.includes('giải thích:');
                                
                                let isOptContinuation = false;
                                if (txt.replace(/\s+/g, '').length > 3) {
                                    isOptContinuation = currentQ.options.some(opt => opt.replace(/\s+/g, '').toLowerCase().includes(txt.replace(/\s+/g, '').toLowerCase()));
                                }
                                
                                if (isAnsFormat || isRepeated || isExpl) { hitAnswerOrExpl = true; }
                                
                                if (!hitAnswerOrExpl) {
                                    if (isOptContinuation) {
                                        cleanPost.unshift(txt);
                                    } else {
                                        newQText.unshift(txt);
                                    }
                                } else {
                                    cleanPost.unshift(txt);
                                }
                            }

                            let isOnlyPrefix = newQText.length > 0 && newQText.every(t => /^(?:đáp án|kết quả|answer|chọn)[:\s]*$/i.test(t.trim()));
                            let isRepeatedOptA = checkIsRepeatedFuzzy(line, currentQ.options);
                            
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
                        currentQ.postOptions.push(line);
                    }
                }
            }
            if (currentQ.options.length > 0) questionsData.push(currentQ);

            let parsedQs = [];
            let hasError = false;
            let errorMsg = "";

            questionsData.forEach((item, index) => {
                if (item.options.length < 2) return;
                
                let explanationLines = [];
                let inExplanation = false;
                let leftOverText = [];
                let ansLetters = [];

                item.postOptions.forEach(txt => {
                    let lower = txt.toLowerCase();
                    let m1 = txt.match(/^([A-H](?:\s*,?\s*[A-H])*)$/i);
                    let m2 = txt.match(/^(?:đáp án|kết quả|answer|chọn)[:\s]*([A-H](?:\s*,?\s*[A-H])*)/i);
                    let m3 = txt.match(/^[A-H][\.\)]?$/i);
                    let isAnsFormat = m1 || m2 || m3;
                    
                    let isRepeated = checkIsRepeatedFuzzy(txt, item.options);

                    if (lower.includes('giải thích:')) {
                        inExplanation = true;
                        explanationLines.push(txt);
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
                        if (inExplanation) {
                            explanationLines.push(txt);
                        } else {
                            leftOverText.push(txt);
                        }
                    }
                });

                let explanation = explanationLines.join('<br>');

                if (item.textBlock.length === 0 && leftOverText.length > 0) {
                    item.textBlock = leftOverText;
                }

                let qText = item.textBlock.length > 0 ? item.textBlock.join('<br>') : `Câu hỏi ${index + 1}`;
                let correctIndexes = [];
                
                ansLetters.forEach(letter => {
                    let idx = item.options.findIndex(o => o.toUpperCase().startsWith(letter + ".") || o.toUpperCase().startsWith(letter + ")"));
                    if (idx !== -1 && !correctIndexes.includes(idx)) correctIndexes.push(idx);
                });
                
                // Fallback nếu người dùng gõ thiếu ký hiệu rõ ràng
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
                
                // Không block lỗi nữa vì người dùng có thể tự sửa ở màn hình Preview
                if (correctIndexes.length === 0) {
                    // Do nothing, pass it to preview
                }

                // TỰ ĐỘNG GHÉP LẠI GIẢI THÍCH CŨ NẾU KHÔNG DÙNG AI
                if (editQuizId && explanation === "") {
                    const oldMatch = oldQuestions.find(oq => oq.q.replace(/<br>/g, '').trim() === qText.replace(/<br>/g, '').trim());
                    if (oldMatch && oldMatch.e) {
                        explanation = oldMatch.e;
                    }
                }

                parsedQs.push({ q: qText, o: item.options, a: correctIndexes, e: explanation });
            });

            

let qs = parsedQs;
console.log('Total parsed questions:', qs.length);
let expectedCount = 1;
for (let i = 0; i < qs.length; i++) {
    let qText = qs[i].q;
    let match = qText.match(/^\d+/);
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
