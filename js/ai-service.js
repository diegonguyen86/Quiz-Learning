/**
 * AI Services: Google Gemini Explanation & Google Translate Integration
 */
import { state } from './state.js';
import { db } from './firebase-config.js';
import { showToast, showPrompt } from './ui.js';

export async function translateText(text, targetLang = 'vi') {
    try {
        const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
        const data = await response.json();
        return data[0].map(item => item[0]).join('');
    } catch (e) {
        console.error("Lỗi dịch thuật:", e);
        return text;
    }
}

window.isInlineTransActive = false;

export function toggleInlineTranslation() {
    window.isInlineTransActive = !window.isInlineTransActive;
    const quizScreen = document.getElementById('quiz-screen');
    const grid = document.getElementById('quiz-content-grid');
    const transCol = document.getElementById('translated-column');
    const btn = document.getElementById('btn-translate');

    if (window.isInlineTransActive) {
        quizScreen?.classList.replace('max-w-3xl', 'max-w-6xl');
        grid?.classList.add('md:grid-cols-2');
        transCol?.classList.remove('hidden');
        btn?.classList.add('ring-2', 'ring-indigo-500', 'bg-indigo-100');
        executeInlineTranslation();
    } else {
        quizScreen?.classList.replace('max-w-6xl', 'max-w-3xl');
        grid?.classList.remove('md:grid-cols-2');
        transCol?.classList.add('hidden');
        btn?.classList.remove('ring-2', 'ring-indigo-500', 'bg-indigo-100');
    }
}

export async function executeInlineTranslation() {
    if (!window.isInlineTransActive) return;

    const langEl = document.getElementById('inline-trans-lang');
    const targetLang = langEl ? langEl.value : 'vi';
    const destQ = document.getElementById('trans-question-text');
    const destOptsContainer = document.getElementById('trans-options-container');
    const origQ = document.getElementById('question-text');
    const origOpts = document.querySelectorAll('.option-btn');

    if (!destQ || !destOptsContainer || !origQ) return;

    destQ.innerHTML = '<i class="fas fa-spinner fa-spin text-indigo-500"></i> Đang dịch...';
    destOptsContainer.innerHTML = '';

    try {
        let qTextToTranslate = origQ.innerText;
        let qPrefix = '';
        const span = origQ.querySelector('span');
        if (span && span.innerText.includes('Câu')) {
            qPrefix = span.outerHTML + ' ';
            qTextToTranslate = origQ.innerText.replace(span.innerText, '').trim();
        }

        const promises = [translateText(qTextToTranslate, targetLang)];
        origOpts.forEach(el => promises.push(translateText(el.innerText, targetLang)));

        const results = await Promise.all(promises);

        destQ.innerHTML = qPrefix + results[0];

        for (let i = 1; i < results.length; i++) {
            const div = document.createElement('div');
            div.className = 'w-full text-left p-3.5 md:p-4 border-2 border-indigo-200 dark:border-indigo-900 rounded-xl font-medium text-indigo-950 dark:text-indigo-100 bg-indigo-50/60 dark:bg-indigo-950/20 text-sm md:text-base';
            div.innerHTML = results[i];
            destOptsContainer.appendChild(div);
        }
    } catch (err) {
        destQ.innerHTML = '<span class="text-rose-500">Lỗi khi dịch!</span>';
    }
}

