import React from 'react';
import { useAuth } from './context/AuthContext';
import { useQuiz } from './context/QuizContext';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ImportScreen from './components/ImportScreen';
import PreviewScreen from './components/PreviewScreen';
import WelcomeScreen from './components/WelcomeScreen';
import QuizScreen from './components/QuizScreen';
import ResultScreen from './components/ResultScreen';
import FinishScreen from './components/FinishScreen';
import Modals from './components/Modals';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { GraduationCap, Loader2 } from 'lucide-react';

export default function App() {
    const { currentUser, loading, loginWithGoogle } = useAuth();
    const { 
        screen, 
        setScreen, 
        setEditQuizId,
        pendingTitle, 
        setPendingTitle, 
        pendingQuestions, 
        setPendingQuestions,
        loadQuizzes
    } = useQuiz();

    // Driver.js guided tour
    const handleStartTour = () => {
        const driverObj = driver({
            showProgress: true,
            doneBtnText: 'Hoàn tất',
            nextBtnText: 'Tiếp theo',
            prevBtnText: 'Quay lại',
            steps: [
                { popover: { title: '🌟 Chào mừng bạn!', description: 'Khám phá nhanh các tính năng nổi bật của Quiz Learning!', position: 'center' } },
                { element: 'header', popover: { title: 'Thanh công cụ', description: 'Nơi quản lý giao diện, tài khoản và cài đặt AI.' } },
                { popover: { title: '💡 Mẹo ôn tập', description: 'Tạo đề mới hoặc nhập mã share từ bạn bè để bắt đầu học ngay nhé!', position: 'center' } }
            ]
        });
        driverObj.drive();
    };

    if (loading) {
        return (
            <div className="h-[100dvh] flex items-center justify-center bg-slate-50 dark:bg-gray-900">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-3" />
                    <p className="text-xs font-bold text-gray-500 tracking-wider uppercase">Đang khởi động...</p>
                </div>
            </div>
        );
    }

    // Login Screen if not authenticated
    if (!currentUser) {
        return (
            <div className="h-[100dvh] flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-gray-900 transition-colors">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 text-center animate-fade-in">
                    <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-3xl text-indigo-600 dark:text-indigo-400 shadow-inner">
                        <GraduationCap className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black mb-2 text-gray-900 dark:text-white tracking-tight">
                        QUIZ LEARNING
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 text-xs leading-relaxed max-w-xs mx-auto">
                        Học tập thông minh & ghi nhớ dài hạn với phương pháp Spaced Repetition (SRS).
                    </p>
                    <button
                        onClick={loginWithGoogle}
                        className="w-full bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white font-bold py-3.5 px-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-indigo-400 transition flex items-center justify-center gap-3 shadow-sm active:scale-[0.99] text-xs"
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                        Đăng nhập bằng Google
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[100dvh] flex flex-col bg-slate-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 overflow-hidden transition-colors">
            {/* Header */}
            <Header onStartTour={handleStartTour} />

            {/* Main Stage */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center items-start pb-24 md:pb-12 relative custom-scrollbar">
                {screen === 'dashboard' && (
                    <Dashboard 
                        onOpenCreate={() => {
                            setEditQuizId(null);
                            setPendingTitle('');
                            setPendingQuestions([]);
                            setScreen('import');
                        }}
                        onEdit={(quizId) => {
                            setEditQuizId(quizId);
                            setScreen('import');
                        }}
                    />
                )}

                {screen === 'import' && (
                    <ImportScreen 
                        onClose={() => setScreen('dashboard')}
                        onParsed={(questions, title) => {
                            setPendingQuestions(questions);
                            setPendingTitle(title);
                            setScreen('preview');
                        }}
                    />
                )}

                {screen === 'preview' && (
                    <PreviewScreen
                        questions={pendingQuestions}
                        title={pendingTitle}
                        onBack={() => setScreen('import')}
                        onSaved={() => {
                            loadQuizzes(true);
                            setScreen('dashboard');
                        }}
                    />
                )}

                {screen === 'welcome' && <WelcomeScreen />}
                {screen === 'quiz' && <QuizScreen />}
                {screen === 'result' && <ResultScreen />}
                {screen === 'finish' && <FinishScreen />}
            </main>

            {/* Global Modals */}
            <Modals />
        </div>
    );
}
