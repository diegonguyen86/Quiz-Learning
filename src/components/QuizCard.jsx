import React from 'react';
import { motion } from 'framer-motion';
import { useQuiz } from '../context/QuizContext';
import { 
    Play, 
    Users, 
    BarChart3, 
    Edit3, 
    Trash2, 
    RotateCcw, 
    Copy, 
    Shuffle, 
    LogOut,
    Presentation
} from 'lucide-react';

export default function QuizCard({ quiz, onEdit }) {
    const { 
        deleteQuiz, 
        resetQuiz, 
        refreshShareCode, 
        openQuiz,
        setLearnModal, 
        setScoreModal, 
        setAnalyticsModal, 
        showToast,
        SEC_SIZE 
    } = useQuiz();

    const isClass = Boolean(quiz.isClassroom);

    const handleStartLearning = () => {
        if (isClass) {
            openQuiz(quiz.id, 'quick');
            return;
        }
        // If learnMode was previously selected, continue immediately!
        if (quiz.learnMode) {
            openQuiz(quiz.id, quiz.learnMode);
        } else {
            setLearnModal({ isOpen: true, quizId: quiz.id, defaultMode: '' });
        }
    };
    const totalQuestions = quiz.questions ? quiz.questions.length : 0;
    const totalSec = Math.ceil(totalQuestions / SEC_SIZE) || 1;
    const progressPct = totalSec > 0 ? Math.min(100, Math.round(((quiz.progress || 0) / (isClass ? (quiz.totalSections || 1) : totalSec)) * 100)) : 0;
    const shareCode = quiz.shareCode || "Chưa có";

    const copyCode = (e) => {
        e.stopPropagation();
        if (shareCode === "Chưa có") return;
        navigator.clipboard.writeText(shareCode).then(() => {
            showToast(`Đã sao chép mã: ${shareCode}`, 'success');
        });
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ 
                opacity: 0, 
                scale: 0.92, 
                y: -10, 
                height: 0, 
                marginTop: 0, 
                marginBottom: 0, 
                paddingTop: 0, 
                paddingBottom: 0,
                overflow: 'hidden',
                transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } 
            }}
            transition={{ duration: 0.2 }}
            className={`rounded-3xl border shadow-sm p-5 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow ${
                isClass 
                    ? 'bg-gradient-to-br from-blue-50/70 to-white dark:from-blue-950/20 dark:to-gray-800 border-blue-100 dark:border-blue-900/50' 
                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80'
            }`}
        >
            {/* Top Accent Strip */}
            <div className={`absolute top-0 left-0 w-1.5 h-full ${isClass ? 'bg-blue-500' : 'bg-indigo-500'}`} />

            <div className="pl-2">
                {/* Header: Title and Top Action */}
                <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0 pr-2">
                        <h3 
                            className={`font-black text-base md:text-lg truncate tracking-tight ${
                                isClass ? 'text-blue-900 dark:text-blue-200' : 'text-gray-900 dark:text-white'
                            }`}
                            title={quiz.title}
                        >
                            {quiz.title}
                        </h3>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">
                            {isClass ? 'Bộ đề lớp học do giáo viên quản lý' : `${totalQuestions} câu hỏi &bull; ${totalSec} sections`}
                        </p>
                    </div>

                    {isClass ? (
                        <button
                            onClick={() => deleteQuiz(quiz.id, quiz.title)}
                            className="text-gray-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition active:scale-90"
                            title="Rời khỏi lớp học"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={() => resetQuiz(quiz.id, quiz.title)}
                            className="text-gray-400 hover:text-amber-500 p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 transition active:scale-90"
                            title="Làm lại từ đầu (Reset tiến độ)"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Badges / Share Code */}
                <div className="flex items-center gap-1.5 mb-4 mt-2.5">
                    {isClass ? (
                        <span className="text-[11px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                            <Users className="w-3 h-3" /> LỚP HỌC (GV Giám sát)
                        </span>
                    ) : (
                        <>
                            <span className="text-[11px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold px-2.5 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900/60">
                                Mã: <b className="font-mono text-xs">{shareCode}</b>
                            </span>
                            <button
                                onClick={copyCode}
                                className="text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/60 dark:hover:bg-gray-700 px-2 py-0.5 rounded text-xs transition active:scale-95 flex items-center gap-1"
                                title="Sao chép mã chia sẻ"
                            >
                                <Copy className="w-3 h-3" />
                            </button>
                            <button
                                onClick={() => refreshShareCode(quiz.id)}
                                className="text-gray-400 hover:text-amber-600 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/60 dark:hover:bg-gray-700 px-2 py-0.5 rounded text-xs transition active:scale-95 flex items-center gap-1"
                                title="Đổi mã bảo mật mới"
                            >
                                <Shuffle className="w-3 h-3" />
                            </button>
                        </>
                    )}
                </div>

                {/* Learn Mode Indicator & Switcher */}
                {!isClass && (
                    <div className="flex items-center justify-between text-xs mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            quiz.learnMode === 'srs'
                                ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        }`}>
                            {quiz.learnMode === 'srs' ? '🧠 Nhớ lâu (SRS)' : '⚡ Học nhanh (Tuần tự)'}
                        </span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setLearnModal({ isOpen: true, quizId: quiz.id, defaultMode: quiz.learnMode || '' });
                            }}
                            className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                            title="Bấm để đổi phương pháp học"
                        >
                            Đổi chế độ
                        </button>
                    </div>
                )}

                {/* Progress Bar */}
                <div className={`w-full rounded-full h-2 mb-1.5 overflow-hidden ${isClass ? 'bg-blue-100 dark:bg-blue-950/60' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    <div 
                        className={`h-2 rounded-full transition-all duration-500 ${isClass ? 'bg-blue-600' : 'bg-indigo-600'}`}
                        style={{ width: `${progressPct}%` }}
                    />
                </div>
                <p className={`text-right text-xs font-bold mb-4 ${isClass ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-400'}`}>
                    Tiến độ: {progressPct}%
                </p>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-1.5 pl-2 pt-2 border-t border-gray-100 dark:border-gray-700/60">
                <button
                    onClick={handleStartLearning}
                    className={`flex-1 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                        isClass ? 'bg-blue-600 hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{progressPct > 0 ? 'Tiếp tục học' : (isClass ? 'Vào Lớp Học' : 'Học bài')}</span>
                </button>

                {!isClass && (
                    <>
                        <button
                            onClick={() => setScoreModal({ isOpen: true, quizId: quiz.id, students: [], loading: true })}
                            className="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 p-2.5 rounded-xl transition active:scale-95"
                            title="Tiến độ học sinh tham gia"
                        >
                            <Users className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setAnalyticsModal({ isOpen: true, quiz })}
                            className="text-gray-500 hover:text-indigo-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 p-2.5 rounded-xl transition active:scale-95"
                            title="Thống kê học tập"
                        >
                            <BarChart3 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onEdit(quiz.id)}
                            className="text-gray-500 hover:text-indigo-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 p-2.5 rounded-xl transition active:scale-95"
                            title="Chỉnh sửa bộ đề"
                        >
                            <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => deleteQuiz(quiz.id, quiz.title)}
                            className="text-gray-400 hover:text-rose-500 bg-gray-50 hover:bg-rose-50 dark:bg-gray-800 dark:hover:bg-rose-950/40 p-2.5 rounded-xl transition active:scale-95"
                            title="Xóa bộ đề"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </>
                )}
            </div>
        </motion.div>
    );
}
