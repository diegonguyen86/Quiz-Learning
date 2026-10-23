import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuiz } from '../context/QuizContext';
import { 
    GraduationCap, 
    ArrowLeft, 
    HelpCircle, 
    Bot, 
    Moon, 
    Sun, 
    Home, 
    LogOut 
} from 'lucide-react';

export default function Header({ onStartTour }) {
    const { currentUser, logout } = useAuth();
    const { 
        screen, 
        setScreen, 
        theme, 
        toggleTheme, 
        currentSection, 
        totalSections, 
        showPrompt, 
        showToast,
        showConfirm 
    } = useQuiz();

    const isPlaying = ['welcome', 'quiz', 'result', 'finish'].includes(screen);
    const progressPct = totalSections > 0 ? Math.min(100, Math.round((currentSection / totalSections) * 100)) : 0;

    const handleApiKeyChange = () => {
        showPrompt(
            "Cài đặt Gemini AI Key",
            "Nhập Google Gemini API Key để kích hoạt trợ lý AI phân tích đáp án.<br><br><a href='https://aistudio.google.com/app/apikey' target='_blank' rel='noreferrer' class='text-indigo-600 dark:text-indigo-400 font-semibold hover:underline inline-flex items-center gap-1'>Lấy API Key miễn phí tại Google AI Studio</a>",
            "AIzaSy...",
            (key) => {
                if (key.trim()) {
                    localStorage.setItem('GEMINI_API_KEY', key.trim());
                    showToast("Đã lưu Gemini API Key thành công!", 'success');
                }
            }
        );
    };

    const handleLogout = () => {
        showConfirm("Đăng xuất", "Bạn có chắc muốn đăng xuất khỏi Quiz Learning?", () => {
            logout();
            showToast("Đã đăng xuất thành công!", 'info');
        });
    };

    return (
        <header className="bg-white/95 dark:bg-gray-800/95 backdrop-blur border-b border-gray-100 dark:border-gray-800 px-4 md:px-6 py-3 flex flex-col md:flex-row justify-between items-center z-20 gap-3 shrink-0 shadow-sm transition-colors">
            {/* Brand Logo & Title */}
            <div 
                className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start cursor-pointer select-none"
                onClick={() => setScreen('dashboard')}
            >
                <div className="flex items-center gap-2.5 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 dark:shadow-none transition-transform group-hover:scale-105">
                        <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-1.5">
                            QUIZ LEARNING
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                PRO
                            </span>
                        </h1>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium hidden sm:block">Học thông minh & Ghi nhớ dài hạn</p>
                    </div>
                </div>

                {isPlaying && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); setScreen('dashboard'); }}
                        className="md:hidden text-xs text-indigo-600 dark:text-indigo-400 font-bold px-3 py-1.5 border border-indigo-200 dark:border-indigo-800 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center gap-1 active:scale-95 transition"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Trang Chủ
                    </button>
                )}
            </div>

            {/* In-Game Progress Bar */}
            {isPlaying && (
                <div className="w-full md:w-1/3 animate-fade-in">
                    <div className="flex justify-between text-xs mb-1 font-bold text-gray-600 dark:text-gray-300">
                        <span className="text-indigo-600 dark:text-indigo-400">Tiến độ: {progressPct}%</span>
                        <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-[11px]">
                            {currentSection < totalSections ? `Section ${currentSection + 1}/${totalSections}` : 'Hoàn thành!'}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div 
                            className="bg-gradient-to-r from-indigo-600 to-cyan-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 md:gap-2.5 shrink-0">
                <button
                    onClick={onStartTour}
                    className="py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition font-bold text-xs flex items-center gap-1.5 border border-indigo-200/80 dark:border-indigo-800/80 active:scale-95"
                    title="Hướng dẫn sử dụng"
                >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Hướng dẫn</span>
                </button>

                <button
                    onClick={handleApiKeyChange}
                    className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition active:scale-95"
                    title="Cài đặt Google Gemini AI Key"
                >
                    <Bot className="w-4 h-4" />
                </button>

                <button
                    onClick={toggleTheme}
                    className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition active:scale-95"
                    title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
                >
                    {theme === 'dark' ? (
                        <Sun className="w-4 h-4 text-amber-400" />
                    ) : (
                        <Moon className="w-4 h-4" />
                    )}
                </button>

                {isPlaying && (
                    <button
                        onClick={() => setScreen('dashboard')}
                        className="hidden md:flex text-xs text-indigo-600 dark:text-indigo-400 font-bold px-3 py-2 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition items-center gap-1.5 active:scale-95"
                    >
                        <Home className="w-3.5 h-3.5" /> Trang Chủ
                    </button>
                )}

                {currentUser && (
                    <div className="flex items-center gap-2.5 border-l pl-3 border-gray-200 dark:border-gray-700">
                        <img 
                            src={currentUser.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                            alt="Avatar" 
                            className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 object-cover shadow-sm"
                        />
                        <div className="flex flex-col">
                            <span className="text-xs font-bold max-w-[100px] truncate text-gray-900 dark:text-white">
                                {currentUser.displayName || 'Người dùng'}
                            </span>
                            <button 
                                onClick={handleLogout} 
                                className="text-[10px] text-gray-400 hover:text-rose-500 text-left font-medium flex items-center gap-1"
                            >
                                <LogOut className="w-2.5 h-2.5" /> Đăng xuất
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
