/**
 * Quiz Execution Engine, Spaced Repetition (SRS), and Gameplay logic
 */
import { state } from './state.js';
import { db, saveSessionStateToFirebase, clearSessionStateFromFirebase } from './firebase-config.js';
import { showToast, showConfirm, showScreen } from './ui.js';
import { goToDashboard } from './dashboard.js';

export async function openQuiz(quizId, mode = 'quick') {
    try {
        state.activeQuizId = quizId;
        
        let data = state.quizzesCache.find(q => q.id === quizId);
        if (!data || !data.questions) {
            const doc = await db.collection("users").doc(state.currentUser.uid).collection("my_quizzes").doc(quizId).get();
            data = doc.data();
            if (data) data.id = doc.id;
        }

        if (!data) {
            showToast("Không tìm thấy bộ đề!", 'error');
            goToDashboard();
            return;
        }

        state.activeQuizTitle = data.title || 'Bộ đề';
        state.globalSessionState = data.sessionState || null;

        if (data.isClassroom) {
            state.isStudentMode = true;
            const teacherDoc = await db.doc(data.refPath).get();
            if (!teacherDoc.exists) {
                showToast("Giáo viên đã xóa lớp học này!", 'error');
                await db.collection("users").doc(state.currentUser.uid).collection("my_quizzes").doc(quizId).delete();
                goToDashboard();
                return;
            }
            state.ALL_QUESTIONS = teacherDoc.data().questions || [];
            state.studentClassRef = db.doc(data.refPath).collection("students").doc(state.currentUser.uid);
            state.TOTAL_SECTIONS = Math.ceil(state.ALL_QUESTIONS.length / state.SEC_SIZE);
            state.currentSection = data.progress || 0;

            const badge = document.getElementById('student-badge');
            if (badge) badge.classList.remove('hidden');
            const shuffleBtn = document.getElementById('btn-shuffle');
            const srsBtn = document.getElementById('btn-srs');
            if (shuffleBtn) shuffleBtn.classList.add('hidden');
            if (srsBtn) srsBtn.classList.add('hidden');
        } else {
            state.isStudentMode = false;
            state.studentClassRef = null;
            state.ALL_QUESTIONS = data.questions || [];
            state.TOTAL_SECTIONS = Math.ceil(state.ALL_QUESTIONS.length / state.SEC_SIZE);
            state.currentSection = data.progress || 0;

            const badge = document.getElementById('student-badge');
            if (badge) badge.classList.add('hidden');
            const shuffleBtn = document.getElementById('btn-shuffle');
            const srsBtn = document.getElementById('btn-srs');
            if (shuffleBtn) shuffleBtn.classList.remove('hidden');
            if (srsBtn) srsBtn.classList.remove('hidden');
        }

        if (!state.ALL_QUESTIONS || state.ALL_QUESTIONS.length === 0) {
            showToast("Bộ đề này chưa có câu hỏi. Vui lòng chỉnh sửa bộ đề!", 'warning');
            goToDashboard();
            return;
        }

        document.getElementById('current-quiz-title').innerText = data.title;

        // SRS mode filtering
        if (mode === 'srs') {
            const now = new Date().toISOString();
            let srsQuestions = state.ALL_QUESTIONS.filter(q => !q.nextReview || q.nextReview <= now);

            if (srsQuestions.length === 0) {
                showToast("Tuyệt vời! Bạn không có câu nào cần ôn tập hôm nay.", "success");
                goToDashboard();
                return;
            }

            showToast(`Đã lọc được ${srsQuestions.length} câu cần ôn tập hôm nay.`, "info");

            for (let i = srsQuestions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [srsQuestions[i], srsQuestions[j]] = [srsQuestions[j], srsQuestions[i]];
            }

            const nonSrs = state.ALL_QUESTIONS.filter(q => q.nextReview && q.nextReview > now);
            state.ALL_QUESTIONS = [...srsQuestions, ...nonSrs];
            state.TOTAL_SECTIONS = Math.ceil(srsQuestions.length / state.SEC_SIZE);
            state.currentSection = 0;

            if (!state.isStudentMode) {
                db.collection("users").doc(state.currentUser.uid).collection("my_quizzes").doc(state.activeQuizId).update({
                    questions: state.ALL_QUESTIONS,
                    progress: 0
                }).catch(console.error);
            }
        }

        if (state.currentSection >= state.TOTAL_SECTIONS) {
            document.getElementById('finish-title').innerText = "HOÀN THÀNH!";
            document.getElementById('finish-desc').innerText = state.isStudentMode 
                ? "Bạn đã theo kịp 100% tiến độ của lớp học." 
                : "Bạn đã hoàn thành xong bộ đề cá nhân.";
            showScreen('finish-screen');
            updateHeaderProgress();
            return;
        }

        document.getElementById('welcome-msg').innerText = `Bộ đề có ${state.ALL_QUESTIONS.length} câu. Bạn đang ở Section ${state.currentSection + 1}/${state.TOTAL_SECTIONS}.`;
        updateHeaderProgress();
        showScreen('welcome-screen');
    } catch (e) {
        console.error(e);
        showToast("Lỗi mở đề: " + e.message, 'error');
        goToDashboard();
    }
}

