import React from 'react';
import { useQuiz } from '../context/QuizContext';
import { 
    BookOpen, 
    Play, 
    RotateCcw, 
    Shuffle, 
    Presentation 
} from 'lucide-react';

export default function WelcomeScreen() {
    const { 
        activeQuiz, 
        isStudentMode, 
        allQuestions, 
        currentSection, 
        totalSections, 
        startNextSection, 
        resetAndRestart, 
        shuffleQuestions 
    } = useQuiz();

    return (
        <div className="max-w-xl w-full mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 md:p-8 text-center mt-6 md:mt-10 animate-fade-in">
            {isStudentMode && (
                <div className="mx-auto bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold px-3.5 py-1 rounded-full text-xs w-max mb-5 border border-blue-200 dark:border-blue-800 flex items-center gap-1.5">
                    <Presentation className="w-3.5 h-3.5" />
                    LỚP HỌC (GV CỦA BẠN ĐANG GIÁM SÁT TIẾN ĐỘ)
                </div>
            )}

            <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
                <BookOpen className="w-10 h-10 md:w-12 md:h-12" />
            </div>

            <h2 className="text-2xl md:text-3xl font-black mb-2 text-gray-900 dark:text-white">
                {activeQuiz?.title || 'Bộ Đề'}
            </h2>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">
                Bộ đề có <b>{allQuestions.length} câu hỏi</b>. Bạn đang ở <b>Section {currentSection + 1}/{totalSections}</b>.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button
                    onClick={startNextSection}
                    className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold py-3 px-8 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none transition text-sm w-full sm:w-auto flex items-center justify-center gap-2"
                >
                    <Play className="w-4 h-4 fill-current" /> Bắt đầu học
                </button>
                <button
                    onClick={resetAndRestart}
                    className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold py-3 px-6 rounded-2xl transition text-xs w-full sm:w-auto flex items-center justify-center gap-2 active:scale-95"
                >
                    <RotateCcw className="w-3.5 h-3.5" /> Làm lại từ đầu
                </button>
                {!isStudentMode && (
                    <button
                        onClick={shuffleQuestions}
                        className="bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold py-3 px-6 rounded-2xl transition text-xs w-full sm:w-auto flex items-center justify-center gap-2 border border-purple-200 dark:border-purple-800 active:scale-95"
                    >
                        <Shuffle className="w-3.5 h-3.5" /> Trộn Đề
                    </button>
                )}
            </div>
        </div>
    );
}
