/**
 * Main Application Entry Point & Global Interop Layer
 */
import { state } from './state.js';
import { auth, db, saveSessionStateToFirebase } from './firebase-config.js';
import { showToast, showConfirm, showPrompt, showScreen, toggleDarkMode, initTheme } from './ui.js';
import { 
    goToDashboard, 
    renderQuizList, 
    deleteQuiz, 
    resetQuiz, 
    refreshShareCode, 
    copyShareCode, 
    importCopyQuiz, 
    joinClassroom,
    showLearnOptions,
    closeLearnOptions,
    selectLearnMode
} from './dashboard.js';
import { 
    openImportScreen, 
    editQuiz, 
    handleFileUpload, 
    parseAndSaveData, 
    renderPreviewScreen, 
    movePendingOption, 
    scrollToNextError, 
    updatePendingQ, 
    updatePendingOpt, 
    togglePendingAns, 
    deletePendingQ, 
    addPendingOption, 
    removePendingOption, 
    cancelPreview, 
    saveFromPreview,
    loadScript
} from './parser.js';
import { 
    openQuiz, 
    startNextSection, 
    startRetry, 
    renderCurrentQuestion, 
    selectOption, 
    handleNext, 
    finishPhase, 
    updateHeaderProgress, 
    exportPDF, 
    startSRS, 
    shuffleAndStart, 
    resetAndRestart 
} from './quiz-engine.js';
import { 
    translateText, 
    toggleInlineTranslation, 
    executeInlineTranslation, 
    askAIForExplanation, 
    changeApiKey 
} from './ai-service.js';
import { 
    viewStudentProgress, 
    closeScoreModal, 
    openAnalytics 
} from './analytics.js';

// Expose functions to window for DOM event listeners
window.goToDashboard = goToDashboard;
window.renderQuizList = renderQuizList;
window.deleteQuiz = deleteQuiz;
window.resetQuiz = resetQuiz;
window.refreshShareCode = refreshShareCode;
window.copyShareCode = copyShareCode;
window.importCopyQuiz = importCopyQuiz;
window.joinClassroom = joinClassroom;
window.showLearnOptions = showLearnOptions;
window.closeLearnOptions = closeLearnOptions;
window.selectLearnMode = selectLearnMode;

window.openImportScreen = openImportScreen;
window.editQuiz = editQuiz;
window.handleFileUpload = handleFileUpload;
window.parseAndSaveData = parseAndSaveData;
window.renderPreviewScreen = renderPreviewScreen;
window.movePendingOption = movePendingOption;
window.scrollToNextError = scrollToNextError;
window.updatePendingQ = updatePendingQ;
window.updatePendingOpt = updatePendingOpt;
window.togglePendingAns = togglePendingAns;
window.deletePendingQ = deletePendingQ;
window.addPendingOption = addPendingOption;
window.removePendingOption = removePendingOption;
window.cancelPreview = cancelPreview;
window.saveFromPreview = saveFromPreview;

window.openQuiz = openQuiz;
window.startNextSection = startNextSection;
window.startRetry = startRetry;
window.renderCurrentQuestion = renderCurrentQuestion;
window.selectOption = selectOption;
window.handleNext = handleNext;
window.finishPhase = finishPhase;
window.updateHeaderProgress = updateHeaderProgress;
window.exportPDF = exportPDF;
window.startSRS = startSRS;
window.shuffleAndStart = shuffleAndStart;
window.resetAndRestart = resetAndRestart;

window.translateText = translateText;
window.toggleInlineTranslation = toggleInlineTranslation;
window.executeInlineTranslation = executeInlineTranslation;
window.askAIForExplanation = askAIForExplanation;
window.changeApiKey = changeApiKey;

window.viewStudentProgress = viewStudentProgress;
window.closeScoreModal = closeScoreModal;
window.openAnalytics = openAnalytics;
window.toggleDarkMode = toggleDarkMode;
window.showToast = showToast;
window.showConfirm = showConfirm;

