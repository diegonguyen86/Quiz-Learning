import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { 
    fetchUserQuizzes, 
    createQuiz, 
    updateQuiz, 
    deleteQuizDoc, 
    resetQuizDoc, 
    refreshShareCodeDoc, 
    importCopyQuizByCode, 
    joinClassroomByCode,
    saveSessionState,
    clearSessionState,
    fetchStudentsList
} from '../services/quizService';
import { db } from '../services/firebase';

const QuizContext = createContext(null);
const SEC_SIZE = 12;

export function QuizProvider({ children }) {
    const { currentUser } = useAuth();

    // App Navigation State with Browser History (Avoid exiting web on Back/Return)
    const [screen, setScreenState] = useState(() => {
        const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
        return ['dashboard', 'import', 'preview', 'welcome', 'quiz', 'result', 'finish'].includes(hash) ? hash : 'dashboard';
    });

    const setScreen = useCallback((newScreen, pushHistory = true) => {
        setScreenState(newScreen);
        if (pushHistory && typeof window !== 'undefined' && window.history) {
            window.history.pushState({ screen: newScreen }, '', '#' + newScreen);
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!window.history.state || !window.history.state.screen) {
            window.history.replaceState({ screen }, '', '#' + screen);
        }

        const handlePopState = (event) => {
            if (event.state && event.state.screen) {
                setScreenState(event.state.screen);
            } else {
                setScreenState('dashboard');
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [screen]);

    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

    // Quizzes Cache
    const [quizzes, setQuizzes] = useState([]);
    const [isQuizzesLoading, setIsQuizzesLoading] = useState(true);
    const [searchFilter, setSearchFilter] = useState('');

    // Active Quiz State
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [isStudentMode, setIsStudentMode] = useState(false);
    const [allQuestions, setAllQuestions] = useState([]);
    const [totalSections, setTotalSections] = useState(0);
    const [currentSection, setCurrentSection] = useState(0);
    const [queue, setQueue] = useState([]);
    const [currentQIndexInQueue, setCurrentQIndexInQueue] = useState(0);
    const [mistakes, setMistakes] = useState([]);
    const [isReviewMode, setIsReviewMode] = useState(false);
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [hasSubmitted, setHasSubmitted] = useState(false);

    // Editing / Import / Preview
    const [editQuizId, setEditQuizId] = useState(null);
    const [pendingTitle, setPendingTitle] = useState('');
    const [pendingQuestions, setPendingQuestions] = useState([]);
    const [pendingRawText, setPendingRawText] = useState('');

    // Modals
    const [toasts, setToasts] = useState([]);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, isDanger: false });
    const [promptModal, setPromptModal] = useState({ isOpen: false, title: '', message: '', placeholder: '', onConfirm: null });
    const [learnModal, setLearnModal] = useState({ isOpen: false, quizId: null, defaultMode: '' });
    const [scoreModal, setScoreModal] = useState({ isOpen: false, quizId: null, students: [], loading: false });
    const [analyticsModal, setAnalyticsModal] = useState({ isOpen: false, quiz: null });

    // Toast helper
    const showToast = useCallback((message, type = 'info') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3500);
    }, []);

    // Confirm helper
    const showConfirm = useCallback((title, message, onConfirm, okText = 'Đồng ý', isDanger = false) => {
        setConfirmModal({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                if (onConfirm) onConfirm();
            },
            okText,
            isDanger
        });
    }, []);

    const closeConfirm = useCallback(() => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    }, []);

    // Prompt helper
    const showPrompt = useCallback((title, message, placeholder, onConfirm) => {
        setPromptModal({
            isOpen: true,
            title,
            message,
            placeholder,
            onConfirm: (val) => {
                setPromptModal(prev => ({ ...prev, isOpen: false }));
                if (onConfirm) onConfirm(val);
            }
        });
    }, []);

    const closePrompt = useCallback(() => {
        setPromptModal(prev => ({ ...prev, isOpen: false }));
    }, []);

    // Theme effect
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    }, []);

    // Load Quizzes
    const loadQuizzes = useCallback(async (silent = false) => {
        if (!currentUser) {
            setQuizzes([]);
            setIsQuizzesLoading(false);
            return;
        }
        if (!silent) setIsQuizzesLoading(true);
        try {
            const data = await fetchUserQuizzes(currentUser.uid);
            setQuizzes(data);
        } catch (error) {
            console.error(error);
            showToast("Lỗi nạp kho đề: " + error.message, 'error');
        } finally {
            setIsQuizzesLoading(false);
        }
    }, [currentUser, showToast]);

    useEffect(() => {
        if (currentUser) {
            loadQuizzes();
        } else {
            setQuizzes([]);
            setIsQuizzesLoading(false);
        }
    }, [currentUser, loadQuizzes]);

    // OPTIMISTIC DELETE: Instant UI removal with zero wait time!
    const deleteQuiz = useCallback((quizId, quizTitle) => {
        const isStudent = quizzes.find(q => q.id === quizId)?.isClassroom;
        const msg = isStudent 
            ? `Bạn muốn rời khỏi lớp học <b>"${quizTitle}"</b>?` 
            : `Bạn có chắc muốn xóa vĩnh viễn bộ đề <b>"${quizTitle}"</b>?<br/><span class="text-rose-500 text-xs">Toàn bộ câu hỏi và tiến trình sẽ bị xóa hoàn toàn.</span>`;

        showConfirm("Xác nhận xóa", msg, async () => {
            // 1. Optimistic removal from state immediately (0ms delay)
            const backup = quizzes;
            setQuizzes(prev => prev.filter(q => q.id !== quizId));
            showToast(`Đã xóa bộ đề "${quizTitle}"`, 'info');

            // 2. Background Firestore request
            try {
                await deleteQuizDoc(currentUser.uid, quizId);
            } catch (err) {
                console.error("Delete failed:", err);
                showToast("Lỗi xóa trên máy chủ: " + err.message, 'error');
                // Rollback on error
                setQuizzes(backup);
            }
        }, "Xóa vĩnh viễn", true);
    }, [currentUser, quizzes, showConfirm, showToast]);

    // OPTIMISTIC RESET: Instantly set progress to 0 and allow choosing mode again
    const resetQuiz = useCallback((quizId, quizTitle) => {
        showConfirm("Reset tiến độ", `Bạn muốn reset tiến độ của <b>"${quizTitle}"</b> về 0% để chọn lại chế độ và học lại từ đầu?`, async () => {
            setQuizzes(prev => prev.map(q => {
                if (q.id === quizId) {
                    const copy = { ...q, progress: 0 };
                    delete copy.learnMode;
                    delete copy.sessionState;
                    return copy;
                }
                return q;
            }));
            showToast(`Đã reset tiến độ bộ đề "${quizTitle}"`, 'success');

            try {
                await resetQuizDoc(currentUser.uid, quizId);
            } catch (e) {
                console.error(e);
                showToast("Lỗi cập nhật Firestore!", 'error');
            }
        });
    }, [currentUser, showConfirm, showToast]);

    // OPTIMISTIC SHARE CODE REFRESH
    const refreshShareCode = useCallback((quizId) => {
        showConfirm("Đổi mã bảo mật mới?", "Những người đang giữ mã cũ sẽ không thể copy hay vào lớp học được nữa.", async () => {
            try {
                const newCode = await refreshShareCodeDoc(currentUser.uid, quizId);
                setQuizzes(prev => prev.map(q => q.id === quizId ? { ...q, shareCode: newCode } : q));
                showToast("Đã đổi sang mã mới: " + newCode, 'success');
            } catch (e) {
                console.error(e);
                showToast("Lỗi cập nhật mã!", 'error');
            }
        });
    }, [currentUser, showConfirm, showToast]);

    // Import / Join
    const importCopyQuiz = useCallback(async (code) => {
        try {
            const newQuiz = await importCopyQuizByCode(currentUser.uid, code);
            setQuizzes(prev => [newQuiz, ...prev]);
            showToast("Đã sao chép bộ đề thành công vào Kho cá nhân!", 'success');
        } catch (e) {
            showToast(e.message, 'error');
        }
    }, [currentUser, showToast]);

    const joinClassroom = useCallback(async (code) => {
        try {
            const joined = await joinClassroomByCode(currentUser.uid, currentUser, code, SEC_SIZE);
            setQuizzes(prev => {
                const exists = prev.find(q => q.id === joined.id);
                if (exists) return prev.map(q => q.id === joined.id ? joined : q);
                return [joined, ...prev];
            });
            showToast("Đã tham gia lớp học thành công!", 'success');
        } catch (e) {
            showToast(e.message, 'error');
        }
    }, [currentUser, showToast]);

    // Open Quiz and Setup Sections
    const openQuiz = useCallback(async (quizId, mode = 'quick') => {
        let quiz = quizzes.find(q => q.id === quizId);
        if (!quiz || !quiz.questions) {
            try {
                const docSnap = await db.collection("users").doc(currentUser.uid).collection("my_quizzes").doc(quizId).get();
                if (docSnap.exists) quiz = { id: docSnap.id, ...docSnap.data() };
            } catch (e) {
                showToast("Lỗi mở đề!", 'error');
                return;
            }
        }

        if (!quiz) return;

        setActiveQuiz(quiz);
        let questions = quiz.questions || [];
        let isClass = Boolean(quiz.isClassroom);
        setIsStudentMode(isClass);

        if (isClass) {
            try {
                const teacherDoc = await db.doc(quiz.refPath).get();
                if (!teacherDoc.exists) {
                    showToast("Giáo viên đã xóa lớp học này!", 'error');
                    await deleteQuizDoc(currentUser.uid, quizId);
                    setQuizzes(prev => prev.filter(q => q.id !== quizId));
                    setScreen('dashboard');
                    return;
                }
                questions = teacherDoc.data().questions || [];
            } catch (e) {
                showToast("Lỗi tải lớp học!", 'error');
                return;
            }
        }

        if (questions.length === 0) {
            showToast("Bộ đề này chưa có câu hỏi!", 'warning');
            return;
        }

        // Mode handling: Spaced Repetition SRS
        if (mode === 'srs') {
            const now = new Date().toISOString();
            let srsQs = questions.filter(q => !q.nextReview || q.nextReview <= now);
            if (srsQs.length === 0) {
                showToast("Tuyệt vời! Bạn không có câu nào cần ôn tập hôm nay.", 'success');
                return;
            }

            // Shuffle SRS
            for (let i = srsQs.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [srsQs[i], srsQs[j]] = [srsQs[j], srsQs[i]];
            }

            const nonSrs = questions.filter(q => q.nextReview && q.nextReview > now);
            questions = [...srsQs, ...nonSrs];
            setTotalSections(Math.ceil(srsQs.length / SEC_SIZE));
            setCurrentSection(0);
        } else {
            setTotalSections(Math.ceil(questions.length / SEC_SIZE));
            setCurrentSection(quiz.progress || 0);
        }

        setAllQuestions(questions);

        // Persist learnMode so the user doesn't have to re-select next time
        if (currentUser && !isClass && mode) {
            updateQuiz(currentUser.uid, quizId, { learnMode: mode }).catch(console.error);
            setQuizzes(prev => prev.map(q => q.id === quizId ? { ...q, learnMode: mode } : q));
        }

        if ((quiz.progress || 0) >= Math.ceil(questions.length / SEC_SIZE) && mode !== 'srs') {
            setScreen('finish');
        } else {
            setScreen('welcome');
        }
    }, [currentUser, quizzes, setScreen, showToast]);

    // Start Next Section
    const startNextSection = useCallback(() => {
        setIsReviewMode(false);
        setMistakes([]);
        const startIdx = currentSection * SEC_SIZE;
        const endIdx = Math.min(startIdx + SEC_SIZE, allQuestions.length);
        const newQueue = [];
        for (let i = startIdx; i < endIdx; i++) newQueue.push(i);

        setQueue(newQueue);
        setCurrentQIndexInQueue(0);
        setSelectedOptions([]);
        setHasSubmitted(false);
        setScreen('quiz');
    }, [allQuestions.length, currentSection]);

    // Retry Mistakes
    const startRetry = useCallback(() => {
        setIsReviewMode(true);
        setQueue([...mistakes]);
        setMistakes([]);
        setCurrentQIndexInQueue(0);
        setSelectedOptions([]);
        setHasSubmitted(false);
        setScreen('quiz');
    }, [mistakes]);

    // Option selection
    const toggleOption = useCallback((idx) => {
        if (hasSubmitted) return;
        setSelectedOptions(prev => {
            if (prev.includes(idx)) return prev.filter(i => i !== idx);
            return [...prev, idx];
        });
    }, [hasSubmitted]);

    // Submit answer or proceed to next question
    const handleNext = useCallback(() => {
        const realIdx = queue[currentQIndexInQueue];
        const qData = allQuestions[realIdx];
        if (!qData) return;

        if (!hasSubmitted) {
            // Grade Answer
            setHasSubmitted(true);
            let isCorrect = true;
            if (selectedOptions.length !== qData.a.length) {
                isCorrect = false;
            } else {
                for (let ans of qData.a) {
                    if (!selectedOptions.includes(ans)) {
                        isCorrect = false;
                        break;
                    }
                }
            }

            if (!isCorrect) {
                setMistakes(prev => prev.includes(realIdx) ? prev : [...prev, realIdx]);
            }
        } else {
            // Proceed to next question
            if (currentQIndexInQueue + 1 < queue.length) {
                setCurrentQIndexInQueue(prev => prev + 1);
                setSelectedOptions([]);
                setHasSubmitted(false);
            } else {
                // Section Finished
                if (mistakes.length === 0) {
                    const nextSec = currentSection + 1;
                    setCurrentSection(nextSec);
                    if (activeQuiz) {
                        updateQuizDocProgress(nextSec);
                    }
                }
                setScreen('result');
            }
        }
    }, [activeQuiz, allQuestions, currentQIndexInQueue, currentSection, hasSubmitted, mistakes.length, queue, selectedOptions]);

    const updateQuizDocProgress = async (newProgress) => {
        if (!currentUser || !activeQuiz) return;
        setQuizzes(prev => prev.map(q => q.id === activeQuiz.id ? { ...q, progress: newProgress } : q));
        try {
            await updateQuiz(currentUser.uid, activeQuiz.id, { progress: newProgress });
            if (isStudentMode && activeQuiz.refPath) {
                db.doc(activeQuiz.refPath).collection("students").doc(currentUser.uid).set({
                    progress: newProgress,
                    lastActive: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true }).catch(console.error);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Shuffle questions
    const shuffleQuestions = useCallback(() => {
        showConfirm("Trộn đề", "Xáo trộn ngẫu nhiên toàn bộ câu hỏi trong bộ đề?", () => {
            const shuffled = [...allQuestions];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            setAllQuestions(shuffled);
            setCurrentSection(0);
            if (!isStudentMode && activeQuiz) {
                updateQuiz(currentUser.uid, activeQuiz.id, { questions: shuffled, progress: 0 }).catch(console.error);
            }
            startNextSection();
        });
    }, [activeQuiz, allQuestions, currentUser, isStudentMode, showConfirm, startNextSection]);

    // Reset and Restart current quiz
    const resetAndRestart = useCallback(() => {
        showConfirm("Làm lại", "Xác nhận làm lại từ đầu bộ đề?", () => {
            if (!isStudentMode && activeQuiz) {
                updateQuiz(currentUser.uid, activeQuiz.id, { progress: 0 }).catch(console.error);
            }
            setCurrentSection(0);
            startNextSection();
        });
    }, [activeQuiz, currentUser, isStudentMode, showConfirm, startNextSection]);

    return (
        <QuizContext.Provider value={{
            screen, setScreen,
            theme, toggleTheme,
            quizzes, setQuizzes, isQuizzesLoading, searchFilter, setSearchFilter, loadQuizzes,
            deleteQuiz, resetQuiz, refreshShareCode, importCopyQuiz, joinClassroom,
            openQuiz, activeQuiz, isStudentMode,
            allQuestions, setAllQuestions, totalSections, currentSection,
            queue, currentQIndexInQueue, mistakes, isReviewMode,
            selectedOptions, hasSubmitted, toggleOption, handleNext,
            startNextSection, startRetry, shuffleQuestions, resetAndRestart,
            editQuizId, setEditQuizId, pendingTitle, setPendingTitle, pendingQuestions, setPendingQuestions,
            pendingRawText, setPendingRawText,
            toasts, showToast,
            confirmModal, showConfirm, closeConfirm,
            promptModal, showPrompt, closePrompt,
            learnModal, setLearnModal,
            scoreModal, setScoreModal,
            analyticsModal, setAnalyticsModal,
            SEC_SIZE
        }}>
            {children}
        </QuizContext.Provider>
    );
}

export function useQuiz() {
    return useContext(QuizContext);
}
