import React, { useState } from 'react';
import { useQuiz } from '../context/QuizContext';
import { extractTextFromFile, parseRawQuestions } from '../services/parserService';
import { 
    CloudUpload, 
    FileUp, 
    X, 
    Settings, 
    Loader2, 
    Info,
    CheckCircle2,
    ArrowRight
} from 'lucide-react';

export default function ImportScreen({ onClose, onParsed }) {
    const { editQuizId, pendingTitle, setPendingTitle, pendingQuestions, pendingRawText, showToast } = useQuiz();
    const [title, setTitle] = useState(pendingTitle || '');
    const [rawText, setRawText] = useState(pendingRawText || '');
    const [isParsing, setIsParsing] = useState(false);
    const [fileStatus, setFileStatus] = useState('');

    // Keep inputs synced if opened for editing
    React.useEffect(() => {
        if (pendingTitle) setTitle(pendingTitle);
        if (pendingRawText) setRawText(pendingRawText);
    }, [pendingTitle, pendingRawText]);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const extracted = await extractTextFromFile(file, (msg) => setFileStatus(msg));
            setRawText(prev => (prev ? prev + '\n\n' + extracted : extracted));
            showToast("Đã trích xuất nội dung file thành công!", 'success');
        } catch (err) {
            console.error(err);
            showToast("Lỗi đọc file: " + err.message, 'error');
        } finally {
            setFileStatus('');
            e.target.value = '';
        }
    };

    const handleParse = () => {
        if (!title.trim()) {
            showToast("Vui lòng nhập tên bộ đề!", 'warning');
            return;
        }
        if (!rawText.trim()) {
            showToast("Vui lòng dán hoặc tải nội dung câu hỏi!", 'warning');
            return;
        }

        setIsParsing(true);
        try {
            const parsed = parseRawQuestions(rawText);
            if (parsed.length === 0) {
                showToast("Không tìm thấy câu hỏi nào hợp lệ theo định dạng!", 'error');
                setIsParsing(false);
                return;
            }

            setPendingTitle(title);
            onParsed(parsed, title);
        } catch (err) {
            console.error(err);
            showToast("Lỗi xử lý: " + err.message, 'error');
        } finally {
            setIsParsing(false);
        }
    };

    return (
        <div className="max-w-4xl w-full mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 md:p-8 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <CloudUpload className="w-6 h-6 text-indigo-600" />
                    {editQuizId ? 'Chỉnh Sửa Bộ Đề' : 'Tạo Bộ Đề Mới'}
                </h2>
                <button 
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Direct Visual Editor Jump if editing existing questions */}
            {editQuizId && pendingQuestions.length > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-700 p-4 mb-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm">
                    <div className="flex items-center gap-2.5 text-emerald-900 dark:text-emerald-200 text-xs font-bold">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div>
                            <p className="text-sm font-black text-emerald-900 dark:text-white">Đang chỉnh sửa bộ đề: {title || pendingTitle}</p>
                            <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Bộ đề có {pendingQuestions.length} câu hỏi. Bạn có thể sửa trực tiếp văn bản bên dưới hoặc mở giao diện sửa từng câu.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => onParsed(pendingQuestions, title || pendingTitle)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm flex items-center gap-2 active:scale-95 shrink-0"
                    >
                        <span>Sửa trực quan từng câu</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Format Instructions Box */}
            <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border-l-4 border-indigo-500 p-4 mb-5 rounded-2xl text-gray-700 dark:text-gray-300">
                <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200 mb-2 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-indigo-600" /> Định dạng mẫu được hỗ trợ chuẩn xác:
                </p>
                <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-indigo-100 dark:border-gray-700 font-mono text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    Máy ảnh trong hình là loại gì?<br/>
                    A. Mirrorless<br/>
                    B. Cinema Line<br/>
                    C. DSLR<br/>
                    B<br/>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">* Nếu có nhiều đáp án đúng, ghi cách nhau dấu phẩy (Ví dụ: A,B).</span><br/>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">* Chèn ảnh dạng [Hình minh họa: link_anh_vao_day]</span>
                </div>
            </div>

            {/* Quiz Title Input */}
            <div className="mb-5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                    Tên bộ đề (Môn học / Chủ đề):
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Triết học Mác-Lênin, Thiết kế đồ họa..."
                    className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-900 outline-none text-sm font-semibold transition"
                />
            </div>

            {/* Raw Text Input / File Upload */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Nội dung câu hỏi & đáp án
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="file"
                            id="file-upload"
                            accept=".pdf,.docx,image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => document.getElementById('file-upload').click()}
                            className="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold py-1.5 px-3 rounded-xl transition flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800 shadow-sm active:scale-95"
                        >
                            <FileUp className="w-3.5 h-3.5" /> Tải file (PDF, Word, Ảnh)
                        </button>
                    </div>
                </div>

                {fileStatus && (
                    <div className="mb-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 animate-pulse">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> {fileStatus}
                    </div>
                )}

                <textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Dán nội dung câu hỏi vào đây, hoặc nhấn Tải file lên..."
                    className="w-full h-52 md:h-64 p-3.5 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-900 outline-none font-mono text-xs md:text-sm leading-relaxed transition"
                />
            </div>

            {/* Submit */}
            <button
                type="button"
                onClick={handleParse}
                disabled={isParsing}
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none transition text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {isParsing ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Đang bóc tách dữ liệu...
                    </>
                ) : (
                    <>
                        <Settings className="w-4 h-4" /> Xử lý & Kiểm tra lại
                    </>
                )}
            </button>
        </div>
    );
}