// Search helper
window.onDashboardSearch = function(query) {
    state.searchFilter = query;
    renderQuizList(query);
};
window.clearDashboardSearch = function() {
    const el = document.getElementById('dashboard-search-input');
    if (el) el.value = '';
    state.searchFilter = '';
    renderQuizList();
};

// Authentication handlers
window.loginWithGoogle = function() {
    const provider = new firebase.auth.GoogleAuthProvider();
    const authScreen = document.getElementById('auth-screen');
    if (authScreen) {
        authScreen.innerHTML = `
            <div class="py-12 text-center fade-in">
                <i class="fas fa-circle-notch fa-spin text-5xl text-indigo-600 mb-6"></i>
                <h2 class="text-xl font-bold text-gray-800 dark:text-white">Đang kết nối tài khoản Google...</h2>
            </div>
        `;
    }

    auth.signInWithPopup(provider).catch(err => {
        showToast("Lỗi đăng nhập: " + err.message, 'error');
        renderLoginUI();
    });
};

window.logoutApp = function() {
    showConfirm("Đăng xuất", "Bạn có chắc muốn đăng xuất khỏi Quiz Learning?", () => {
        auth.signOut().then(() => {
            state.currentUser = null;
            state.quizzesCache = [];
            showToast("Đã đăng xuất thành công!", 'info');
        });
    });
};

function renderLoginUI() {
    const authScreen = document.getElementById('auth-screen');
    if (!authScreen) return;
    authScreen.innerHTML = `
        <div class="w-16 h-16 mx-auto mb-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-3xl text-indigo-600 dark:text-indigo-400 shadow-inner">
            <i class="fas fa-graduation-cap"></i>
        </div>
        <h2 class="text-2xl font-black mb-2 text-gray-900 dark:text-white tracking-tight">QUIZ LEARNING</h2>
        <p class="text-gray-500 dark:text-gray-400 mb-8 text-sm px-2 leading-relaxed">
            Học tập thông minh & ghi nhớ dài hạn với phương pháp Spaced Repetition (SRS).
        </p>
        <button onclick="window.loginWithGoogle()" class="w-full bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white font-bold py-3.5 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-indigo-400 transition flex items-center justify-center gap-3 shadow-sm active:scale-[0.99]">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" class="w-5 h-5" alt="Google">
            Đăng nhập bằng Google
        </button>
    `;
}

// Auth State Changed
auth.onAuthStateChanged(async (user) => {
    if (user) {
        state.currentUser = user;

        try {
            db.collection('users').doc(user.uid).set({
                displayName: user.displayName || 'Người dùng',
                email: user.email || '',
                photoURL: user.photoURL || '',
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true }).catch(console.error);
        } catch (e) {
            console.error("Lỗi cập nhật user:", e);
        }

        const userProfile = document.getElementById('user-profile');
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');

        if (userProfile) userProfile.classList.replace('hidden', 'flex');
        if (userAvatar) userAvatar.src = user.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
        if (userName) userName.innerText = user.displayName || 'Người dùng';

        goToDashboard();
    } else {
        state.currentUser = null;
        state.quizzesCache = [];
        const userProfile = document.getElementById('user-profile');
        if (userProfile) userProfile.classList.replace('flex', 'hidden');
        renderLoginUI();
        showScreen('auth-screen');
    }
});

// History popstate navigation
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.screen) {
        showScreen(event.state.screen, false);
    } else if (state.currentUser) {
        goToDashboard(true);
    }
});

// Auto-save session state
window.addEventListener('beforeunload', () => {
    saveSessionStateToFirebase();
});
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        saveSessionStateToFirebase();
    }
});

