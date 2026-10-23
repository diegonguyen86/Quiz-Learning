import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useQuiz } from '../context/QuizContext';
import QuizCard from './QuizCard';
import { 
    Search, 
    Plus, 
    FileDown, 
    Users, 
    FolderOpen, 
    XCircle 
} from 'lucide-react';

export default function Dashboard({ onOpenCreate, onEdit }) {
    const { 
        quizzes, 
        isQuizzesLoading, 
        searchFilter, 
        setSearchFilter, 
        showPrompt, 
        importCopyQuiz, 
        joinClassroom 
    } = useQuiz();

    const filteredQuizzes = quizzes.filter(q => {
        if (!searchFilter.trim()) return true;
        const query = searchFilter.toLowerCase();
        return (q.title || '').toLowerCase().includes(query) || (q.shareCode || '').toLowerCase().includes(query);
    });

    const handleImportCopy = () => {
        showPrompt(
            "Nhập mã bộ đề",
            "Dán Mã Share (QL-...) của bộ đề bạn muốn sao chép:",
            "QL-...",
            (code) => importCopyQuiz(code)
        );
    };

    const handleJoinClass = () => {
        showPrompt(
            "Tham gia Lớp Học",
            "Dán Mã Lớp Học (QL-...) do giáo viên cung cấp:",
            "QL-...",
            (code) => joinClassroom(code)
        );
    };

    return (
        <div className="max-w-6xl w-full mx-auto animate-fade-in">
            {/* Top Toolbar */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Kho Đề Của Bạn</h2>
                        <span className="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                            {quizzes.length} bộ đề
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Quản lý và ôn tập các bộ đề thông minh theo phương pháp SRS</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
                    {/* Real-time Search */}
                    <div className="relative flex-1 sm:w-64">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                            placeholder="Tìm kiếm bộ đề..."
                            className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-gray-800 dark:text-gray-200 shadow-sm transition"
                        />
                        {searchFilter && (
                            <button
                                onClick={() => setSearchFilter('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <XCircle className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 overflow-x-auto pb-1 sm:pb-0">
                        <button
                            onClick={handleImportCopy}
                            className="shrink-0 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold py-2.5 px-3.5 rounded-xl shadow-sm transition flex items-center gap-1.5"
                            title="Sao chép bộ đề từ người khác"
                        >
                            <FileDown className="w-3.5 h-3.5" /> Nhập code đề
                        </button>
                        <button
                            onClick={handleJoinClass}
                            className="shrink-0 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold py-2.5 px-3.5 rounded-xl shadow-sm transition flex items-center gap-1.5"
                            title="Vào lớp học do giáo viên tạo"
                        >
                            <Users className="w-3.5 h-3.5" /> Vào Lớp Học
                        </button>
                        <button
                            onClick={onOpenCreate}
                            className="shrink-0 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md transition flex items-center gap-1.5"
                        >
                            <Plus className="w-4 h-4" /> Tạo Đề Mới
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid of Quizzes */}
            {isQuizzesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 flex flex-col justify-between shadow-sm animate-pulse">
                            <div>
                                <div className="h-5 skeleton-box w-3/4 mb-3 rounded-lg" />
                                <div className="h-4 skeleton-box w-1/3 mb-4 rounded-md" />
                                <div className="h-2 skeleton-box w-full rounded-full mb-2" />
                                <div className="h-3 skeleton-box w-1/4 ml-auto mb-6 rounded" />
                            </div>
                            <div className="flex gap-2">
                                <div className="h-9 skeleton-box flex-1 rounded-xl" />
                                <div className="h-9 skeleton-box w-10 rounded-xl" />
                                <div className="h-9 skeleton-box w-10 rounded-xl" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredQuizzes.length === 0 ? (
                searchFilter ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 p-8 shadow-sm">
                        <Search className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-1">
                            Không tìm thấy bộ đề phù hợp
                        </h3>
                        <p className="text-xs text-gray-400">Không có kết quả nào khớp với "{searchFilter}"</p>
                        <button
                            onClick={() => setSearchFilter('')}
                            className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                        >
                            Xóa bộ lọc tìm kiếm
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 p-8 shadow-sm">
                        <div className="w-16 h-16 mx-auto mb-4 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 rounded-2xl flex items-center justify-center text-3xl">
                            <FolderOpen className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-1">
                            Bạn chưa có bộ đề nào
                        </h3>
                        <p className="text-gray-400 text-xs max-w-sm mx-auto mb-6">
                            Tạo bộ đề đầu tiên bằng cách dán văn bản thô, tải file PDF/Word, hoặc tham gia lớp học có sẵn.
                        </p>
                        <button
                            onClick={onOpenCreate}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl transition shadow-md inline-flex items-center gap-1.5 text-xs active:scale-95"
                        >
                            <Plus className="w-4 h-4" /> Tạo Đề Đầu Tiên
                        </button>
                    </div>
                )
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    <AnimatePresence mode="popLayout">
                        {filteredQuizzes.map((quiz) => (
                            <QuizCard key={quiz.id} quiz={quiz} onEdit={onEdit} />
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