export async function askAIForExplanation() {
    const btn = document.getElementById('btn-ask-ai');
    const container = document.getElementById('ai-explanation-container');

    if (!container || !state.ALL_QUESTIONS || state.ALL_QUESTIONS.length === 0) return;

    if (!state.hasSubmitted) {
        showToast("Vui lòng chốt đáp án trước khi xem giải thích để tránh lộ kết quả nhé!", "warning");
        return;
    }

    const realIdx = state.queue[state.currentQIndexInQueue];
    if (realIdx === undefined) return;
    const currentQ = state.ALL_QUESTIONS[realIdx];

    const selectedKey = state.selectedOptions.slice().sort().join(',');
    const correctKey = currentQ.a.slice().sort().join(',');

    if (currentQ.ai_explanations && currentQ.ai_explanations[selectedKey]) {
        container.innerHTML = `<b><i class="fas fa-robot mr-1.5 text-indigo-500"></i> AI Giải thích:</b><br/>${currentQ.ai_explanations[selectedKey].replace(/\n/g, '<br/>')}`;
        container.classList.remove('hidden');
        return;
    }

    if (selectedKey === correctKey && currentQ.explanation) {
        container.innerHTML = `<b><i class="fas fa-robot mr-1.5 text-indigo-500"></i> AI Giải thích:</b><br/>${currentQ.explanation.replace(/\n/g, '<br/>')}`;
        container.classList.remove('hidden');
        return;
    }

    const apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) {
        changeApiKey(() => askAIForExplanation());
        return;
    }

    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> <span>Đang hỏi...</span>';
    btn.disabled = true;

    const userSelectedTexts = state.selectedOptions.length > 0 
        ? state.selectedOptions.map(idx => `"${currentQ.o[idx]}" (${currentQ.a.includes(idx) ? 'Đúng' : 'Sai'})`).join(', ') 
        : "Không chọn đáp án nào";
    const correctTexts = currentQ.a.map(idx => `"${currentQ.o[idx]}"`).join(', ');

    const promptText = `Đóng vai một trợ giảng xuất sắc. Bạn đang chấm bài cho học viên.\n\nCâu hỏi: ${currentQ.q}\nCác đáp án:\n${currentQ.o.map(opt => "- " + opt).join('\n')}\nĐáp án đúng của hệ thống: ${correctTexts}\n\nHọc viên đã chọn: ${userSelectedTexts}\n\nYÊU CẦU:\n- Dựa vào trạng thái (Đúng/Sai) của từng đáp án học viên đã chọn, hãy giải thích tại sao các đáp án Sai (nếu có) lại không chính xác, và tại sao đáp án Đúng lại là đáp án chuẩn xác nhất.\n- Chỉ ra chỗ sai trong tư duy của học viên khi họ chọn các đáp án Sai.\n- Giải thích ngắn gọn (2-4 câu), trực tiếp vào vấn đề.\n- Viết dưới dạng văn bản thuần, không dùng Markdown.\n- Trả về đúng nội dung giải thích, không lặp lại chữ "Giải thích:".`;

    try {
        let data = null;
        const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'];
        let lastError = null;

        for (let model of modelsToTry) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: promptText }] }],
                        generationConfig: { temperature: 0.1 }
                    })
                });

                const resData = await response.json();
                if (resData.error) throw new Error(resData.error.message);
                data = resData;
                break;
            } catch (e) {
                lastError = e;
                if (e.message && e.message.includes("API key not valid")) break;
            }
        }

        if (!data) throw lastError;

        let aiResult = data.candidates[0].content.parts[0].text;
        aiResult = aiResult.replace(/^```[a-z]*\n/gm, '').replace(/```$/gm, '').trim();

        if (!currentQ.ai_explanations) currentQ.ai_explanations = {};
        currentQ.ai_explanations[selectedKey] = aiResult;
        if (selectedKey === correctKey) {
            currentQ.explanation = aiResult;
        }

        if (!state.isStudentMode) {
            db.collection("users").doc(state.currentUser.uid).collection("my_quizzes").doc(state.activeQuizId).update({ questions: state.ALL_QUESTIONS }).catch(console.error);
        }

        container.innerHTML = `<b><i class="fas fa-robot mr-1.5 text-indigo-500"></i> AI Giải thích:</b><br/>${aiResult.replace(/\n/g, '<br/>')}`;
        container.classList.remove('hidden');
        showToast("Đã lưu giải thích AI thành công!", 'success');
    } catch (err) {
        console.error(err);
        if (err.message && err.message.includes("API key not valid")) {
            localStorage.removeItem('GEMINI_API_KEY');
            showToast("API Key không hợp lệ. Vui lòng kiểm tra lại!", 'error');
        } else {
            showToast("Lỗi AI: " + (err.message || "Không rõ"), 'error');
        }
    } finally {
        btn.innerHTML = '<i class="fas fa-robot mr-1"></i> <span>Hỏi AI</span>';
        btn.disabled = false;
    }
}

export function changeApiKey(callback) {
    showPrompt(
        "Cài đặt Gemini API Key",
        "Nhập Google Gemini API Key để kích hoạt trợ lý giải thích AI.<br><br><a href='https://aistudio.google.com/app/apikey' target='_blank' class='text-indigo-600 dark:text-indigo-400 font-semibold hover:underline inline-flex items-center gap-1'><i class='fas fa-external-link-alt text-xs'></i> Lấy API Key miễn phí tại Google AI Studio</a>",
        "AIzaSy...",
        (key) => {
            if (key.trim()) {
                localStorage.setItem('GEMINI_API_KEY', key.trim());
                showToast("Đã cập nhật Gemini API Key mới!", 'success');
                if (callback) callback();
            }
        }
    );
}