export function startNextSection() {
    state.isReviewMode = false;
    state.mistakes = [];
    state.queue = [];

    if (state.globalSessionState && state.globalSessionState.currentSection === state.currentSection) {
        let remaining = state.globalSessionState.queue.slice(state.globalSessionState.currentQIndexInQueue);
        let savedMistakes = state.globalSessionState.mistakes || [];

        state.queue = [...savedMistakes, ...remaining];
        state.currentQIndexInQueue = 0;
        state.mistakes = [];
        state.isReviewMode = false;
        state.globalSessionState = null;

        if (state.queue.length === 0) {
            finishPhase();
            return;
        }
        renderCurrentQuestion();
        showScreen('quiz-screen');
        return;
    }

    let startIdx = state.currentSection * state.SEC_SIZE;
    let endIdx = Math.min(startIdx + state.SEC_SIZE, state.ALL_QUESTIONS.length);
    for (let i = startIdx; i < endIdx; i++) state.queue.push(i);

    state.currentQIndexInQueue = 0;
    renderCurrentQuestion();
    showScreen('quiz-screen');
}

export function startRetry() {
    state.isReviewMode = true;
    state.queue = [...state.mistakes];
    state.mistakes = [];
    state.currentQIndexInQueue = 0;
    renderCurrentQuestion();
    showScreen('quiz-screen');
}

