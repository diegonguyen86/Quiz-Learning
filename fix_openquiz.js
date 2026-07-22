const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const startIdx = html.indexOf('        async function openQuiz(quizId) {');
const endIdx = html.indexOf('        async function shuffleAndStart() {');

if (startIdx !== -1 && endIdx !== -1) {
    const fixedOpenQuiz = `        async function openQuiz(quizId) {
            try {
                document.getElementById('welcome-screen').classList.add('hidden');
                document.getElementById('quiz-screen').classList.add('hidden');
                document.getElementById('result-screen').classList.add('hidden');
                document.getElementById('finish-screen').classList.add('hidden');
                document.getElementById('dashboard-screen').classList.add('hidden');
                
                // Show loading
                document.getElementById('auth-screen').innerHTML = \`<div class="py-12 text-center"><i class="fas fa-spinner fa-spin text-5xl text-blue-600 mb-6"></i><h2 class="text-xl font-bold text-gray-700 dark:text-white">Đang tải đề...</h2></div>\`;
                showScreen('auth-screen');

                activeQuizId = quizId;
                
                const doc = await db.collection("users").doc(currentUser.uid).collection("my_quizzes").doc(quizId).get();
                const data = doc.data();
                
                if (data.isClassroom) {
                    isStudentMode = true;
                    const teacherDoc = await db.doc(data.refPath).get();
                    if (!teacherDoc.exists) {
                        showToast("Giáo viên đã xóa lớp học này!", 'error');
                        await doc.ref.delete(); goToDashboard(); return;
                    }
                    ALL_QUESTIONS = teacherDoc.data().questions || [];
                    studentClassRef = db.doc(data.refPath).collection("students").doc(currentUser.uid);
                    TOTAL_SECTIONS = Math.ceil(ALL_QUESTIONS.length / SEC_SIZE);
                    currentSection = data.progress || 0;
                    
                    document.getElementById('student-badge').classList.remove('hidden');
                    document.getElementById('btn-shuffle').classList.add('hidden');
                } else {
                    isStudentMode = false;
                    studentClassRef = null;
                    ALL_QUESTIONS = data.questions || [];
                    TOTAL_SECTIONS = Math.ceil(ALL_QUESTIONS.length / SEC_SIZE);
                    currentSection = data.progress || 0;
                    
                    document.getElementById('student-badge').classList.add('hidden');
                    document.getElementById('btn-shuffle').classList.remove('hidden');
                }

                // CHỐT CHẶN BÁO LỖI NẾU ĐỀ RỖNG
                if (!ALL_QUESTIONS || ALL_QUESTIONS.length === 0) {
                    showToast("Bộ đề này bị rỗng hoặc lỗi dữ liệu. Vui lòng quay lại trang chủ và xóa bộ đề này đi để tạo lại!", 'error');
                    goToDashboard(); return;
                }

                document.getElementById('current-quiz-title').innerText = data.title;
                
                if(currentSection >= TOTAL_SECTIONS) { 
                    document.getElementById('finish-title').innerText = "HOÀN THÀNH!";
                    document.getElementById('finish-desc').innerText = isStudentMode ? "Bạn đã theo kịp 100% tiến độ của lớp học." : "Bạn đã hoàn thành xong bộ đề cá nhân.";
                    showScreen('finish-screen'); updateHeaderProgress(); return; 
                }
                
                document.getElementById('welcome-msg').innerText = \`Bộ đề có \${ALL_QUESTIONS.length} câu. Bạn đang ở Section \${currentSection + 1}/\${TOTAL_SECTIONS}.\`;
                
                updateHeaderProgress();
                showScreen('welcome-screen');
            } catch (e) { 
                console.error(e);
                showToast("Lỗi mở đề. Chi tiết hệ thống: " + e.message, 'error'); 
                goToDashboard(); 
            }
        }

`;

    const newHtml = html.substring(0, startIdx) + fixedOpenQuiz + html.substring(endIdx);
    fs.writeFileSync('index.html', newHtml);
    console.log('Successfully replaced openQuiz block');
} else {
    console.log('Could not find start or end index for openQuiz');
}
