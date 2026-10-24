import React, { useState, useEffect } from 'react';
import { useQuiz } from '../context/QuizContext';
import { askGeminiExplanation, translateText } from '../services/aiService';
import { updateQuiz } from '../services/quizService';
import { useAuth } from '../context/AuthContext';
import { sanitizeHtml, formatAiExplanation } from '../services/sanitize';
import { 
    Shuffle, 
    Brain, 
    FileText, 
    Languages, 
    Bot, 
    Check, 
    CheckCircle, 
    XCircle, 
    AlertTriangle, 
    ArrowRight, 
    Loader2, 
    Lightbulb,
    RotateCcw
} from 'lucide-react';

export default function QuizScreen() {
    const { currentUser } = useAuth();
    const { 
        activeQuiz, 
        isStudentMode, 
        allQuestions, 
        setAllQuestions,
        queue, 
        currentQIndexInQueue, 
        mistakes, 
        isReviewMode,
        selectedOptions, 
        hasSubmitted, 
        toggleOption, 
        handleNext,
        shuffleQuestions,
        showToast,
        showPrompt,
        showConfirm
    } = useQuiz();

    // Inline Translation state
    const [isTranslating, setIsTranslating] = useState(false);
    const [targetLang, setTargetLang] = useState('vi');
    const [translatedQ, setTranslatedQ] = useState(null);
    const [translatedOpts, setTranslatedOpts] = useState([]);
    const [isTranslatingLoading, setIsTranslatingLoading] = useState(false);

    // AI Explanation state
    const [aiExplanation, setAiExplanation] = useState(null);
    const [isAskingAI, setIsAskingAI] = useState(false);

    const realIdx = queue[currentQIndexInQueue];
    const qData = allQuestions[realIdx];

    // Reset inline translations / AI explanations on question change
    useEffect(() => {
        setAiExplanation(null);
        if (isTranslating && qData) {
            handleTranslate(targetLang);
        }
    }, [currentQIndexInQueue]);

    // Keyboard navigation (1-9 for options, Enter for check/next)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === 'Enter') {
                if (selectedOptions.length > 0 || hasSubmitted) {
                    handleNext();
                }
                return;
            }

            const num = parseInt(e.key);
            if (num >= 1 && num <= 9 && qData) {
                const optIndex = num - 1;
                if (optIndex < qData.o.length && !hasSubmitted) {
                    toggleOption(optIndex);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hasSubmitted, handleNext, qData, selectedOptions.length, toggleOption]);

    if (!qData) return null;

    // Translation handler
    const handleTranslate = async (lang) => {
        setIsTranslatingLoading(true);
        try {
            const rawQ = qData.q.replace(/\[Hình minh họa:?.*?\]/gi, '');
            const promises = [translateText(rawQ, lang)];
            qData.o.forEach(opt => promises.push(translateText(opt, lang)));
            const results = await Promise.all(promises);
            setTranslatedQ(results[0]);
            setTranslatedOpts(results.slice(1));
        } catch (err) {
            console.error(err);
        } finally {
            setIsTranslatingLoading(false);
        }
    };

    const toggleTranslateView = () => {
        const next = !isTranslating;
        setIsTranslating(next);
        if (next) {
            handleTranslate(targetLang);
        }
    };

    // Ask AI handler
    const handleAskAI = async (forceRefresh = false) => {
        if (!hasSubmitted) {
            showToast("Vui lòng chốt đáp án trước khi xem giải thích nhé!", 'warning');
            return;
        }

        const selectedKey = selectedOptions.slice().sort().join(',');
        const correctKey = qData.a.slice().sort().join(',');

        if (!forceRefresh) {
            if (qData.ai_explanations && qData.ai_explanations[selectedKey]) {
                setAiExplanation(qData.ai_explanations[selectedKey]);
                return;
            }

            if (selectedKey === correctKey && qData.explanation) {
                setAiExplanation(qData.explanation);
                return;
            }
        }

        const apiKey = localStorage.getItem('GEMINI_API_KEY');
        if (!apiKey) {
            showPrompt(
                "Cài đặt Gemini AI Key",
                "Nhập Google Gemini API Key để dùng tính năng Hỏi AI.<br><br><a href='https://aistudio.google.com/app/apikey' target='_blank' rel='noreferrer' class='text-indigo-600 dark:text-indigo-400 font-semibold hover:underline'>Lấy API Key miễn phí</a>",
                "AIzaSy...",
                (key) => {
                    if (key.trim()) {
                        localStorage.setItem('GEMINI_API_KEY', key.trim());
                        handleAskAI();
                    }
                }
            );
            return;
        }

        setIsAskingAI(true);
        try {
            const explanation = await askGeminiExplanation(qData, selectedOptions, apiKey);
            setAiExplanation(explanation);

            // Save to question memory
            const updatedAll = [...allQuestions];
            if (!updatedAll[realIdx].ai_explanations) updatedAll[realIdx].ai_explanations = {};
            updatedAll[realIdx].ai_explanations[selectedKey] = explanation;
            setAllQuestions(updatedAll);

            if (!isStudentMode && activeQuiz) {
                updateQuiz(currentUser.uid, activeQuiz.id, { questions: updatedAll }).catch(console.error);
            }
            showToast("Đã lưu giải thích AI vĩnh viễn!", 'success');
        } catch (err) {
            console.error(err);
            showToast("Lỗi AI: " + err.message, 'error');
        } finally {
            setIsAskingAI(false);
        }
    };

    // PDF Export
    const exportPDF = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write('<html><head><title>Bộ đề: ' + (activeQuiz?.title || 'Ôn tập') + '</title>');
        printWindow.document.write('<style>body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; line-height: 1.6; } .question { margin-bottom: 25px; break-inside: avoid; } .option { margin-left: 20px; } .correct { font-weight: bold; color: #16a34a; } .explanation { color: #4b5563; font-size: 0.9em; margin-top: 8px; padding-left: 15px; border-left: 3px solid #e5e7eb; }</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write('<h2 style="text-align: center; margin-bottom: 30px;">' + (activeQuiz?.title || 'BỘ ĐỀ ÔN TẬP') + '</h2><hr style="margin-bottom: 30px;"/>');

        allQuestions.forEach((q, i) => {
            printWindow.document.write('<div class="question">');
            printWindow.document.write('<p><b>Câu ' + (i + 1) + ':</b> ' + q.q.replace(/<br>/g, '<br/>') + '</p>');
            q.o.forEach((opt, optIdx) => {
                const isCorrect = q.a.includes(optIdx);
                const optLetter = String.fromCharCode(65 + optIdx);
                printWindow.document.write('<div class="option ' + (isCorrect ? 'correct' : '') + '">' + optLetter + '. ' + opt + '</div>');
            });
            if (q.e) {
                printWindow.document.write('<div class="explanation"><b>Giải thích:</b> ' + q.e.replace(/<br>/g, '<br/>') + '</div>');
            }
            printWindow.document.write('</div>');
        });

        printWindow.document.write('</body></html>');
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 400);
    };

    // Render Question Text
    const formattedQ = qData.q.replace(/\[Hình minh họa:?.*?\]/gi, '<br/><span class="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-bold rounded-lg border border-amber-200 dark:border-amber-900/60">Hình minh họa</span><br/>');

    return (
        <div className={`w-full mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-5 md:p-8 animate-fade-in transition-all duration-300 ${
            isTranslating ? 'max-w-6xl' : 'max-w-3xl'
        }`}>
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 pb-4 border-b border-gray-100 dark:border-gray-700 gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-md">
                        {isReviewMode ? `Ôn câu sai: ${currentQIndexInQueue + 1}/${queue.length}` : `Tiến trình: ${currentQIndexInQueue + 1}/${queue.length}`}
                    </span>
                    {isReviewMode && (
                        <span className="text-xs font-bold text-amber-600 bg-amber-100 dark:bg-amber-950/40 px-2.5 py-1 rounded-md flex items-center gap-1">
                            Làm lại câu sai
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap gap-1.5 items-center">
                    {!isStudentMode && (
                        <button
                            onClick={shuffleQuestions}
                            className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-semibold py-1.5 px-2.5 rounded-lg transition items-center gap-1 hidden sm:inline-flex"
                        >
                            <Shuffle className="w-3.5 h-3.5" /> Trộn
                        </button>
                    )}
                    <button
                        onClick={exportPDF}
                        className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-semibold py-1.5 px-2.5 rounded-lg transition items-center gap-1 hidden sm:inline-flex"
                    >
                        <FileText className="w-3.5 h-3.5" /> PDF
                    </button>
                    <button
                        onClick={toggleTranslateView}
                        className={`text-xs font-semibold py-1.5 px-2.5 rounded-lg transition flex items-center gap-1 ${
                            isTranslating 
                                ? 'bg-indigo-600 text-white' 
                                : 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                        }`}
                    >
                        <Languages className="w-3.5 h-3.5" /> Dịch
                    </button>
                    <button
                        onClick={handleAskAI}
                        disabled={isAskingAI}
                        className="bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-xs font-semibold py-1.5 px-2.5 rounded-lg transition flex items-center gap-1 border border-purple-200 dark:border-purple-800 disabled:opacity-50"
                    >
                        {isAskingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
                        Hỏi AI
                    </button>
                </div>
            </div>

            {/* Questions Layout */}
            <div className={`grid gap-6 ${isTranslating ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                {/* Original Language Column */}
                <div>
                    <div className="mb-5 md:mb-6">
                        <h3 className="text-base md:text-xl font-semibold leading-relaxed text-gray-900 dark:text-gray-100">
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold mr-2">Câu {realIdx + 1}.</span>
                            <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(formattedQ) }} />
                        </h3>
                    </div>

                    <div className="space-y-3">
                        {qData.o.map((opt, idx) => {
                            const isSelected = selectedOptions.includes(idx);
                            const isCorrectAns = qData.a.includes(idx);

                            let btnStyle = "option-btn w-full text-left p-3.5 md:p-4 rounded-xl font-medium text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 text-sm md:text-base shadow-sm border-2 border-gray-200 dark:border-gray-700";
                            let icon = null;

                            if (hasSubmitted) {
                                if (isCorrectAns) {
                                    if (isSelected) {
                                        btnStyle += " correct";
                                        icon = <CheckCircle className="w-5 h-5 text-emerald-600 float-right mt-0.5" />;
                                    } else {
                                        if (qData.a.length > 1) {
                                            btnStyle += " bg-amber-50 border-amber-400 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200";
                                            icon = (
                                                <span className="float-right text-xs font-bold text-amber-600 flex items-center gap-1 mt-0.5">
                                                    <AlertTriangle className="w-4 h-4" /> (Chọn thiếu)
                                                </span>
                                            );
                                        } else {
                                            btnStyle += " correct";
                                            icon = <CheckCircle className="w-5 h-5 text-emerald-600 float-right mt-0.5" />;
                                        }
                                    }
                                } else if (isSelected) {
                                    btnStyle += " wrong";
                                    icon = <XCircle className="w-5 h-5 text-rose-600 float-right mt-0.5" />;
                                }
                            } else if (isSelected) {
                                btnStyle += " selected";
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => toggleOption(idx)}
                                    disabled={hasSubmitted}
                                    className={btnStyle}
                                >
                                    <span className="font-bold text-gray-400 dark:text-gray-500 mr-2">
                                        {String.fromCharCode(65 + idx)}.
                                    </span>
                                    {opt.replace(/^[A-H][\.\)]\s*/i, '')}
                                    {icon}
                                </button>
                            );
                        })}
                    </div>

                    {/* Pre-existing Explanation */}
                    {hasSubmitted && qData.e && (
                        <div className={`mt-4 p-4 rounded-2xl border-l-4 text-xs md:text-sm animate-fade-in ${
                            qData.e.includes("⚠️") 
                                ? "bg-rose-50 border-rose-500 text-rose-900 dark:bg-rose-950/30 dark:text-rose-200 font-bold"
                                : "bg-indigo-50/70 border-indigo-500 text-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-200"
                        }`}>
                            <strong className="flex items-center gap-1.5 mb-1 text-indigo-700 dark:text-indigo-300">
                                <Lightbulb className="w-4 h-4 text-amber-500" /> Giải thích:
                            </strong>
                            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(qData.e.replace(/giải thích:\s*/i, '')) }} />
                        </div>
                    )}

                    {/* Dynamic AI Explanation */}
                    {aiExplanation && (
                        <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800 text-purple-950 dark:text-purple-100 text-xs md:text-sm leading-relaxed animate-fade-in shadow-inner">
                            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-purple-200/60 dark:border-purple-800/60">
                                <strong className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300">
                                    <Bot className="w-4 h-4" /> AI Giải thích chuyên sâu:
                                </strong>
                                <button
                                    onClick={() => handleAskAI(true)}
                                    disabled={isAskingAI}
                                    className="text-[11px] text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200 font-semibold flex items-center gap-1 transition px-2 py-0.5 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg disabled:opacity-50"
                                    title="Tạo lại giải thích AI mới"
                                >
                                    <RotateCcw className={`w-3 h-3 ${isAskingAI ? 'animate-spin' : ''}`} />
                                    <span>Hỏi lại</span>
                                </button>
                            </div>
                            <div 
                                className="leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: formatAiExplanation(aiExplanation) }}
                            />
                        </div>
                    )}
                </div>

                {/* Translated Column */}
                {isTranslating && (
                    <div className="border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700 pt-5 md:pt-0 md:pl-6 relative animate-fade-in">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-indigo-100 dark:border-indigo-900">
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                                <Languages className="w-3.5 h-3.5" /> Bản Dịch Tự Động
                            </span>
                            <select
                                value={targetLang}
                                onChange={(e) => {
                                    setTargetLang(e.target.value);
                                    handleTranslate(e.target.value);
                                }}
                                className="text-xs p-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:border-indigo-500 font-semibold"
                            >
                                <option value="vi">Tiếng Việt</option>
                                <option value="en">Tiếng Anh</option>
                                <option value="fr">Tiếng Pháp</option>
                                <option value="ja">Tiếng Nhật</option>
                                <option value="ko">Tiếng Hàn</option>
                                <option value="zh-CN">Tiếng Trung</option>
                            </select>
                        </div>

                        {isTranslatingLoading ? (
                            <div className="py-12 text-center text-xs text-indigo-600 flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" /> Đang dịch nội dung...
                            </div>
                        ) : (
                            <>
                                <div className="mb-5 md:mb-6">
                                    <h3 className="text-base md:text-lg font-medium leading-relaxed text-indigo-900 dark:text-indigo-300">
                                        {translatedQ}
                                    </h3>
                                </div>
                                <div className="space-y-3">
                                    {translatedOpts.map((opt, i) => (
                                        <div
                                            key={i}
                                            className="w-full text-left p-3.5 rounded-xl border-2 border-indigo-100 dark:border-indigo-900/40 text-indigo-900 dark:text-indigo-100 bg-indigo-50/50 dark:bg-indigo-950/20 text-xs md:text-sm font-medium"
                                        >
                                            <span className="font-bold mr-2 text-indigo-400">{String.fromCharCode(65 + i)}.</span>
                                            {opt}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 md:mt-8 flex justify-end">
                <button
                    onClick={handleNext}
                    disabled={selectedOptions.length === 0 && !hasSubmitted}
                    className={`w-full sm:w-auto font-bold py-3.5 px-8 rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-sm ${
                        hasSubmitted
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : selectedOptions.length > 0
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60'
                    }`}
                >
                    {hasSubmitted ? (
                        <>Tiếp tục (Enter) <ArrowRight className="w-4 h-4" /></>
                    ) : (
                        <>Kiểm tra (Enter) <Check className="w-4 h-4" /></>
                    )}
                </button>
            </div>
        </div>
    );
}
