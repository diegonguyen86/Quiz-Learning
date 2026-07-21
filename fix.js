const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf-8');

// Replace alerts
h = h.replace(/alert\((.*?)\)/g, "showToast($1, 'error')");

// Replace confirm 1: logout
h = h.replace(
    'function logoutApp() { if(confirm("Bạn có chắc muốn đăng xuất?")) auth.signOut(); }',
    'function logoutApp() { showConfirm("Đăng xuất", "Bạn có chắc muốn đăng xuất?", () => auth.signOut()); }'
);

// Replace confirm 2: refreshShareCode
let refreshCodeStr = `        async function refreshShareCode(quizId) {
            if(!confirm("Đổi mã bảo mật mới?\\nNhững ai giữ mã cũ sẽ KHÔNG THỂ vào copy hay học được nữa.")) return;
            try {`;
let newRefreshCodeStr = `        async function refreshShareCode(quizId) {
            showConfirm("Đổi mã bảo mật", "Những ai giữ mã cũ sẽ KHÔNG THỂ vào copy hay học được nữa. Bạn chắc chứ?", async () => {
            try {`;
let refreshEndStr = `                showScreen('dashboard-screen');
            } catch(e) { alert("Lỗi cập nhật mã!"); }
        }`;
let newRefreshEndStr = `                showScreen('dashboard-screen');
            } catch(e) { showToast("Lỗi cập nhật mã!", 'error'); }
            });
        }`;
h = h.replace(refreshCodeStr, newRefreshCodeStr);
h = h.replace(refreshEndStr, newRefreshEndStr);

// Replace confirm 3: deletePendingQ
h = h.replace(
    'if (confirm(`Xóa câu hỏi ${index + 1}?`)) {',
    'showConfirm("Xóa câu hỏi", `Bạn có chắc muốn xóa câu ${index + 1}?`, () => {'
);
// We need to close the curly brace for showConfirm in deletePendingQ
// It looks like:
/*
        function deletePendingQ(index) {
            if (confirm(`Xóa câu hỏi ${index + 1}?`)) {
                pendingParsedQuestions.splice(index, 1);
                renderPreviewScreen();
            }
        }
*/
h = h.replace(
    `        function deletePendingQ(index) {
            showConfirm("Xóa câu hỏi", \`Bạn có chắc muốn xóa câu \${index + 1}?\`, () => {
                pendingParsedQuestions.splice(index, 1);
                renderPreviewScreen();
            }
        }`,
    `        function deletePendingQ(index) {
            showConfirm("Xóa câu hỏi", \`Bạn có chắc muốn xóa câu \${index + 1}?\`, () => {
                pendingParsedQuestions.splice(index, 1);
                renderPreviewScreen();
            });
        }`
);

// Replace confirm 4: removePendingOption
h = h.replace(
    "if (confirm('Xóa đáp án này?')) {",
    "showConfirm('Xóa đáp án', 'Bạn chắc chắn muốn xóa đáp án này?', () => {"
);
h = h.replace(
    `            showConfirm('Xóa đáp án', 'Bạn chắc chắn muốn xóa đáp án này?', () => {
                pendingParsedQuestions[qIndex].o.splice(optIndex, 1);
                let currentAns = pendingParsedQuestions[qIndex].a;
                pendingParsedQuestions[qIndex].a = currentAns.filter(a => a !== optIndex).map(a => a > optIndex ? a - 1 : a);
                renderPreviewScreen();
            }
        }`,
    `            showConfirm('Xóa đáp án', 'Bạn chắc chắn muốn xóa đáp án này?', () => {
                pendingParsedQuestions[qIndex].o.splice(optIndex, 1);
                let currentAns = pendingParsedQuestions[qIndex].a;
                pendingParsedQuestions[qIndex].a = currentAns.filter(a => a !== optIndex).map(a => a > optIndex ? a - 1 : a);
                renderPreviewScreen();
            });
        }`
);

// Replace confirm 5: resetQuiz
h = h.replace(
    'if(confirm(`Bạn muốn reset tiến độ của "${quizTitle}" về 0%?`)) {',
    'showConfirm("Reset", `Bạn muốn reset tiến độ của "${quizTitle}" về 0%?`, async () => {'
);
h = h.replace(
    `            showConfirm("Reset", \`Bạn muốn reset tiến độ của "\${quizTitle}" về 0%?\`, async () => {
                await db.collection("users").doc(currentUser.uid).collection("my_quizzes").doc(quizId).update({ progress: 0 });
                goToDashboard();
            }
        }`,
    `            showConfirm("Reset", \`Bạn muốn reset tiến độ của "\${quizTitle}" về 0%?\`, async () => {
                await db.collection("users").doc(currentUser.uid).collection("my_quizzes").doc(quizId).update({ progress: 0 });
                goToDashboard();
            });
        }`
);

// Replace confirm 6: deleteQuiz
h = h.replace(
    'if(confirm(msg)) {',
    'showConfirm("Cảnh báo", msg, async () => {'
);
h = h.replace(
    `            showConfirm("Cảnh báo", msg, async () => {
                await db.collection("users").doc(currentUser.uid).collection("my_quizzes").doc(quizId).delete();
                goToDashboard();
            }
        }`,
    `            showConfirm("Cảnh báo", msg, async () => {
                await db.collection("users").doc(currentUser.uid).collection("my_quizzes").doc(quizId).delete();
                goToDashboard();
            });
        }`
);

// Replace confirm 7: resetAndRestart
h = h.replace(
    'if(confirm("Xác nhận làm lại từ đầu?")) {',
    'showConfirm("Làm lại", "Xác nhận làm lại từ đầu?", async () => {'
);
h = h.replace(
    `            showConfirm("Làm lại", "Xác nhận làm lại từ đầu?", async () => {
                await db.collection("users").doc(currentUser.uid).collection("my_quizzes").doc(activeQuizId).update({ progress: 0 });
                currentSection = 0;
                startNextSection();
            }
        }`,
    `            showConfirm("Làm lại", "Xác nhận làm lại từ đầu?", async () => {
                await db.collection("users").doc(currentUser.uid).collection("my_quizzes").doc(activeQuizId).update({ progress: 0 });
                currentSection = 0;
                startNextSection();
            });
        }`
);

// Replace confirm 8: shuffleAndStart
h = h.replace(
    'if(confirm("Trộn ngẫu nhiên toàn bộ câu hỏi?")) {',
    'showConfirm("Trộn đề", "Trộn ngẫu nhiên toàn bộ câu hỏi?", () => {'
);
h = h.replace(
    `            showConfirm("Trộn đề", "Trộn ngẫu nhiên toàn bộ câu hỏi?", () => {
                for (let i = ALL_QUESTIONS.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [ALL_QUESTIONS[i], ALL_QUESTIONS[j]] = [ALL_QUESTIONS[j], ALL_QUESTIONS[i]];
                }
                currentSection = 0;
                startNextSection();
            }
        }`,
    `            showConfirm("Trộn đề", "Trộn ngẫu nhiên toàn bộ câu hỏi?", () => {
                for (let i = ALL_QUESTIONS.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [ALL_QUESTIONS[i], ALL_QUESTIONS[j]] = [ALL_QUESTIONS[j], ALL_QUESTIONS[i]];
                }
                currentSection = 0;
                startNextSection();
            });
        }`
);


fs.writeFileSync('index.html', h);
console.log('Replaced all confirms successfully');
