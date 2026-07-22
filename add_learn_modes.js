const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

// 1. Add HTML modal
const modalHtml = `
    <div id="learn-options-modal" class="fixed inset-0 bg-gray-900 bg-opacity-50 z-[100] hidden flex items-center justify-center p-4 fade-in">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 relative overflow-hidden">
            <button onclick="closeLearnOptions()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl transition">
                <i class="fas fa-times"></i>
            </button>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">Chọn Chế Độ Học</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm text-center mb-6">Hãy chọn phương pháp học phù hợp với mục tiêu của bạn lúc này.</p>
            
            <div class="space-y-4">
                <!-- Option 1: Quick Learn -->
                <button onclick="selectLearnMode('quick')" class="w-full flex items-start p-4 border-2 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition text-left group">
                    <div class="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 p-3 rounded-lg mr-4 group-hover:scale-110 transition-transform">
                        <i class="fas fa-bolt text-xl"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-blue-800 dark:text-blue-300 mb-1">Học Nhanh (Trí nhớ ngắn hạn)</h4>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Học toàn bộ hoặc ngẫu nhiên các câu hỏi. Phù hợp để ôn thi gấp hoặc lướt qua toàn bộ nội dung.</p>
                    </div>
                </button>
                
                <!-- Option 2: SRS -->
                <button onclick="selectLearnMode('srs')" class="w-full flex items-start p-4 border-2 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition text-left group">
                    <div class="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 p-3 rounded-lg mr-4 group-hover:scale-110 transition-transform">
                        <i class="fas fa-brain text-xl"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-indigo-800 dark:text-indigo-300 mb-1">Học Nhớ Lâu (Ôn tập ngắt quãng)</h4>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Chỉ ôn tập những câu đã đến hạn (SRS). Giúp ghi nhớ dài hạn, phù hợp với các bộ đề ngắn và học hàng ngày.</p>
                    </div>
                </button>
            </div>
        </div>
    </div>`;

// Find where to insert modal (e.g. before main or end of body, actually right before closing main is fine, or right before <script>)
const scriptStart = html.indexOf('    <script>\n        // Custom UI System');
if (scriptStart !== -1) {
    html = html.substring(0, scriptStart) + modalHtml + '\n' + html.substring(scriptStart);
} else {
    html = html.replace('</body>', modalHtml + '\n</body>');
}

// 2. Add JS functions
const jsLogic = `
        let currentLearnQuizId = null;
        
        function showLearnOptions(quizId) {
            currentLearnQuizId = quizId;
            document.getElementById('learn-options-modal').classList.remove('hidden');
        }
        
        function closeLearnOptions() {
            document.getElementById('learn-options-modal').classList.add('hidden');
            currentLearnQuizId = null;
        }
        
        function selectLearnMode(mode) {
            closeLearnOptions();
            if (currentLearnQuizId) {
                openQuiz(currentLearnQuizId, mode);
            }
        }
`;

html = html.replace('        async function openQuiz(quizId) {', jsLogic + '\n        async function openQuiz(quizId, mode = \'quick\') {');

// 3. Replace openQuiz with showLearnOptions in goToDashboard
html = html.replaceAll("onclick=\"openQuiz('", "onclick=\"showLearnOptions('");

// 4. Update openQuiz logic to handle mode
const initLogicOld = `                document.getElementById('current-quiz-title').innerText = data.title;
                
                if(currentSection >= TOTAL_SECTIONS) {`;

const initLogicNew = `                document.getElementById('current-quiz-title').innerText = data.title;
                
                // --- APPY MODE ---
                if (mode === 'srs') {
                    const now = new Date().toISOString();
                    let srsQuestions = ALL_QUESTIONS.filter(q => !q.nextReview || q.nextReview <= now);
                    
                    if (srsQuestions.length === 0) {
                        showToast("Tuyệt vời! Bạn không có câu nào cần ôn tập hôm nay.", "success");
                        goToDashboard();
                        return;
                    }
                    
                    showToast(\`Đã lọc được \${srsQuestions.length} câu cần ôn tập hôm nay.\`, "info");
                    
                    // Shuffle SRS
                    for (let i = srsQuestions.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [srsQuestions[i], srsQuestions[j]] = [srsQuestions[j], srsQuestions[i]];
                    }
                    
                    const nonSrs = ALL_QUESTIONS.filter(q => q.nextReview && q.nextReview > now);
                    ALL_QUESTIONS = [...srsQuestions, ...nonSrs];
                    
                    TOTAL_SECTIONS = Math.ceil(srsQuestions.length / SEC_SIZE);
                    currentSection = 0; // Luôn bắt đầu từ đầu cho SRS
                    if(!isStudentMode) {
                        await db.collection("users").doc(currentUser.uid).collection("my_quizzes").doc(activeQuizId).update({ questions: ALL_QUESTIONS, progress: 0 });
                    }
                }
                
                if(currentSection >= TOTAL_SECTIONS) {`;

if (html.includes(initLogicOld)) {
    html = html.replace(initLogicOld, initLogicNew);
} else {
    console.log("Could not find initLogicOld block");
}

fs.writeFileSync('index.html', html);
console.log('Done learning modes');
