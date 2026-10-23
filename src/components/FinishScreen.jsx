import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useQuiz } from '../context/QuizContext';
import { Trophy, ArrowLeft } from 'lucide-react';

export default function FinishScreen() {
    const { isStudentMode, setScreen } = useQuiz();

    useEffect(() => {
        // Confetti fireworks effect
        const count = 200;
        const defaults = { origin: { y: 0.7 } };

        function fire(particleRatio, opts) {
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio)
            });
        }

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    }, []);

    return (
        <div className="max-w-xl w-full mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 md:p-8 text-center mt-6 md:mt-10 animate-fade-in">
            <div className="w-24 h-24 mx-auto mb-4 rounded-3xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-500 shadow-inner">
                <Trophy className="w-12 h-12" />
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400 mb-2">
                CHÚC MỪNG BẠN!
            </h2>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto leading-relaxed">
                {isStudentMode 
                    ? "Bạn đã theo kịp 100% tiến độ của lớp học. Giáo viên của bạn đã ghi nhận kết quả này!"
                    : "Bạn đã vượt qua toàn bộ các Section của bộ đề này. Hãy quay lại ôn tập theo chu kỳ SRS để ghi nhớ vĩnh viễn nhé."}
            </p>

            <button
                onClick={() => setScreen('dashboard')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-8 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none transition text-sm inline-flex items-center gap-2 active:scale-95"
            >
                <ArrowLeft className="w-4 h-4" /> Về Kho Đề
            </button>
        </div>
    );
}
