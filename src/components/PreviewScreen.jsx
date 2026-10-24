import React, { useState, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuiz } from '../context/QuizContext';
import { createQuiz, updateQuiz } from '../services/quizService';
import { 
    Eye, 
    ArrowDown, 
    ArrowLeft, 
    Save, 
    Trash2, 
    Plus, 
    X, 
    AlertTriangle, 
    Lightbulb, 
    GripVertical,
    Loader2,
    CheckCircle2,
    ListFilter,
    Wand2,
    Check
} from 'lucide-react';

export default function PreviewScreen({ questions: initialQuestions, title, onBack, onSaved }) {
    const { currentUser } = useAuth();
    const { editQuizId, quizzes, setQuizzes, showToast, showConfirm } = useQuiz();
    const [questions, setQuestions] = useState(initialQuestions);
    const [filter, setFilter] = useState('all'); // 'all' | 'multi' | 'no-answer' | 'single'
    const [isSaving, setIsSaving] = useState(false);
    const containerRef = useRef(null);

    // Question statistics
    const stats = useMemo(() => {
        let multi = 0;
        let noAns = 0;
        let single = 0;
        questions.forEach(q => {
            if (!q.a || q.a.length === 0) noAns++;
            else if (q.a.length > 1) multi++;
            else single++;
        });
        return { multi, noAns, single, total: questions.length };
    }, [questions]);

    const filteredQuestions = useMemo(() => {
        return questions.map((q, idx) => ({ q, originalIndex: idx })).filter(({ q }) => {
            if (filter === 'multi') return (q.a || []).length > 1;
            if (filter === 'no-answer') return !q.a || q.a.length === 0;
            if (filter === 'single') return (q.a || []).length === 1;
            return true;
        });
    }, [questions, filter]);

    const toggleAns = (qIndex, optIndex, isChecked) => {
        setQuestions(prev => {
            const copy = [...prev];
            const q = { ...copy[qIndex] };
            if (isChecked) {
                if (!q.a.includes(optIndex)) q.a = [...q.a, optIndex];
            } else {
                q.a = q.a.filter(i => i !== optIndex);
            }
            copy[qIndex] = q;
            return copy;
        });
    };

    const keepOnlyFirstAnswer = (qIndex) => {
        setQuestions(prev => {
            const copy = [...prev];
            const q = { ...copy[qIndex] };
            if (q.a && q.a.length > 0) {
                q.a = [q.a[0]];
                copy[qIndex] = q;
            }
            return copy;
        });
        showToast(`Đã chuyển Câu ${qIndex + 1} về 1 đáp án duy nhất!`, 'success');
    };

    const handleBulkNormalizeAnswers = () => {
        if (stats.multi === 0) {
            showToast("Không có câu hỏi nào có nhiều đáp án!", 'info');
            return;
        }
        showConfirm(
            "Chuẩn hóa về 1 đáp án",
            `Tìm thấy ${stats.multi} câu hỏi đang có từ 2 đáp án trở lên. Bạn có muốn tự động chỉ giữ lại đáp án đầu tiên cho tất cả ${stats.multi} câu này không?`,
            () => {
                setQuestions(prev => prev.map(q => {
                    if (q.a && q.a.length > 1) {
                        return { ...q, a: [q.a[0]] };
                    }
                    return q;
                }));
                showToast(`Đã chuẩn hóa ${stats.multi} câu về 1 đáp án thành công!`, 'success');
                setFilter('all');
            },
            "Chuẩn hóa tất cả",
            false
        );
    };

    const updateQuestionText = (qIndex, newText) => {
        setQuestions(prev => {
            const copy = [...prev];
            copy[qIndex] = { ...copy[qIndex], q: newText.replace(/\n/g, '<br>') };
            return copy;
        });
    };

    const updateOptionText = (qIndex, optIndex, newText) => {
        setQuestions(prev => {
            const copy = [...prev];
            const opts = [...copy[qIndex].o];
            opts[optIndex] = newText;
            copy[qIndex] = { ...copy[qIndex], o: opts };
            return copy;
        });
    };

    const updateExplanation = (qIndex, newText) => {
        setQuestions(prev => {
            const copy = [...prev];
            copy[qIndex] = { ...copy[qIndex], e: newText.replace(/\n/g, '<br>') };
            return copy;
        });
    };

    const addOption = (qIndex) => {
        setQuestions(prev => {
            const copy = [...prev];
            const q = { ...copy[qIndex] };
            const opts = [...q.o];
            const nextLetter = String.fromCharCode(65 + opts.length);
            opts.push(`${nextLetter}. `);
            q.o = opts;
            copy[qIndex] = q;
            return copy;
        });
    };

    const removeOption = (qIndex, optIndex) => {
        if (questions[qIndex].o.length <= 2) {
            showToast("Một câu hỏi cần có ít nhất 2 đáp án!", 'warning');
            return;
        }
        setQuestions(prev => {
            const copy = [...prev];
            const q = { ...copy[qIndex] };
            q.o = q.o.filter((_, i) => i !== optIndex);
            q.a = q.a.filter(a => a !== optIndex).map(a => a > optIndex ? a - 1 : a);
            copy[qIndex] = q;
            return copy;
        });
    };

    const deleteQuestion = (qIndex) => {
        showConfirm("Xóa câu hỏi", `Bạn có chắc muốn xóa câu ${qIndex + 1}?`, () => {
            setQuestions(prev => prev.filter((_, i) => i !== qIndex));
        }, "Xóa", true);
    };

    const scrollToNextError = () => {
        if (!containerRef.current) return;
        const errorCards = containerRef.current.querySelectorAll('.error-card');
        if (errorCards.length === 0) {
            showToast("Tuyệt vời! Không còn câu nào thiếu đáp án.", 'success');
            return;
        }

        const currentScroll = containerRef.current.scrollTop;
        let target = Array.from(errorCards).find(el => el.offsetTop > currentScroll + 50) || errorCards[0];

        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.add('ring-4', 'ring-rose-400');
        setTimeout(() => target.classList.remove('ring-4', 'ring-rose-400'), 1500);
    };

    const scrollToNextMulti = () => {
        if (!containerRef.current) return;
        const multiCards = containerRef.current.querySelectorAll('.multi-card');
        if (multiCards.length === 0) {
            showToast("Không có câu nào có nhiều đáp án trong danh sách hiển thị!", 'info');
            return;
        }

        const currentScroll = containerRef.current.scrollTop;
        let target = Array.from(multiCards).find(el => el.offsetTop > currentScroll + 50) || multiCards[0];

        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.add('ring-4', 'ring-amber-400');
        setTimeout(() => target.classList.remove('ring-4', 'ring-amber-400'), 1500);
    };

    const handleSave = async () => {
        if (questions.length === 0) {
            showToast("Bộ đề không thể để trống!", 'warning');
            return;
        }

        setIsSaving(true);
        try {
            if (editQuizId) {
                // Safeguard existing progress: calculate new section bounds
                const newTotalSec = Math.ceil(questions.length / 12);
                const currentQuiz = quizzes.find(q => q.id === editQuizId);
                let safeProgress = currentQuiz?.progress || 0;

                // If question count was reduced below current progress section, safely clamp it
                if (safeProgress >= newTotalSec) {
                    safeProgress = Math.max(0, newTotalSec - 1);
                }

                const patch = {
                    title,
                    questions,
                    progress: safeProgress,
                    totalSections: newTotalSec
                };

                await updateQuiz(currentUser.uid, editQuizId, patch);
                setQuizzes(prev => prev.map(q => q.id === editQuizId ? { ...q, ...patch } : q));
                showToast("Đã cập nhật bộ đề và đồng bộ tiến trình học an toàn!", 'success');
            } else {
                await createQuiz(currentUser.uid, title, questions);
                showToast("Đã lưu bộ đề mới thành công!", 'success');
            }
            onSaved();
        } catch (err) {
            console.error(err);
            showToast("Lỗi khi lưu bộ đề: " + err.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-5xl w-full h-[88vh] flex flex-col bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-5 md:p-8 animate-fade-in mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-3 shrink-0 pb-3 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg md:text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <Eye className="w-5 h-5 text-indigo-600" />
                    Kiểm tra bộ đề: <span className="text-indigo-600 dark:text-indigo-400">{title}</span>
                </h2>
                <div className="flex items-center flex-wrap gap-2">
                    {stats.noAns > 0 && (
                        <button
                            type="button"
                            onClick={scrollToNextError}
                            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-100 transition dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-400"
                            title="Cuộn tới câu chưa có đáp án"
                        >
                            <ArrowDown className="w-3.5 h-3.5" /> {stats.noAns} câu thiếu ĐA
                        </button>
                    )}
                    {stats.multi > 0 && (
                        <button
                            type="button"
                            onClick={scrollToNextMulti}
                            className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-300 hover:bg-amber-100 transition dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300"
                            title="Cuộn tới câu có từ 2 đáp án trở lên"
                        >
                            <ArrowDown className="w-3.5 h-3.5" /> {stats.multi} câu nhiều ĐA
                        </button>
                    )}
                    <span className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800">
                        {questions.length} câu hỏi
                    </span>
                </div>
            </div>

            {/* Filter Pills & Bulk Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 p-2.5 bg-gray-50 dark:bg-gray-900/60 rounded-2xl border border-gray-100 dark:border-gray-700/80 shrink-0">
                <div className="flex items-center flex-wrap gap-1.5">
                    <span className="text-xs font-bold text-gray-400 flex items-center gap-1 mr-1">
                        <ListFilter className="w-3.5 h-3.5" /> Bộ lọc:
                    </span>
                    <button
                        type="button"
                        onClick={() => setFilter('all')}
                        className={`text-xs px-3 py-1 rounded-xl font-bold transition ${
                            filter === 'all'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        Tất cả ({stats.total})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter('multi')}
                        className={`text-xs px-3 py-1 rounded-xl font-bold transition flex items-center gap-1 ${
                            filter === 'multi'
                                ? 'bg-amber-500 text-white shadow-sm'
                                : stats.multi > 0
                                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-100'
                                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                        }`}
                    >
                        {stats.multi > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>}
                        Nhiều đáp án ({stats.multi})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter('no-answer')}
                        className={`text-xs px-3 py-1 rounded-xl font-bold transition flex items-center gap-1 ${
                            filter === 'no-answer'
                                ? 'bg-rose-600 text-white shadow-sm'
                                : stats.noAns > 0
                                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-100'
                                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                        }`}
                    >
                        {stats.noAns > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>}
                        Thiếu đáp án ({stats.noAns})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter('single')}
                        className={`text-xs px-3 py-1 rounded-xl font-bold transition ${
                            filter === 'single'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        Hợp lệ 1 ĐA ({stats.single})
                    </button>
                </div>

                {stats.multi > 0 && (
                    <button
                        type="button"
                        onClick={handleBulkNormalizeAnswers}
                        className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-xl transition shadow-sm flex items-center gap-1.5 active:scale-95 ml-auto"
                        title="Tự động giữ lại đáp án đầu tiên cho tất cả câu đang chọn nhiều đáp án"
                    >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Chuẩn hóa tất cả về 1 ĐA ({stats.multi})</span>
                    </button>
                )}
            </div>

            {/* Instruction Warning */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 p-2.5 mb-3 rounded-xl text-xs font-medium text-amber-900 dark:text-amber-200 shrink-0 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Bạn có thể tick chọn đáp án đúng (tô màu xanh), chỉnh sửa câu hỏi trực tiếp hoặc bấm vào tab <b>Nhiều đáp án ({stats.multi})</b> để lọc nhanh các câu cần kiểm tra.</span>
            </div>

            {/* Questions Container */}
            <div ref={containerRef} className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2 mb-4">
                {filteredQuestions.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Không có câu hỏi nào trong mục này</p>
                        <p className="text-xs text-gray-400 mt-1">Hãy bấm vào tab "Tất cả ({stats.total})" để xem toàn bộ danh sách câu hỏi.</p>
                        <button
                            type="button"
                            onClick={() => setFilter('all')}
                            className="mt-3 text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl font-bold hover:bg-indigo-100 transition"
                        >
                            Xem tất cả ({stats.total})
                        </button>
                    </div>
                ) : (
                    filteredQuestions.map(({ q, originalIndex }) => {
                        const hasError = !q.a || q.a.length === 0;
                        const isMulti = q.a && q.a.length > 1;

                        return (
                            <div
                                key={originalIndex}
                                className={`p-4 bg-white dark:bg-gray-900 border rounded-2xl shadow-sm relative transition-all ${
                                    hasError 
                                        ? 'border-rose-400 dark:border-rose-600 error-card shadow-rose-100' 
                                        : isMulti
                                            ? 'border-amber-400 dark:border-amber-600 multi-card shadow-amber-100'
                                            : 'border-gray-200 dark:border-gray-700'
                                }`}
                            >
                                <div className={`absolute -top-3 left-4 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                    hasError 
                                        ? 'bg-rose-500 text-white border-rose-600' 
                                        : isMulti
                                            ? 'bg-amber-500 text-white border-amber-600'
                                            : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                                }`}>
                                    Câu {originalIndex + 1}
                                </div>

                                <button
                                    onClick={() => deleteQuestion(originalIndex)}
                                    className="absolute top-2.5 right-2.5 text-gray-400 hover:text-rose-500 p-1.5 rounded-lg transition"
                                    title="Xóa câu hỏi"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>

                                {/* No Answer Alert */}
                                {hasError && (
                                    <div className="mb-2 mt-1 text-xs p-2 bg-rose-50 text-rose-800 rounded-lg border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900 flex items-center gap-1.5 font-medium">
                                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                        Chưa có đáp án đúng cho câu này. Hãy đánh dấu checkbox bên dưới!
                                    </div>
                                )}

                                {/* Multi Answer Alert & Quick Fix */}
                                {isMulti && (
                                    <div className="mb-2 mt-1 text-xs p-2.5 bg-amber-50 text-amber-900 rounded-xl border border-amber-300 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                        <div className="flex items-center gap-1.5 font-bold">
                                            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                            <span>Câu này đang chọn {q.a.length} đáp án đúng: {q.a.map(i => String.fromCharCode(65 + i)).join(', ')}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => keepOnlyFirstAnswer(originalIndex)}
                                            className="text-xs bg-white dark:bg-gray-800 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-bold px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-700 transition shadow-sm shrink-0 flex items-center gap-1"
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                            <span>Chỉ giữ đáp án {String.fromCharCode(65 + q.a[0])}</span>
                                        </button>
                                    </div>
                                )}

                                {/* Question Text */}
                                <div className="font-semibold text-base mb-3 mt-1 border-b border-dashed border-gray-200 dark:border-gray-700 pb-2 mr-8">
                                    <textarea
                                        value={q.q.replace(/<br>/g, '\n')}
                                        onChange={(e) => updateQuestionText(originalIndex, e.target.value)}
                                        rows={Math.max(2, (q.q.match(/<br>/g) || []).length + 1)}
                                        className="w-full bg-transparent border-none resize-none focus:ring-0 outline-none text-gray-800 dark:text-gray-100 text-sm leading-relaxed"
                                    />
                                </div>

                                {/* Options */}
                                <div className="space-y-1.5">
                                    {q.o.map((opt, optIndex) => {
                                        const isCorrect = (q.a || []).includes(optIndex);
                                        return (
                                            <div
                                                key={optIndex}
                                                className={`flex items-center p-2 rounded-xl border text-sm transition-colors ${
                                                    isCorrect
                                                        ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800'
                                                        : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isCorrect}
                                                    onChange={(e) => toggleAns(originalIndex, optIndex, e.target.checked)}
                                                    className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 mr-3 cursor-pointer shrink-0"
                                                />
                                                <input
                                                    type="text"
                                                    value={opt}
                                                    onChange={(e) => updateOptionText(originalIndex, optIndex, e.target.value)}
                                                    className={`flex-1 bg-transparent border-none focus:ring-0 outline-none w-full text-xs md:text-sm ${
                                                        isCorrect ? 'text-emerald-800 font-bold dark:text-emerald-300' : 'text-gray-700 dark:text-gray-200'
                                                    }`}
                                                />
                                                <button
                                                    onClick={() => removeOption(originalIndex, optIndex)}
                                                    className="ml-2 text-gray-400 hover:text-rose-500 p-1 transition"
                                                    title="Xóa đáp án này"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Add Option Button */}
                                <div className="mt-2 text-right">
                                    <button
                                        onClick={() => addOption(originalIndex)}
                                        className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 rounded-lg font-semibold transition inline-flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> Thêm đáp án
                                    </button>
                                </div>

                                {/* Explanation */}
                                <div className="mt-2.5 text-xs p-2.5 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                                    <strong className="flex items-center gap-1 text-indigo-700 dark:text-indigo-300 mb-1">
                                        <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Giải thích:
                                    </strong>
                                    <textarea
                                        value={(q.e || '').replace(/<br>/g, '\n')}
                                        onChange={(e) => updateExplanation(originalIndex, e.target.value)}
                                        rows={Math.max(1, ((q.e || '').match(/<br>/g) || []).length + 1)}
                                        placeholder="(Thêm ghi chú/giải thích nếu có...)"
                                        className="w-full bg-transparent border-none resize-none focus:ring-0 outline-none text-xs text-gray-700 dark:text-gray-300"
                                    />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700 shrink-0">
                <button
                    onClick={onBack}
                    className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold py-2.5 px-5 rounded-xl transition text-xs flex items-center justify-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" /> Quay lại sửa văn bản
                </button>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Lưu vào Kho Đề
                </button>
            </div>
        </div>
    );
}
