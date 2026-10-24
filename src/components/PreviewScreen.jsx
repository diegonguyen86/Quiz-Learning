import React, { useState, useRef } from 'react';
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
    Loader2
} from 'lucide-react';

export default function PreviewScreen({ questions: initialQuestions, title, onBack, onSaved }) {
    const { currentUser } = useAuth();
    const { editQuizId, quizzes, setQuizzes, showToast, showConfirm } = useQuiz();
    const [questions, setQuestions] = useState(initialQuestions);
    const [isSaving, setIsSaving] = useState(false);
    const containerRef = useRef(null);

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
            showToast("Tuyệt vời! Tất cả các câu đều đã có đáp án.", 'success');
            return;
        }

        const currentScroll = containerRef.current.scrollTop;
        let target = Array.from(errorCards).find(el => el.offsetTop > currentScroll + 50) || errorCards[0];

        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.add('ring-4', 'ring-rose-400');
        setTimeout(() => target.classList.remove('ring-4', 'ring-rose-400'), 1500);
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 shrink-0 pb-3 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg md:text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <Eye className="w-5 h-5 text-indigo-600" />
                    Kiểm tra lại: <span className="text-indigo-600 dark:text-indigo-400">{title}</span>
                </h2>
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={scrollToNextError}
                        className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-100 transition dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-400"
                        title="Cuộn tới câu chưa có đáp án"
                    >
                        <ArrowDown className="w-3.5 h-3.5" /> Tìm câu lỗi
                    </button>
                    <span className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800">
                        {questions.length} câu hỏi
                    </span>
                </div>
            </div>

            {/* Instruction Warning */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 p-3 mb-4 rounded-xl text-xs font-medium text-amber-900 dark:text-amber-200 shrink-0 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Kiểm tra các đáp án đúng (tô màu xanh). Bạn có thể tick chọn đáp án đúng thủ công hoặc sửa lại nội dung trực tiếp.</span>
            </div>

            {/* Questions Container */}
            <div ref={containerRef} className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2 mb-4">
                {questions.map((q, qIndex) => {
                    const hasError = q.a.length === 0;
                    return (
                        <div
                            key={qIndex}
                            className={`p-4 bg-white dark:bg-gray-900 border rounded-2xl shadow-sm relative transition-all ${
                                hasError 
                                    ? 'border-rose-400 dark:border-rose-600 error-card shadow-rose-100' 
                                    : 'border-gray-200 dark:border-gray-700'
                            }`}
                        >
                            <div className={`absolute -top-3 left-4 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                hasError 
                                    ? 'bg-rose-500 text-white border-rose-600' 
                                    : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                            }`}>
                                Câu {qIndex + 1}
                            </div>

                            <button
                                onClick={() => deleteQuestion(qIndex)}
                                className="absolute top-2.5 right-2.5 text-gray-400 hover:text-rose-500 p-1.5 rounded-lg transition"
                                title="Xóa câu hỏi"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>

                            {hasError && (
                                <div className="mb-2 mt-1 text-xs p-2 bg-rose-50 text-rose-800 rounded-lg border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900 flex items-center gap-1.5 font-medium">
                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                    Chưa có đáp án đúng cho câu này. Hãy đánh dấu checkbox bên dưới!
                                </div>
                            )}

                            {/* Question Text */}
                            <div className="font-semibold text-base mb-3 mt-1 border-b border-dashed border-gray-200 dark:border-gray-700 pb-2 mr-8">
                                <textarea
                                    value={q.q.replace(/<br>/g, '\n')}
                                    onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                                    rows={Math.max(2, (q.q.match(/<br>/g) || []).length + 1)}
                                    className="w-full bg-transparent border-none resize-none focus:ring-0 outline-none text-gray-800 dark:text-gray-100 text-sm leading-relaxed"
                                />
                            </div>

                            {/* Options */}
                            <div className="space-y-1.5">
                                {q.o.map((opt, optIndex) => {
                                    const isCorrect = q.a.includes(optIndex);
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
                                                onChange={(e) => toggleAns(qIndex, optIndex, e.target.checked)}
                                                className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 mr-3 cursor-pointer shrink-0"
                                            />
                                            <input
                                                type="text"
                                                value={opt}
                                                onChange={(e) => updateOptionText(qIndex, optIndex, e.target.value)}
                                                className={`flex-1 bg-transparent border-none focus:ring-0 outline-none w-full text-xs md:text-sm ${
                                                    isCorrect ? 'text-emerald-800 font-bold dark:text-emerald-300' : 'text-gray-700 dark:text-gray-200'
                                                }`}
                                            />
                                            <button
                                                onClick={() => removeOption(qIndex, optIndex)}
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
                                    onClick={() => addOption(qIndex)}
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
                                    onChange={(e) => updateExplanation(qIndex, e.target.value)}
                                    rows={Math.max(1, ((q.e || '').match(/<br>/g) || []).length + 1)}
                                    placeholder="(Thêm ghi chú/giải thích nếu có...)"
                                    className="w-full bg-transparent border-none resize-none focus:ring-0 outline-none text-xs text-gray-700 dark:text-gray-300"
                                />
                            </div>
                        </div>
                    );
                })}
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