export function renderCurrentQuestion() {
    const aiContainer = document.getElementById('ai-explanation-container');
    const aiBtn = document.getElementById('btn-ask-ai');
    if (aiContainer) aiContainer.classList.add('hidden');
    if (aiBtn) aiBtn.innerHTML = '<i class="fas fa-robot mr-1"></i> <span>Hỏi AI</span>';

    state.selectedOptions = [];
    state.hasSubmitted = false;

    const elNextBtn = document.getElementById('next-btn');
    const elPrevBtn = document.getElementById('prev-btn');
    if (elPrevBtn) elPrevBtn.classList.add('hidden');

    elNextBtn.disabled = true;
    elNextBtn.innerHTML = 'Enter <i class="fas fa-check ml-2"></i>';
    elNextBtn.className = "w-full md:w-auto justify-center bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl opacity-50 cursor-not-allowed transition flex items-center text-base ml-auto shadow-sm";

    const realIdx = state.queue[state.currentQIndexInQueue];
    const qData = state.ALL_QUESTIONS[realIdx];
    if (!qData) return;

    let qText = qData.q.replace(/\[Hình minh họa:?.*?\]/gi, '<br><span class="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-bold rounded-lg border border-amber-200 dark:border-amber-900/60"><i class="fas fa-image"></i> Hình minh họa</span><br>');

    document.getElementById('question-text').innerHTML = `<span class="text-indigo-600 dark:text-indigo-400 font-bold mr-2">Câu ${realIdx + 1}.</span> ` + qText;

    const elOpts = document.getElementById('options-container');
    elOpts.innerHTML = '';
    qData.o.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = "option-btn w-full text-left p-3.5 md:p-4 rounded-xl font-medium text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 text-sm md:text-base shadow-sm";
        btn.innerHTML = `<span class="font-bold text-gray-400 dark:text-gray-500 mr-2">${String.fromCharCode(65 + idx)}.</span> ` + opt.replace(/^[A-H][\.\)]\s*/i, '');
        btn.onclick = () => selectOption(idx, btn);
        elOpts.appendChild(btn);
    });

    if (state.isReviewMode) {
        document.getElementById('quiz-status').innerText = `Ôn Tập Lỗi Sai: ${state.currentQIndexInQueue + 1}/${state.queue.length}`;
        document.getElementById('retry-badge').classList.remove('hidden');
    } else {
        document.getElementById('quiz-status').innerText = `Tiến trình: ${state.currentQIndexInQueue + 1}/${state.queue.length}`;
        document.getElementById('retry-badge').classList.add('hidden');
    }

    if (window.isInlineTransActive && window.executeInlineTranslation) {
        window.executeInlineTranslation();
    }
}

export function selectOption(idx, btnElement) {
    if (state.hasSubmitted) return;

    const indexInArray = state.selectedOptions.indexOf(idx);
    if (indexInArray > -1) {
        state.selectedOptions.splice(indexInArray, 1);
        btnElement.classList.remove('selected');
    } else {
        state.selectedOptions.push(idx);
        btnElement.classList.add('selected');
    }

    const elNextBtn = document.getElementById('next-btn');
    if (state.selectedOptions.length > 0) {
        elNextBtn.disabled = false;
        elNextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        elNextBtn.classList.add('hover:bg-indigo-700', 'shadow-md');
    } else {
        elNextBtn.disabled = true;
        elNextBtn.classList.add('opacity-50', 'cursor-not-allowed');
        elNextBtn.classList.remove('hover:bg-indigo-700', 'shadow-md');
    }
}

