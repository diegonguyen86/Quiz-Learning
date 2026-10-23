import React from 'react';
import { useQuiz } from '../context/QuizContext';
import { 
    CheckCircle, 
    AlertCircle, 
    RotateCcw, 
    ArrowRight, 
    BookOpen, 
    Lightbulb 
} from 'lucide-react';

export default function ResultScreen() {
    const { 
        allQuestions, 
        currentSection, 
        totalSections, 
        mistakes, 
        startRetry, 
        startNextSection, 
        setScreen, 
        SEC_SIZE 
    } = useQuiz();

    const hasMistakes = mistakes.length > 0;
    const startIdx = (currentSection - 1) * SEC_SIZE;
    const endIdx = Math.min(startIdx + SEC_SIZE, allQuestions.length);
    const sectionQuestions = startIdx >= 0 ? allQuestions.slice(startIdx, endIdx) : [];

    const handleContinue = () => {
        if (currentSection >= totalSections) {
            setScreen('finish');
        } else {
            startNextSection();
        }
    };

    return (
        <div className="max-w-2xl w-full mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 md:p-8 text-center mt-6 md:mt-10 animate-fade-in">
            {/* Result Icon */}
            <div className={`w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 rounded-3xl flex items-center justify-center text-4xl shadow-inner ${
                hasMistakes 
                    ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' 
                    : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
            }`}>
                {hasMistakes ? <AlertCircle className="w-10 h-10 md:w-12 md:h-12" /> : <CheckCircle className="w-10 h-10 md:w-12 md:h-12" />}
            </div>

            <h2 className="text-xl md:text-2xl font-black mb-2 text-gray-900 dark:text-white">
                {hasMistakes ? 'Cần ôn tập lại câu sai!' : 'Hoàn thành xuất sắc!'}
            </h2>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                {hasMistakes 
                    ? `Bạn đã làm sai ${mistakes.length} câu trong section này. Hãy làm lại ngay để khắc sâu kiến thức vào trí nhớ nhé!` 
                    : 'Không sai câu nào cả. Kiến thức của section này đã được bạn nắm trọn vẹn.'}
            </p>

            {hasMistakes ? (
                <button
                    onClick={startRetry}
                    className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold py-3.5 px-8 rounded-2xl shadow-lg shadow-amber-200 dark:shadow-none transition text-sm inline-flex items-center justify-center gap-2 active:scale-95"
                >
                    <RotateCcw className="w-4 h-4" /> Làm lại {mistakes.length} câu sai
                </button>
            ) : (
                <>
                    {/* Knowledge Summary Box */}
                    {sectionQuestions.length > 0 && (
                        <div className="mt-6 text-left border-t border-gray-100 dark:border-gray-700 pt-5">
                            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-1.5">
                                <BookOpen className="w-4 h-4 text-indigo-600" /> Tổng hợp kiến thức Section
                            </h3>
                            <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                                {sectionQuestions.map((q, i) => {
                                    const correctText = q.a.map(idx => q.o[idx]).join(' | ');
                                    return (
                                        <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/60 text-xs">
                                            <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                                                Câu {i + 1}: {q.q.replace(/<br>/g, ' ').replace(/\[Hình minh họa:?.*?\]/gi, '')}
                                            </p>
                                            <p className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3 shrink-0" /> {correctText}
                                            </p>
                                            {q.e && (
                                                <div className="mt-1.5 p-2 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200 rounded-lg flex items-start gap-1">
                                                    <Lightbulb className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                                                    <span>{q.e.replace(/<br>/g, ' ').replace(/giải thích:\s*/i, '')}</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleContinue}
                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-8 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none transition text-sm inline-flex items-center justify-center gap-2 mt-6 active:scale-95"
                    >
                        Tiếp tục {currentSection < totalSections ? `Section ${currentSection + 1}` : 'Hoàn thành'}
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </>
            )}
        </div>
    );
}
