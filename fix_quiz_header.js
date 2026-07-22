const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const oldHeader = `        <div id="quiz-screen" class="max-w-3xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 md:p-8 fade-in hidden">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 pb-4 border-b border-gray-100 dark:border-gray-700 gap-2 md:gap-0">
                <span class="text-xs md:text-sm font-bold text-blue-700 dark:text-blue-500 uppercase tracking-wider" id="quiz-status">Câu 1/12</span>
                <span class="text-xs md:text-sm font-bold text-amber-600 bg-amber-100 dark:bg-orange-900/30 px-3 py-1 rounded-lg hidden self-start md:self-auto" id="retry-badge"><i class="fas fa-redo mr-1"></i> Làm lại câu sai</span>
            </div>`;

const newHeader = `        <div id="quiz-screen" class="max-w-3xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 md:p-8 fade-in hidden">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 pb-4 border-b border-gray-100 dark:border-gray-700 gap-2 md:gap-0">
                <span class="text-xs md:text-sm font-bold text-blue-700 dark:text-blue-500 uppercase tracking-wider" id="quiz-status">Câu 1/12</span>
                
                <div class="flex flex-wrap gap-2 items-center">
                    <span class="text-xs md:text-sm font-bold text-amber-600 bg-amber-100 dark:bg-orange-900/30 px-3 py-1 rounded-lg hidden self-start md:self-auto" id="retry-badge"><i class="fas fa-redo mr-1"></i> Làm lại câu sai</span>
                    
                    <button id="btn-shuffle" onclick="shuffleAndStart()" class="hidden md:block bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs font-bold py-1.5 px-3 rounded-lg transition shadow-sm">
                        <i class="fas fa-random mr-1"></i> Trộn đề
                    </button>
                    <button id="btn-srs" onclick="startSRS()" class="hidden md:block bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-xs font-bold py-1.5 px-3 rounded-lg transition shadow-sm">
                        <i class="fas fa-brain mr-1"></i> Ôn tập (SRS)
                    </button>
                    <button id="btn-pdf" onclick="exportPDF()" class="hidden md:block bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold py-1.5 px-3 rounded-lg transition shadow-sm">
                        <i class="fas fa-file-pdf mr-1"></i> Tải PDF
                    </button>
                </div>
            </div>`;

if (html.includes(oldHeader)) {
    html = html.replace(oldHeader, newHeader);
} else {
    console.log("Could not find quiz-screen header");
}

const srsLogic = `
        async function startSRS() {
            showConfirm("Ôn tập Thông minh (SRS)", "Hệ thống sẽ lọc ra các câu hỏi đã đến hạn ôn tập dựa trên độ khó và trí nhớ của bạn.", async () => {
                const now = new Date().toISOString();
                
                let srsQuestions = ALL_QUESTIONS.filter(q => !q.nextReview || q.nextReview <= now);
                
                if (srsQuestions.length === 0) {
                    showToast("Tuyệt vời! Bạn không có câu nào cần ôn tập hôm nay.", "success");
                    return;
                }

                showToast(\`Đã lọc được \${srsQuestions.length} câu cần ôn tập hôm nay.\`, "info");
                
                for (let i = srsQuestions.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [srsQuestions[i], srsQuestions[j]] = [srsQuestions[j], srsQuestions[i]];
                }
                
                const nonSrs = ALL_QUESTIONS.filter(q => q.nextReview && q.nextReview > now);
                ALL_QUESTIONS = [...srsQuestions, ...nonSrs];
                
                TOTAL_SECTIONS = Math.ceil(srsQuestions.length / SEC_SIZE);
                currentSection = 0;
                
                if(!isStudentMode) await db.collection("users").doc(currentUser.uid).collection("my_quizzes").doc(activeQuizId).update({ questions: ALL_QUESTIONS, progress: 0 });
                startNextSection();
            });
        }
`;

if (!html.includes('async function startSRS')) {
    html = html.replace('        async function shuffleAndStart()', srsLogic + '\n        async function shuffleAndStart()');
}

// Add exportPDF function
const pdfLogic = `
        function exportPDF() {
            let printWindow = window.open('', '_blank');
            printWindow.document.write('<html><head><title>Bộ đề: ' + (window.activeQuizTitle || 'Ôn tập') + '</title>');
            printWindow.document.write('<style>body { font-family: Arial, sans-serif; padding: 30px; line-height: 1.6; } .question { margin-bottom: 25px; break-inside: avoid; } .option { margin-left: 20px; } .correct { font-weight: bold; color: #16a34a; } .explanation { color: #4b5563; font-size: 0.9em; margin-top: 8px; padding-left: 20px; border-left: 3px solid #e5e7eb; }</style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write('<h2 style="text-align: center; margin-bottom: 30px;">' + (window.activeQuizTitle || 'BỘ ĐỀ ÔN TẬP') + '</h2><hr style="margin-bottom: 30px;"/>');
            
            ALL_QUESTIONS.forEach((q, i) => {
                printWindow.document.write('<div class="question">');
                printWindow.document.write('<p><b>Câu ' + (i+1) + ':</b> ' + q.q.replace(/\\n/g, '<br/>') + '</p>');
                q.opts.forEach((opt, optIdx) => {
                    const isCorrect = q.a.includes(optIdx);
                    const optLetter = String.fromCharCode(65 + optIdx);
                    printWindow.document.write('<div class="option ' + (isCorrect ? 'correct' : '') + '">' + optLetter + '. ' + opt + '</div>');
                });
                if (q.ex) {
                    printWindow.document.write('<div class="explanation"><b>Giải thích:</b> ' + q.ex.replace(/\\n/g, '<br/>') + '</div>');
                }
                printWindow.document.write('</div>');
            });
            
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
            }, 500);
        }
`;

if (!html.includes('function exportPDF()')) {
    html = html.replace('        async function startSRS()', pdfLogic + '\n        async function startSRS()');
}

// Show/hide logic inside openQuiz
const oldOpenQuizHide = "                if (isStudentMode) {";
const newOpenQuizHide = `                if (isStudentMode) {
                    document.getElementById('btn-shuffle').classList.add('hidden');
                    document.getElementById('btn-srs').classList.add('hidden');
                    document.getElementById('btn-pdf').classList.add('hidden');
                } else {
                    document.getElementById('btn-shuffle').classList.remove('hidden');
                    document.getElementById('btn-srs').classList.remove('hidden');
                    document.getElementById('btn-pdf').classList.remove('hidden');
                }
                if (isStudentMode) {`;

if (html.includes(oldOpenQuizHide) && !html.includes("document.getElementById('btn-srs').classList.remove('hidden');")) {
    html = html.replace(oldOpenQuizHide, newOpenQuizHide);
}

fs.writeFileSync('index.html', html);
console.log('Fixed quiz-screen header and buttons.');