export function handleNext() {
    const realIdx = state.queue[state.currentQIndexInQueue];
    const qData = state.ALL_QUESTIONS[realIdx];
    const buttons = document.getElementById('options-container').querySelectorAll('button');
    const elNextBtn = document.getElementById('next-btn');

    if (!state.hasSubmitted) {
        state.hasSubmitted = true;
        let isCorrect = true;
        let isMissing = false;

        if (state.selectedOptions.length !== qData.a.length) {
            isCorrect = false;
            if (state.selectedOptions.length > 0 && state.selectedOptions.every(val => qData.a.includes(val))) {
                isMissing = true;
            }
        } else {
            for (let ans of qData.a) {
                if (!state.selectedOptions.includes(ans)) {
                    isCorrect = false;
                    break;
                }
            }
        }

        buttons.forEach((btn, idx) => {
            btn.disabled = true;
            btn.classList.remove('selected');

            if (qData.a.includes(idx)) {
                if (state.selectedOptions.includes(idx)) {
                    btn.classList.add('correct');
                    btn.innerHTML += ' <i class="fas fa-check-circle float-right text-lg mt-0.5"></i>';
                } else {
                    if (qData.a.length > 1) {
                        btn.style.backgroundColor = 'rgba(245, 158, 11, 0.15)';
                        btn.style.borderColor = '#f59e0b';
                        btn.style.color = '#b45309';
                        btn.innerHTML += ' <i class="fas fa-exclamation-triangle float-right text-lg mt-0.5"></i> <span class="float-right text-xs font-bold mr-2 mt-0.5">(Chọn thiếu)</span>';
                    } else {
                        btn.classList.add('correct');
                        btn.innerHTML += ' <i class="fas fa-check-circle float-right text-lg mt-0.5"></i>';
                    }
                }
            } else if (state.selectedOptions.includes(idx)) {
                btn.classList.add('wrong');
                btn.innerHTML += ' <i class="fas fa-times-circle float-right text-lg mt-0.5"></i>';
            }
        });

        const statusEl = document.getElementById('quiz-status');
        if (!isCorrect) {
            if (!state.mistakes.includes(realIdx)) state.mistakes.push(realIdx);
            statusEl.innerHTML += isMissing 
                ? ' <span class="text-amber-500 ml-2 font-bold animate-pulse">&bull; THIẾU ĐÁP ÁN!</span>' 
                : ' <span class="text-rose-500 ml-2 font-bold animate-pulse">&bull; CHƯA ĐÚNG!</span>';
        } else {
            statusEl.innerHTML += ' <span class="text-emerald-500 ml-2 font-bold animate-pulse">&bull; CHÍNH XÁC!</span>';
        }

        // Show Explanation
        if (qData.e) {
            const explBox = document.createElement('div');
            let boxStyle = isCorrect 
                ? "bg-emerald-50 border-emerald-500 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200" 
                : "bg-amber-50 border-amber-500 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200";

            if (qData.e.includes("⚠️")) {
                boxStyle = "bg-rose-50 border-rose-500 text-rose-900 dark:bg-rose-950/30 dark:text-rose-200 font-bold";
            }

            explBox.className = `mt-4 p-4 rounded-xl border-l-4 text-sm fade-in ${boxStyle}`;
            explBox.innerHTML = `<strong><i class="fas fa-lightbulb text-amber-500 mr-1.5"></i> Giải thích:</strong><br>${qData.e.replace(/giải thích:\s*/i, '')}`;
            document.getElementById('options-container').appendChild(explBox);
        }

        elNextBtn.innerHTML = 'Tiếp tục (Enter) <i class="fas fa-arrow-right ml-2"></i>';
        elNextBtn.className = "w-full md:w-auto justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-md transition flex items-center text-base ml-auto";
    } else {
        // Debounce / next transition
        elNextBtn.disabled = true;
        elNextBtn.classList.add('opacity-50', 'cursor-not-allowed');
        elNextBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Đang tải...';

        setTimeout(() => {
            state.currentQIndexInQueue++;
            if (state.currentQIndexInQueue < state.queue.length) {
                renderCurrentQuestion();
            } else {
                finishPhase();
            }
        }, 150);
    }
}

