/**
 * File Parser & Interactive Quiz Preview System
 * Includes on-demand dynamic script loading for PDF, DOCX, and Tesseract OCR
 */
import { state } from './state.js';
import { db, generateShareCode } from './firebase-config.js';
import { showToast, showConfirm, showScreen } from './ui.js';
import { goToDashboard } from './dashboard.js';

// Dynamic lazy-loader for heavy parser libraries
export async function loadScript(src) {
    if (document.querySelector(`script[src="${src}"]`)) return;
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

export function openImportScreen() {
    state.editQuizId = null;
    state.hiddenAIText = '';
    
    const titleInput = document.getElementById('quiz-title-input');
    const rawInput = document.getElementById('raw-text-input');
    if (titleInput) titleInput.value = '';
    if (rawInput) {
        rawInput.value = '';
        rawInput.classList.remove('hidden');
    }
    
    const aiSuccess = document.getElementById('ai-success-msg');
    if (aiSuccess) aiSuccess.remove();

    document.getElementById('import-screen-title').innerHTML = '<i class="fas fa-cloud-upload-alt mr-2"></i>Tạo Bộ Đề Mới';
    document.getElementById('btn-parse').innerHTML = '<i class="fas fa-cogs mr-2"></i> Xử lý & Kiểm tra lại';
    showScreen('import-screen');
}

export async function editQuiz(quizId) {
    state.editQuizId = quizId;
    
    // Check if we already have it in cache for instant display
    let data = state.quizzesCache.find(q => q.id === quizId);
    
    if (!data || !data.questions) {
        try {
            const doc = await db.collection("users").doc(state.currentUser.uid).collection("my_quizzes").doc(quizId).get();
            data = doc.data();
        } catch (e) {
            showToast("Lỗi mở đề!", 'error');
            return;
        }
    }

    if (!data) return;

    document.getElementById('quiz-title-input').value = data.title || '';
    let rawText = "";

    if (data.questions) {
        data.questions.forEach(q => {
            rawText += q.q.replace(/<br>/g, '\n').replace(/<span.*?Hình minh họa.*?<\/span><br>/i, '') + "\n";
            q.o.forEach(opt => rawText += opt + "\n");
            rawText += q.a.map(idx => String.fromCharCode(65 + idx)).join(",") + "\n\n";
        });
    }

    document.getElementById('raw-text-input').value = rawText.trim();
    document.getElementById('import-screen-title').innerHTML = '<i class="fas fa-pen mr-2 text-indigo-500"></i>Chỉnh Sửa Bộ Đề';
    document.getElementById('btn-parse').innerHTML = '<i class="fas fa-cogs mr-2"></i> Xử lý & Kiểm tra lại';
    showScreen('import-screen');
}

export async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const status = document.getElementById('upload-status');
    status.classList.remove('hidden');

    try {
        const type = file.name.split('.').pop().toLowerCase();
        let extractedText = '';

        if (type === 'pdf') {
            status.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Đang nạp thư viện & đọc PDF...`;
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await window.pdfjsLib.getDocument(arrayBuffer).promise;
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                extractedText += pageText + '\n\n';
            }
        } else if (type === 'docx') {
            status.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Đang nạp thư viện & đọc Word...`;
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js');

            const arrayBuffer = await file.arrayBuffer();
            const result = await window.mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = result.value;

            let textContent = '';
            tempDiv.childNodes.forEach(node => {
                if (node.nodeName === 'P') {
                    textContent += node.innerText + '\n\n';
                } else if (node.nodeName === 'OL' || node.nodeName === 'UL') {
                    let i = 0;
                    node.childNodes.forEach(li => {
                        if (li.nodeName === 'LI') {
                            const prefix = String.fromCharCode(65 + i) + '. ';
                            textContent += prefix + li.innerText + '\n';
                            i++;
                        }
                    });
                    textContent += '\n';
                } else if (node.innerText) {
                    textContent += node.innerText + '\n\n';
                }
            });
            extractedText = textContent.trim();
        } else if (file.type.startsWith('image/')) {
            status.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Đang tải mô hình OCR nhận diện chữ (10-20s)...`;
            await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
            const result = await window.Tesseract.recognize(file, 'vie');
            extractedText = result.data.text;
        } else {
            throw new Error("Định dạng file không hỗ trợ! Vui lòng chọn PDF, DOCX hoặc Ảnh.");
        }

        const textArea = document.getElementById('raw-text-input');
        textArea.value = (textArea.value + '\n\n' + extractedText).trim();
        showToast("Đã trích xuất văn bản thành công!", 'success');
    } catch (err) {
        console.error(err);
        showToast("Lỗi khi đọc file: " + err.message, 'error');
    } finally {
        status.classList.add('hidden');
        e.target.value = '';
    }
}

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
            for (let i = 0; i < minLen; i++) {
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

export function parseAnswerLine(line) {
    if (!line || typeof line !== 'string') return null;
    const trimmed = line.trim();
    if (!trimmed) return null;

    // 1. Pure answer letters: e.g. "A", "A, B", "A, B, C, D", "A. B. C.", "[A]", "(A, C)", "A."
    const pureMatch = trimmed.match(/^\(?\[?\s*([A-H](?:(?:\s*[,;\/\.\-&]\s*|\s+)[A-H])*)\s*\]?\)?[\.\s]*$/iu);
    if (pureMatch) {
        const letters = pureMatch[1].match(/(?<!\p{L})[A-H](?!\p{L})/giu);
        if (letters && letters.length > 0) {
            return [...new Set(letters.map(l => l.toUpperCase()))];
        }
    }

    // 2. Lines with prefix: "Đáp án: A", "Đáp án: A, B", "Chọn A", "Chọn: B", "Answer: C", "Key: D"
    // Must NOT match questions starting with "Chọn các...", "Chọn câu...", etc.
    const prefixMatch = trimmed.match(/^(?:đáp\s*án|kết\s*quả|answer|key|chọn|câu\s*trả\s*lời)(?:\s*(?:đúng|chính\s*xác|là|câu|phương\s*án|đáp\s*án))?[:\s-]+([A-H](?:(?:\s*[,;\/\.\-&]\s*|\s+)[A-H])*)[\s\.]*$/iu);
    if (prefixMatch) {
        const letters = prefixMatch[1].match(/(?<!\p{L})[A-H](?!\p{L})/giu);
        if (letters && letters.length > 0) {
            return [...new Set(letters.map(l => l.toUpperCase()))];
        }
    }

    // 3. Lines with prefix and option text: e.g. "Đáp án: A. Tri giác" or "Đáp án: A - Tri giác"
    const prefixWithTextMatch = trimmed.match(/^(?:đáp\s*án|kết\s*quả|answer|key)(?:\s*(?:đúng|chính\s*xác|là|câu))?[:\s-]+([A-H])[\.\)\s:-]+(.*)$/iu);
    if (prefixWithTextMatch) {
        const letter = prefixWithTextMatch[1].toUpperCase();
        return [letter];
    }

    return null;
}

export async function parseAndSaveData() {
    const title = document.getElementById('quiz-title-input').value.trim();
    const text = document.getElementById('raw-text-input').value;
    if (!title) return showToast("Vui lòng đặt tên bộ đề!", 'warning');
    if (!text.trim()) return showToast("Vui lòng dán nội dung bộ đề!", 'warning');

    const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
    const btn = document.getElementById('btn-parse');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Đang xử lý...';
    btn.disabled = true;

    let oldQuestions = [];
    if (state.editQuizId && state.hiddenAIText === "") {
        const cached = state.quizzesCache.find(q => q.id === state.editQuizId);
        if (cached && cached.questions) {
            oldQuestions = cached.questions;
        } else {
            try {
                const docSnap = await db.collection("users").doc(state.currentUser.uid).collection("my_quizzes").doc(state.editQuizId).get();
                if (docSnap.exists) oldQuestions = docSnap.data().questions || [];
            } catch(e) {}
        }
    }

    let questionsData = [];
    let currentQ = { textBlock: [], options: [], postOptions: [] };
    let phase = 'text';

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
                for (let j = i + 1; j < lines.length; j++) {
                    let nextLine = lines[j].trim();
                    if (!nextLine) continue;
                    let isNextOption = /^([A-H])[\.\)](?:\s|$)/i.test(nextLine) || (/^([A-H])[\.\)]/i.test(nextLine) && !/^([A-H])[\.\)][a-z][\.\)]/i.test(nextLine) && !/^e\.g\./i.test(nextLine));
                    let isNewQ = /^câu\s*\d+:/i.test(nextLine) || /^\d+[\.\)]/i.test(nextLine);
                    let isExpl = nextLine.toLowerCase().includes('giải thích:');
                    let nextAns = parseAnswerLine(nextLine);

                    if (isNewQ || isExpl || nextAns) break;
                    if (isNextOption) {
                        let nextOptLetter = nextLine.match(/^([A-H])/i)[1].toUpperCase();
                        if (nextOptLetter !== 'A') isContinuation = true;
                        break;
                    }
                }

                let lower = line.toLowerCase();
                let ans = parseAnswerLine(line);
                let isExpl = lower.includes('giải thích:');
                let isNewQ = /^câu\s*\d+:/i.test(line) || /^\d+[\.\)]/i.test(line);
                let startsWithLowercase = /^\p{Ll}/u.test(line);

                if (!ans && !isExpl && !isNewQ && (isContinuation || startsWithLowercase)) {
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

                    for (let k = currentQ.postOptions.length - 1; k >= 0; k--) {
                        let txt = currentQ.postOptions[k];
                        let lower = txt.toLowerCase();
                        let ans = parseAnswerLine(txt);
                        let isRepeated = checkIsRepeatedFuzzy(txt, currentQ.options);
                        let isExpl = lower.includes('giải thích:');

                        let isOptContinuation = false;
                        if (txt.replace(/\s+/g, '').length > 3) {
                            isOptContinuation = currentQ.options.some(opt => opt.replace(/\s+/g, '').toLowerCase().includes(txt.replace(/\s+/g, '').toLowerCase()));
                        }

                        if (ans || isRepeated || isExpl) { hitAnswerOrExpl = true; }

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

                    let isOnlyPrefix = newQText.length > 0 && newQText.every(t => /^(?:đáp\s*án|kết\s*quả|answer|chọn|câu\s*trả\s*lời)[:\s]*$/i.test(t.trim()));
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
    questionsData.forEach((item, index) => {
        if (item.options.length < 2) return;

        let explanationLines = [];
        let inExplanation = false;
        let leftOverText = [];
        let ansLetters = [];

        item.postOptions.forEach(txt => {
            let lower = txt.toLowerCase();
            let ans = parseAnswerLine(txt);
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
            } else if (ans) {
                ans.forEach(c => {
                    if (!ansLetters.includes(c)) ansLetters.push(c);
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

        if (correctIndexes.length === 0 && leftOverText.length > 0) {
            let possibleAnsLine = leftOverText.join(' ');
            item.options.forEach((opt, idx) => {
                let optLetterMatch = opt.match(/^([A-H])/i);
                if (optLetterMatch) {
                    let letter = optLetterMatch[1].toUpperCase();
                    let regex = new RegExp(`(?<!\\p{L})${letter}(?!\\p{L})`, 'iu');
                    if (regex.test(possibleAnsLine)) {
                        correctIndexes.push(idx);
                    }
                }
            });
        }

        if (state.editQuizId && explanation === "") {
            const oldMatch = oldQuestions.find(oq => oq.q.replace(/<br>/g, '').trim() === qText.replace(/<br>/g, '').trim());
            if (oldMatch && oldMatch.e) {
                explanation = oldMatch.e;
            }
        }

        parsedQs.push({ q: qText, o: item.options, a: correctIndexes, e: explanation });
    });

    btn.innerHTML = '<i class="fas fa-cogs mr-2"></i> Xử lý & Kiểm tra lại';
    btn.disabled = false;

    if (parsedQs.length > 0) {
        state.pendingParsedQuestions = parsedQs;
        state.pendingQuizTitle = title;
        renderPreviewScreen();
        showScreen('preview-screen');
    } else {
        showToast("Không nhận diện được nội dung. Hãy kiểm tra lại định dạng câu hỏi!", 'error');
    }
}

export function renderPreviewScreen() {
    document.getElementById('preview-title').innerHTML = `<i class="fas fa-eye mr-2"></i>Kiểm tra lại: ${state.pendingQuizTitle}`;
    document.getElementById('preview-count').innerText = `${state.pendingParsedQuestions.length} câu hỏi`;

    const container = document.getElementById('preview-container');
    const savedScroll = container.scrollTop;
    let html = '';

    state.pendingParsedQuestions.forEach((q, index) => {
        let optionsHtml = `<div class="sortable-options" data-qindex="${index}">`;
        q.o.forEach((opt, optIndex) => {
            const isCorrect = q.a.includes(optIndex);
            const styleClass = isCorrect ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700';
            const textClass = isCorrect ? 'text-emerald-800 font-bold dark:text-emerald-300' : 'text-gray-700 dark:text-gray-300';

            optionsHtml += `
                <div class="flex items-center p-2 mt-1 rounded-xl border ${styleClass} text-sm transition-colors group">
                    <i class="fas fa-grip-vertical text-gray-400 hover:text-gray-600 cursor-grab mr-2 px-1"></i>
                    <input type="checkbox" onchange="window.togglePendingAns(${index}, ${optIndex}, this.checked)" ${isCorrect ? 'checked' : ''} class="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 mr-3 shrink-0 cursor-pointer">
                    <input type="text" oninput="window.updatePendingOpt(${index}, ${optIndex}, this.value)" value="${opt.replace(/"/g, '&quot;')}" class="flex-1 bg-transparent border-none focus:ring-0 outline-none ${textClass} w-full">
                    <button onclick="window.removePendingOption(${index}, ${optIndex})" class="ml-2 text-gray-400 hover:text-rose-500 transition-colors p-1" title="Xóa đáp án này"><i class="fas fa-times"></i></button>
                </div>
            `;
        });
        optionsHtml += `</div>`;

        optionsHtml += `
            <div class="mt-2 text-right">
                <button onclick="window.addPendingOption(${index})" class="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50 rounded-lg font-semibold transition-colors inline-flex items-center">
                    <i class="fas fa-plus mr-1"></i> Thêm đáp án
                </button>
            </div>
        `;

        let explHtml = `
            <div class="mt-2 text-xs p-2.5 bg-indigo-50/60 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                <strong><i class="fas fa-lightbulb text-amber-500 mr-1"></i>Giải thích:</strong>
                <textarea oninput="window.updatePendingQ(${index}, 'e', this.value)" class="w-full bg-transparent border-none resize-none focus:ring-0 outline-none mt-1" rows="${(q.e.match(/<br>/g) || []).length + 1}" placeholder="(Thêm giải thích nếu cần...)">${q.e.replace(/<br>/g, '\n')}</textarea>
            </div>
        `;

        let warningHtml = '';
        if (q.a.length === 0) {
            warningHtml = `
                <div class="mb-2 text-xs p-2 bg-rose-50 text-rose-800 rounded-lg border border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900 flex items-center gap-1.5 font-medium">
                    <i class="fas fa-exclamation-triangle text-rose-500"></i> Chưa có đáp án đúng cho câu này. Hãy đánh dấu checkbox bên dưới!
                </div>
            `;
        }

        html += `
            <div id="preview-q-${index}" class="p-4 bg-white dark:bg-gray-800 border ${q.a.length === 0 ? 'border-rose-400 dark:border-rose-600 error-card' : 'border-gray-200 dark:border-gray-700'} rounded-2xl shadow-sm relative group transition-all">
                <div class="absolute -top-3 left-4 ${q.a.length === 0 ? 'bg-rose-500 text-white border-rose-600' : 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'} px-2.5 py-0.5 rounded-full text-xs font-bold border">
                    Câu ${index + 1}
                </div>
                <button onclick="window.deletePendingQ(${index})" class="absolute top-2 right-2 text-gray-400 hover:text-rose-500 p-1.5 rounded transition" title="Xóa câu hỏi">
                    <i class="fas fa-trash-alt text-sm"></i>
                </button>
                ${warningHtml}
                <div class="font-medium text-base mb-3 mt-1 leading-relaxed border-b border-dashed border-gray-200 dark:border-gray-700 pb-1 mr-6">
                    <textarea oninput="window.updatePendingQ(${index}, 'q', this.value)" class="w-full bg-transparent border-none resize-none focus:ring-0 outline-none" rows="${(q.q.match(/<br>/g) || []).length + 2}">${q.q.replace(/<br>/g, '\n')}</textarea>
                </div>
                <div class="space-y-1">
                    ${optionsHtml}
                </div>
                ${explHtml}
            </div>
        `;
    });

    container.innerHTML = html;

    // Load SortableJS dynamically if needed
    if (window.Sortable) {
        initSortable();
    } else {
        loadScript('https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js').then(initSortable);
    }

    setTimeout(() => { container.scrollTop = savedScroll; }, 0);
}

function initSortable() {
    if (!window.Sortable) return;
    document.querySelectorAll('.sortable-options').forEach(el => {
        new window.Sortable(el, {
            animation: 150,
            handle: '.fa-grip-vertical',
            ghostClass: 'opacity-50',
            onEnd: function (evt) {
                if (evt.oldIndex !== evt.newIndex) {
                    const qIndex = parseInt(evt.from.dataset.qindex);
                    movePendingOption(qIndex, evt.oldIndex, evt.newIndex);
                }
            }
        });
    });
}

export function movePendingOption(qIndex, oldIndex, newIndex) {
    const question = state.pendingParsedQuestions[qIndex];
    const correctStates = question.o.map((_, i) => question.a.includes(i));

    const opt = question.o.splice(oldIndex, 1)[0];
    question.o.splice(newIndex, 0, opt);

    const st = correctStates.splice(oldIndex, 1)[0];
    correctStates.splice(newIndex, 0, st);

    question.a = correctStates.map((isCorrect, i) => isCorrect ? i : -1).filter(i => i !== -1);
    renderPreviewScreen();
}

export function scrollToNextError() {
    const container = document.getElementById('preview-container');
    const errorElements = Array.from(container.querySelectorAll('.error-card'));

    if (errorElements.length === 0) {
        showToast("Tuyệt vời! Không còn câu nào bị thiếu đáp án.", 'success');
        return;
    }

    const currentScroll = container.scrollTop;
    let target = errorElements.find(el => el.offsetTop > currentScroll + 50) || errorElements[0];

    container.scrollTo({
        top: target.offsetTop - 20,
        behavior: 'smooth'
    });

    target.classList.add('ring-4', 'ring-rose-400');
    setTimeout(() => target.classList.remove('ring-4', 'ring-rose-400'), 1500);
}

export function updatePendingQ(index, field, value) {
    state.pendingParsedQuestions[index][field] = value.replace(/\n/g, '<br>');
}

export function updatePendingOpt(qIndex, optIndex, value) {
    state.pendingParsedQuestions[qIndex].o[optIndex] = value;
}

export function togglePendingAns(qIndex, optIndex, isChecked) {
    const q = state.pendingParsedQuestions[qIndex];
    if (isChecked) {
        if (!q.a.includes(optIndex)) q.a.push(optIndex);
    } else {
        q.a = q.a.filter(i => i !== optIndex);
    }
    renderPreviewScreen();
}

export function deletePendingQ(index) {
    showConfirm("Xóa câu hỏi", `Bạn có chắc muốn xóa câu ${index + 1}?`, () => {
        state.pendingParsedQuestions.splice(index, 1);
        renderPreviewScreen();
    }, 'Xóa', true);
}

export function addPendingOption(qIndex) {
    let nextLetter = 'A';
    let currentOpts = state.pendingParsedQuestions[qIndex].o;
    if (currentOpts.length > 0) {
        let lastOpt = currentOpts[currentOpts.length - 1];
        let m = lastOpt.match(/^([A-H])[\.\)]/i);
        if (m) {
            let nextCharCode = m[1].toUpperCase().charCodeAt(0) + 1;
            nextLetter = nextCharCode <= 72 ? String.fromCharCode(nextCharCode) : String.fromCharCode(65 + currentOpts.length);
        } else {
            nextLetter = String.fromCharCode(65 + currentOpts.length);
        }
    }
    state.pendingParsedQuestions[qIndex].o.push(nextLetter + ". ");
    renderPreviewScreen();
}

export function removePendingOption(qIndex, optIndex) {
    if (state.pendingParsedQuestions[qIndex].o.length <= 2) {
        showToast("Một câu hỏi cần ít nhất 2 đáp án!", 'warning');
        return;
    }
    showConfirm('Xóa đáp án', 'Bạn chắc chắn muốn xóa đáp án này?', () => {
        state.pendingParsedQuestions[qIndex].o.splice(optIndex, 1);
        let currentAns = state.pendingParsedQuestions[qIndex].a;
        state.pendingParsedQuestions[qIndex].a = currentAns.filter(a => a !== optIndex).map(a => a > optIndex ? a - 1 : a);
        renderPreviewScreen();
    }, 'Xóa', true);
}

export function cancelPreview() {
    state.hiddenAIText = '';
    const rawInput = document.getElementById('raw-text-input');
    if (rawInput) rawInput.classList.remove('hidden');
    const aiSuccess = document.getElementById('ai-success-msg');
    if (aiSuccess) aiSuccess.remove();
    showScreen('import-screen');
}

export async function saveFromPreview() {
    const btn = document.getElementById("btn-save-preview");
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Đang lưu...';
    btn.disabled = true;

    try {
        if (state.editQuizId) {
            await db.collection("users").doc(state.currentUser.uid).collection("my_quizzes").doc(state.editQuizId).update({
                title: state.pendingQuizTitle,
                questions: state.pendingParsedQuestions
            });
            // Update cache
            const idx = state.quizzesCache.findIndex(q => q.id === state.editQuizId);
            if (idx !== -1) {
                state.quizzesCache[idx].title = state.pendingQuizTitle;
                state.quizzesCache[idx].questions = state.pendingParsedQuestions;
            }
            showToast("Đã cập nhật bộ đề thành công!", 'success');
        } else {
            const newQuiz = {
                title: state.pendingQuizTitle,
                questions: state.pendingParsedQuestions,
                progress: 0,
                shareCode: generateShareCode(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            const docRef = await db.collection("users").doc(state.currentUser.uid).collection("my_quizzes").add(newQuiz);
            newQuiz.id = docRef.id;
            state.quizzesCache.unshift(newQuiz);
            showToast("Đã tạo bộ đề mới thành công!", 'success');
        }

        state.pendingParsedQuestions = [];
        state.pendingQuizTitle = "";
        state.hiddenAIText = "";

        goToDashboard(false);
    } catch (error) {
        showToast("Lỗi lưu bộ đề: " + error.message, 'error');
    } finally {
        btn.innerHTML = '<i class="fas fa-save mr-2"></i> Lưu vào Kho Đề';
        btn.disabled = false;
    }
}
