import React, { useState, useEffect } from 'react';
import { useQuiz } from '../context/QuizContext';
import { useAuth } from '../context/AuthContext';
import { fetchStudentsList } from '../services/quizService';
import { 
    CheckCircle, 
    AlertCircle, 
    Info, 
    X, 
    ClipboardPaste, 
    Bolt, 
    Brain, 
    Users, 
    LineChart, 
    Loader2 
} from 'lucide-react';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Modals() {
    const { currentUser } = useAuth();
    const { 
        toasts,
        confirmModal, 
        closeConfirm,
        promptModal, 
        closePrompt,
        learnModal, 
        setLearnModal,
        scoreModal, 
        setScoreModal,
        analyticsModal, 
        setAnalyticsModal,
        openQuiz,
        showToast
    } = useQuiz();

    const [promptVal, setPromptVal] = useState('');
    const [students, setStudents] = useState([]);
    const [isStudentsLoading, setIsStudentsLoading] = useState(false);

    // Fetch students list when score modal opens
    useEffect(() => {
        if (scoreModal.isOpen && scoreModal.quizId && currentUser) {
            setIsStudentsLoading(true);
            fetchStudentsList(currentUser.uid, scoreModal.quizId)
                .then(data => setStudents(data))
                .catch(err => {
                    console.error(err);
                    showToast("Lỗi tải tiến độ học sinh: " + err.message, 'error');
                })
                .finally(() => setIsStudentsLoading(false));
        } else {
            setStudents([]);
        }
    }, [scoreModal.isOpen, scoreModal.quizId, currentUser, showToast]);

    // Handle prompt paste
    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setPromptVal(text);
        } catch {
            showToast("Không thể dán tự động. Hãy dán thủ công!", 'error');
        }
    };

    return (
        <>
            {/* 1. TOAST NOTIFICATIONS */}
            <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-white text-xs font-semibold border backdrop-blur-md animate-fade-in ${
                            t.type === 'success' 
                                ? 'bg-emerald-600/95 border-emerald-500' 
                                : t.type === 'error' 
                                    ? 'bg-rose-600/95 border-rose-500' 
                                    : t.type === 'warning'
                                        ? 'bg-amber-600/95 border-amber-500'
                                        : 'bg-indigo-600/95 border-indigo-500'
                        }`}
                    >
                        {t.type === 'success' && <CheckCircle className="w-4 h-4 shrink-0" />}
                        {t.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
                        {t.type === 'warning' && <AlertCircle className="w-4 h-4 shrink-0" />}
                        {t.type === 'info' && <Info className="w-4 h-4 shrink-0" />}
                        <span className="leading-snug">{t.message}</span>
                    </div>
                ))}
            </div>

            {/* 2. CONFIRM DIALOG */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full max-w-sm p-6 relative">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">
                            {confirmModal.title}
                        </h3>
                        <div 
                            className="text-gray-600 dark:text-gray-300 text-xs mb-6 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: confirmModal.message }}
                        />
                        <div className="flex justify-end gap-2.5">
                            <button
                                onClick={closeConfirm}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold transition active:scale-95"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={confirmModal.onConfirm}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 text-white ${
                                    confirmModal.isDanger 
                                        ? 'bg-rose-600 hover:bg-rose-700' 
                                        : 'bg-indigo-600 hover:bg-indigo-700'
                                }`}
                            >
                                {confirmModal.okText || 'Đồng ý'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. PROMPT MODAL */}
            {promptModal.isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full max-w-md p-6 relative">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">
                            {promptModal.title}
                        </h3>
                        <div 
                            className="text-gray-600 dark:text-gray-300 text-xs mb-4 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: promptModal.message }}
                        />
                        <div className="relative mb-6">
                            <input
                                type="text"
                                autoFocus
                                value={promptVal}
                                onChange={(e) => setPromptVal(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && promptVal.trim()) {
                                        promptModal.onConfirm(promptVal.trim());
                                        setPromptVal('');
                                    }
                                }}
                                placeholder={promptModal.placeholder || ''}
                                className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 pr-10 text-xs md:text-sm text-gray-900 dark:text-white focus:border-indigo-500 outline-none transition"
                            />
                            <button
                                onClick={handlePaste}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 p-2"
                                title="Dán từ khay nhớ tạm"
                            >
                                <ClipboardPaste className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex justify-end gap-2.5">
                            <button
                                onClick={() => {
                                    setPromptVal('');
                                    closePrompt();
                                }}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold transition active:scale-95"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => {
                                    if (!promptVal.trim()) {
                                        showToast("Vui lòng không để trống!", 'warning');
                                        return;
                                    }
                                    promptModal.onConfirm(promptVal.trim());
                                    setPromptVal('');
                                }}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. LEARN MODE SELECTOR MODAL */}
            {learnModal.isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full max-w-md p-6 relative overflow-hidden">
                        <button
                            onClick={() => setLearnModal({ isOpen: false, quizId: null, defaultMode: '' })}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1.5 text-center">
                            Chọn Chế Độ Học
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-xs text-center mb-5">
                            Chọn phương pháp học tập phù hợp với mục tiêu của bạn lúc này.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    const qId = learnModal.quizId;
                                    setLearnModal({ isOpen: false, quizId: null, defaultMode: '' });
                                    openQuiz(qId, 'quick');
                                }}
                                className="w-full flex items-start p-4 border-2 border-indigo-100 dark:border-indigo-900/50 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 rounded-2xl transition text-left group"
                            >
                                <div className="bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 p-3 rounded-xl mr-3.5 group-hover:scale-105 transition-transform shrink-0">
                                    <Bolt className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-indigo-950 dark:text-indigo-200 mb-0.5">
                                        Học Nhanh (Trí nhớ ngắn hạn)
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">
                                        Học từng Section tuần tự. Phù hợp để ôn thi gấp hoặc lướt qua toàn bộ nội dung.
                                    </p>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    const qId = learnModal.quizId;
                                    setLearnModal({ isOpen: false, quizId: null, defaultMode: '' });
                                    openQuiz(qId, 'srs');
                                }}
                                className="w-full flex items-start p-4 border-2 border-indigo-100 dark:border-indigo-900/50 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 rounded-2xl transition text-left group"
                            >
                                <div className="bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 p-3 rounded-xl mr-3.5 group-hover:scale-105 transition-transform shrink-0">
                                    <Brain className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-indigo-950 dark:text-indigo-200 mb-0.5">
                                        Học Nhớ Lâu (Ôn tập ngắt quãng SRS)
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">
                                        Chỉ ôn những câu đã đến hạn. Giúp kiến thức đi sâu vào trí nhớ dài hạn.
                                    </p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. STUDENT PROGRESS SCORE MODAL */}
            {scoreModal.isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full max-w-4xl max-h-[88vh] flex flex-col">
                        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="text-lg font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                                <Users className="w-5 h-5" /> Giám Sát Tiến Độ Học Sinh
                            </h2>
                            <button
                                onClick={() => setScoreModal({ isOpen: false, quizId: null, students: [], loading: false })}
                                className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
                            {isStudentsLoading ? (
                                <div className="text-center py-12">
                                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
                                    <p className="text-xs text-gray-400">Đang tải bảng học sinh...</p>
                                </div>
                            ) : students.length === 0 ? (
                                <div className="py-12 text-center text-gray-400 text-xs italic">
                                    Chưa có học sinh nào tham gia lớp này. Hãy gửi Mã Share cho học sinh của bạn!
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                                                <th className="p-3 rounded-l-xl font-bold">Tên Học Sinh</th>
                                                <th className="p-3 font-bold text-center">Section đã học</th>
                                                <th className="p-3 font-bold text-center">Tiến độ tổng</th>
                                                <th className="p-3 rounded-r-xl font-bold text-right">Lần cuối học</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm divide-y divide-gray-100 dark:divide-gray-700/60">
                                            {students.map(s => {
                                                const timeStr = s.lastActive ? new Date(s.lastActive.toDate()).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : 'Chưa rõ';
                                                const pct = Math.min(100, Math.round(((s.progress || 0) / (s.totalSections || 1)) * 100)) || 0;
                                                return (
                                                    <tr key={s.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/50 transition">
                                                        <td className="p-3 font-semibold text-gray-900 dark:text-gray-100">
                                                            {s.name} <br/>
                                                            <span className="text-[11px] text-gray-400 font-normal">{s.email || ''}</span>
                                                        </td>
                                                        <td className="p-3 text-center font-bold text-indigo-600 dark:text-indigo-400">
                                                            {s.progress || 0} / {s.totalSections || 1}
                                                        </td>
                                                        <td className="p-3 text-center text-sm text-gray-500">
                                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1 overflow-hidden">
                                                                <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                                                            </div>
                                                            <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300">{pct}%</span>
                                                        </td>
                                                        <td className="p-3 text-right text-xs text-gray-400">{timeStr}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 6. ANALYTICS MODAL */}
            {analyticsModal.isOpen && analyticsModal.quiz && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full max-w-3xl p-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <button
                            onClick={() => setAnalyticsModal({ isOpen: false, quiz: null })}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white p-1"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                            <LineChart className="w-5 h-5 text-indigo-600" /> Thống kê Học tập
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mb-5 font-medium">
                            Bộ đề: <b>{analyticsModal.quiz.title}</b>
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                            <div className="bg-indigo-50/70 dark:bg-gray-700/50 p-3.5 rounded-2xl text-center border border-indigo-100 dark:border-gray-700">
                                <div className="text-xl md:text-2xl font-black text-indigo-600 dark:text-indigo-400">
                                    {analyticsModal.quiz.history ? analyticsModal.quiz.history.length : 1}
                                </div>
                                <div className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold mt-0.5">Lượt ôn tập</div>
                            </div>
                            <div className="bg-emerald-50/70 dark:bg-gray-700/50 p-3.5 rounded-2xl text-center border border-emerald-100 dark:border-gray-700">
                                <div className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                    85%
                                </div>
                                <div className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold mt-0.5">Tỉ lệ đúng TB</div>
                            </div>
                            <div className="bg-amber-50/70 dark:bg-gray-700/50 p-3.5 rounded-2xl text-center border border-amber-100 dark:border-gray-700">
                                <div className="text-xl md:text-2xl font-black text-amber-600 dark:text-amber-400">
                                    1
                                </div>
                                <div className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold mt-0.5">Streak ngày</div>
                            </div>
                            <div className="bg-purple-50/70 dark:bg-gray-700/50 p-3.5 rounded-2xl text-center border border-purple-100 dark:border-gray-700">
                                <div className="text-xl md:text-2xl font-black text-purple-600 dark:text-purple-400">
                                    {analyticsModal.quiz.progress > 0 ? '75%' : '0%'}
                                </div>
                                <div className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold mt-0.5">Thành thạo</div>
                            </div>
                        </div>

                        <div className="w-full h-64">
                            <Line
                                data={{
                                    labels: ['Ngày 1', 'Ngày 2', 'Ngày 3', 'Hôm nay'],
                                    datasets: [
                                        {
                                            label: 'Số câu Đúng',
                                            data: [8, 10, 11, 12],
                                            borderColor: '#10B981',
                                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                            tension: 0.3,
                                            fill: true
                                        },
                                        {
                                            label: 'Số câu Sai',
                                            data: [4, 2, 1, 0],
                                            borderColor: '#EF4444',
                                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                            tension: 0.3,
                                            fill: true
                                        }
                                    ]
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { position: 'bottom' } },
                                    scales: { y: { beginAtZero: true } }
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