export async function finishPhase() {
    const resultIcon = document.getElementById('result-icon');
    const resultTitle = document.getElementById('result-title');
    const resultDesc = document.getElementById('result-desc');
    const resultAction = document.getElementById('result-action');

    const existingSummary = document.getElementById('knowledge-summary-box');
    if (existingSummary) existingSummary.remove();

    if (state.mistakes.length > 0) {
        resultIcon.className = "w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 rounded-full flex items-center justify-center text-3xl md:text-4xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400";
        resultIcon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
        resultTitle.innerText = "Cần ôn tập lại!";
        resultDesc.innerText = `Lần này sai ${state.mistakes.length} câu. Hãy làm lại cho nhớ nhé!`;

        resultAction.innerHTML = `<button onclick="window.startRetry()" class="w-full md:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-8 rounded-xl shadow-md transition"><i class="fas fa-redo mr-2"></i> Làm lại ${state.mistakes.length} câu sai</button>`;
    } else {
        resultIcon.className = "w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 rounded-full flex items-center justify-center text-3xl md:text-4xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400";
        resultIcon.innerHTML = '<i class="fas fa-check"></i>';
        resultTitle.innerText = "Tuyệt vời!";
        resultDesc.innerText = "Không sai một câu nào cả. Trí nhớ của bạn rất xuất sắc!";

        const summaryDiv = document.createElement('div');
        summaryDiv.id = 'knowledge-summary-box';
        summaryDiv.className = 'mt-8 text-left border-t border-gray-200 dark:border-gray-700 pt-6';
        summaryDiv.innerHTML = '<h3 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4"><i class="fas fa-book-open mr-2 text-indigo-600"></i>Tổng hợp kiến thức Section</h3><div class="space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2" id="summary-list"></div>';

        let startIdx = state.currentSection * state.SEC_SIZE;
        let endIdx = Math.min(startIdx + state.SEC_SIZE, state.ALL_QUESTIONS.length);
        let summaryHTML = '';

        for (let i = startIdx; i < endIdx; i++) {
            const qData = state.ALL_QUESTIONS[i];
            let correctAnswersText = qData.a.map(ansIdx => qData.o[ansIdx]).join(" | ");
            let explanationText = qData.e ? `<div class="mt-2 text-xs p-2 bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-200 rounded-lg border border-indigo-100 dark:border-indigo-900/40"><i class="fas fa-lightbulb mr-1 text-amber-500"></i> ${qData.e.replace(/giải thích:\s*/i, '')}</div>` : '';
            let qText = qData.q.replace(/\[Hình minh họa:?.*?\]/gi, '');
            summaryHTML += `
                <div class="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700">
                    <p class="font-semibold text-sm mb-1 text-gray-800 dark:text-gray-200">Câu ${i - startIdx + 1}: ${qText}</p>
                    <p class="text-sm text-emerald-600 dark:text-emerald-400 font-medium"><i class="fas fa-check mr-1"></i> ${correctAnswersText}</p>
                    ${explanationText}
                </div>
            `;
        }

        state.currentSection++;
        clearSessionStateFromFirebase();

        // Update progress in background
        if (state.isStudentMode && state.studentClassRef) {
            state.studentClassRef.set({ progress: state.currentSection, lastActive: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true }).catch(console.error);
            db.collection("users").doc(state.currentUser.uid).collection("my_quizzes").doc(state.activeQuizId).update({ progress: state.currentSection }).catch(console.error);
        } else {
            db.collection("users").doc(state.currentUser.uid).collection("my_quizzes").doc(state.activeQuizId).update({ progress: state.currentSection }).catch(console.error);
        }

        updateHeaderProgress();

        if (state.currentSection >= state.TOTAL_SECTIONS) {
            showScreen('finish-screen');
            return;
        }

        resultAction.innerHTML = `<button onclick="window.startNextSection()" class="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-md transition mt-6">Tiếp tục Section ${state.currentSection + 1} <i class="fas fa-arrow-right ml-2"></i></button>`;

        document.getElementById('result-screen').appendChild(summaryDiv);
        document.getElementById('summary-list').innerHTML = summaryHTML;
    }

    showScreen('result-screen');
}

export function updateHeaderProgress() {
    if (state.TOTAL_SECTIONS === 0) return;
    const pct = Math.min(100, Math.round((state.currentSection / state.TOTAL_SECTIONS) * 100));
    const pText = document.getElementById('progress-text');
    const pBar = document.getElementById('progress-bar');
    const sText = document.getElementById('section-text');

    if (pText) pText.innerText = `Tiến độ: ${pct}%`;
    if (pBar) pBar.style.width = `${pct}%`;
    if (sText) sText.innerText = state.currentSection < state.TOTAL_SECTIONS ? `Section ${state.currentSection + 1}/${state.TOTAL_SECTIONS}` : `Hoàn thành!`;
}