// Keyboard shortcuts for gameplay
document.addEventListener('keydown', (event) => {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;

    const quizScreen = document.getElementById('quiz-screen');
    if (!quizScreen || quizScreen.classList.contains('hidden')) return;

    if (event.key === 'Enter') {
        const nextBtn = document.getElementById('next-btn');
        if (nextBtn && !nextBtn.disabled) {
            nextBtn.click();
        }
        return;
    }

    const keyNum = parseInt(event.key);
    if (keyNum >= 1 && keyNum <= 9) {
        const options = document.getElementById('options-container')?.querySelectorAll('button');
        const targetIndex = keyNum - 1;
        if (options && targetIndex < options.length && !state.hasSubmitted) {
            options[targetIndex].click();
        }
    }
});

// Driver.js Guided Tour
window.startTour = async function() {
    if (!window.driver) {
        await loadScript('https://cdn.jsdelivr.net/npm/driver.js@1.3.1/dist/driver.js.iife.js');
    }
    const driver = window.driver.js.driver;
    const steps = [
        { popover: { title: '🌟 Chào mừng bạn!', description: 'Khám phá nhanh các tính năng nổi bật của Quiz Learning!', position: 'center' } },
    ];

    const quizScreen = document.getElementById('quiz-screen');
    const importScreen = document.getElementById('import-screen');

    if (quizScreen && !quizScreen.classList.contains('hidden')) {
        steps.push({ element: '#header-progress', popover: { title: 'Thanh tiến độ', description: 'Theo dõi tỷ lệ hoàn thành của bộ đề.' } });
        steps.push({ element: '#btn-shuffle', popover: { title: '🔀 Trộn đề', description: 'Đảo câu hỏi ngẫu nhiên để chống học vẹt.' } });
        steps.push({ element: '#btn-srs', popover: { title: '🧠 Ôn tập (SRS)', description: 'Chỉ học những câu đã đến hạn ôn tập.' } });
        steps.push({ element: '#btn-pdf', popover: { title: '📄 Xuất PDF', description: 'Tải đề ra bản in giấy hoặc học ngoại tuyến.' } });
        steps.push({ element: '#btn-translate', popover: { title: '🌐 Dịch tự động', description: 'Dịch song ngữ câu hỏi và các đáp án.' } });
        steps.push({ element: '#btn-ask-ai', popover: { title: '🤖 Trợ lý AI', description: 'AI giải thích chi tiết vì sao đáp án đúng hoặc sai.' } });
    } else if (importScreen && !importScreen.classList.contains('hidden')) {
        steps.push({ element: '#quiz-title-input', popover: { title: '1️⃣ Tên bộ đề', description: 'Nhập tên môn học hoặc chủ đề đề thi.' } });
        steps.push({ element: '#raw-text-input', popover: { title: '2️⃣ Nội dung câu hỏi', description: 'Dán trực tiếp hoặc tải file Word/PDF/Ảnh lên.' } });
        steps.push({ element: '#btn-parse', popover: { title: '3️⃣ Xử lý dữ liệu', description: 'Bóc tách tự động và vào màn hình kiểm tra lại.' } });
    } else {
        steps.push({ element: '#dashboard-search-container', popover: { title: '🔍 Tìm kiếm', description: 'Tìm nhanh bộ đề theo tên hoặc mã chia sẻ.' } });
        steps.push({ element: '#btn-create-quiz', popover: { title: '➕ Tạo bộ đề mới', description: 'Nhập đề từ văn bản, PDF hoặc ảnh.' } });
    }

    steps.push({ element: '#btn-api-key', popover: { title: '🔑 Google Gemini Key', description: 'Cài đặt API key miễn phí để kích hoạt AI.' } });
    steps.push({ element: '#btn-dark-mode', popover: { title: '🌙 Giao diện Tối / Sáng', description: 'Chuyển đổi giao diện bảo vệ mắt khi học ban đêm.' } });

    const driverObj = driver({
        showProgress: true,
        doneBtnText: 'Hoàn tất',
        nextBtnText: 'Tiếp theo',
        prevBtnText: 'Quay lại',
        steps: steps
    });

    driverObj.drive();
};

// Initialize Theme
initTheme();
console.log("Quiz Learning v2.0 Modular Architecture Initialized.");