export function exportPDF() {
    let printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Bộ đề: ' + (state.activeQuizTitle || 'Ôn tập') + '</title>');
    printWindow.document.write('<style>body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial; padding: 30px; line-height: 1.6; } .question { margin-bottom: 25px; break-inside: avoid; } .option { margin-left: 20px; } .correct { font-weight: bold; color: #16a34a; } .explanation { color: #4b5563; font-size: 0.9em; margin-top: 8px; padding-left: 15px; border-left: 3px solid #e5e7eb; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<h2 style="text-align: center; margin-bottom: 30px;">' + (state.activeQuizTitle || 'BỘ ĐỀ ÔN TẬP') + '</h2><hr style="margin-bottom: 30px;"/>');

    state.ALL_QUESTIONS.forEach((q, i) => {
        printWindow.document.write('<div class="question">');
        printWindow.document.write('<p><b>Câu ' + (i + 1) + ':</b> ' + q.q.replace(/\n/g, '<br/>') + '</p>');
        q.o.forEach((opt, optIdx) => {
            const isCorrect = q.a.includes(optIdx);
            const optLetter = String.fromCharCode(65 + optIdx);
            printWindow.document.write('<div class="option ' + (isCorrect ? 'correct' : '') + '">' + optLetter + '. ' + opt + '</div>');
        });
        if (q.e) {
            printWindow.document.write('<div class="explanation"><b>Giải thích:</b> ' + q.e.replace(/\n/g, '<br/>') + '</div>');
        }
        printWindow.document.write('</div>');
    });

    printWindow.document.write('</body></html>');
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 400);
}

export async function startSRS() {
    showConfirm("Ôn tập Thông minh (SRS)", "Hệ thống sẽ lọc ra các câu hỏi đã đến hạn ôn tập dựa trên thuật toán ghi nhớ của bạn.", async () => {
        const now = new Date().toISOString();
        let srsQuestions = state.ALL_QUESTIONS.filter(q => !q.nextReview || q.nextReview <= now);

        if (srsQuestions.length === 0) {
            showToast("Tuyệt vời! Bạn không có câu nào cần ôn tập hôm nay.", "success");
            return;
        }

        showToast(`Đã lọc được ${srsQuestions.length} câu cần ôn tập hôm nay.`, "info");

        for (let i = srsQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [srsQuestions[i], srsQuestions[j]] = [srsQuestions[j], srsQuestions[i]];
        }

        const nonSrs = state.ALL_QUESTIONS.filter(q => q.nextReview && q.nextReview > now);
        state.ALL_QUESTIONS = [...srsQuestions, ...nonSrs];
        state.TOTAL_SECTIONS = Math.ceil(srsQuestions.length / state.SEC_SIZE);
        state.currentSection = 0;

        if (!state.isStudentMode) {
            db.collection("users").doc(state.currentUser.uid).collection("my_quizzes").doc(state.activeQuizId).update({
                questions: state.ALL_QUESTIONS,
                progress: 0
            }).catch(console.error);
        }
        startNextSection();
    });
}

export async function shuffleAndStart() {
    showConfirm("Trộn đề", "Đảo ngẫu nhiên toàn bộ câu hỏi trong bộ đề?", async () => {
        for (let i = state.ALL_QUESTIONS.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [state.ALL_QUESTIONS[i], state.ALL_QUESTIONS[j]] = [state.ALL_QUESTIONS[j], state.ALL_QUESTIONS[i]];
        }
        state.currentSection = 0;
        if (!state.isStudentMode) {
            db.collection("users").doc(state.currentUser.uid).collection("my_quizzes").doc(state.activeQuizId).update({
                questions: state.ALL_QUESTIONS,
                progress: 0
            }).catch(console.error);
        }
        startNextSection();
    });
}

export async function resetAndRestart() {
    showConfirm("Làm lại", "Xác nhận làm lại từ đầu bộ đề?", async () => {
        clearSessionStateFromFirebase();
        if (!state.isStudentMode) {
            db.collection("users").doc(state.currentUser.uid).collection("my_quizzes").doc(state.activeQuizId).update({ progress: 0 }).catch(console.error);
        }
        state.currentSection = 0;
        startNextSection();
    });
}
