const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const reps = [
    {
        old: `        function deletePendingQ(index) {
            showConfirm("Xóa câu hỏi", \`Bạn có chắc muốn xóa câu \${index + 1}?\`, () => {
                pendingParsedQuestions.splice(index, 1);
                renderPreviewScreen();
            }
        }`,
        new: `        function deletePendingQ(index) {
            showConfirm("Xóa câu hỏi", \`Bạn có chắc muốn xóa câu \${index + 1}?\`, () => {
                pendingParsedQuestions.splice(index, 1);
                renderPreviewScreen();
            });
        }`
    },
    {
        old: `        function removePendingOption(qIndex, optIndex) {
            if (pendingParsedQuestions[qIndex].o.length <= 2) {
                showToast("Một câu hỏi cần ít nhất 2 đáp án!", 'error');
                return;
            }
            showConfirm('Xóa đáp án', 'Bạn chắc chắn muốn xóa đáp án này?', () => {
                pendingParsedQuestions[qIndex].o.splice(optIndex, 1);
                let currentAns = pendingParsedQuestions[qIndex].a;
                pendingParsedQuestions[qIndex].a = currentAns.filter(a => a !== optIndex).map(a => a > optIndex ? a - 1 : a);
                renderPreviewScreen();
            }
        }`,
        new: `        function removePendingOption(qIndex, optIndex) {
            if (pendingParsedQuestions[qIndex].o.length <= 2) {
                showToast("Một câu hỏi cần ít nhất 2 đáp án!", 'error');
                return;
            }
            showConfirm('Xóa đáp án', 'Bạn chắc chắn muốn xóa đáp án này?', () => {
                pendingParsedQuestions[qIndex].o.splice(optIndex, 1);
                let currentAns = pendingParsedQuestions[qIndex].a;
                pendingParsedQuestions[qIndex].a = currentAns.filter(a => a !== optIndex).map(a => a > optIndex ? a - 1 : a);
                renderPreviewScreen();
            });
        }`
    },
    {
        old: `        async function resetQuiz(quizId, quizTitle) {
            showConfirm("Reset", \`Bạn muốn reset tiến độ của "\${quizTitle}" về 0%?\`, async () => {
                await db.collection("users").doc(currentUser.uid).collection("my_quizzes").doc(quizId).update({ progress: 0 });
                goToDashboard();
            }
        }`,
        new: `        async function resetQuiz(quizId, quizTitle) {
            showConfirm("Reset", \`Bạn muốn reset tiến độ của "\${quizTitle}" về 0%?\`, async () => {
                await db.collection("users").doc(currentUser.uid).collection("my_quizzes").doc(quizId).update({ progress: 0 });
                goToDashboard();
            });
        }`
    },
    {
        old: `        async function deleteQuiz(quizId, quizTitle) {
            let msg = isStudentMode ? \`Bạn muốn rời khỏi lớp học "\${quizTitle}"?\` : \`Xóa vĩnh viễn bộ đề "\${quizTitle}"? (Mất luôn cả tiến trình của học sinh)\`;
            showConfirm("Cảnh báo", msg, async () => {
                await db.collection("users").doc(currentUser.uid).collection("my_quizzes").doc(quizId).delete();
                goToDashboard();
            }
        }`,
        new: `        async function deleteQuiz(quizId, quizTitle) {
            let msg = isStudentMode ? \`Bạn muốn rời khỏi lớp học "\${quizTitle}"?\` : \`Xóa vĩnh viễn bộ đề "\${quizTitle}"? (Mất luôn cả tiến trình của học sinh)\`;
            showConfirm("Cảnh báo", msg, async () => {
                await db.collection("users").doc(currentUser.uid).collection("my_quizzes").doc(quizId).delete();
                goToDashboard();
            });
        }`
    },
    {
        old: `        async function resetAndRestart() {
            showConfirm("Làm lại", "Xác nhận làm lại từ đầu?", async () => {
                if(!isStudentMode) await db.collection("users").doc(currentUser.uid).collection("my_quizzes").doc(activeQuizId).update({ progress: 0 });
                currentSection = 0; startNextSection();
            }
        }`,
        new: `        async function resetAndRestart() {
            showConfirm("Làm lại", "Xác nhận làm lại từ đầu?", async () => {
                if(!isStudentMode) await db.collection("users").doc(currentUser.uid).collection("my_quizzes").doc(activeQuizId).update({ progress: 0 });
                currentSection = 0; startNextSection();
            });
        }`
    },
    {
        old: `        async function shuffleAndStart() {
            showConfirm("Trộn đề", "Trộn ngẫu nhiên toàn bộ câu hỏi?", () => {
                for (let i = ALL_QUESTIONS.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [ALL_QUESTIONS[i], ALL_QUESTIONS[j]] = [ALL_QUESTIONS[j], ALL_QUESTIONS[i]];
                }
                currentSection = 0; startNextSection();
            }
        }`,
        new: `        async function shuffleAndStart() {
            showConfirm("Trộn đề", "Trộn ngẫu nhiên toàn bộ câu hỏi?", () => {
                for (let i = ALL_QUESTIONS.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [ALL_QUESTIONS[i], ALL_QUESTIONS[j]] = [ALL_QUESTIONS[j], ALL_QUESTIONS[i]];
                }
                currentSection = 0; startNextSection();
            });
        }`
    }
];

reps.forEach((r, i) => {
    if (html.includes(r.old)) {
        html = html.replace(r.old, r.new);
        console.log('Fixed block ' + i);
    } else {
        console.log('Could not find block ' + i);
    }
});

fs.writeFileSync('index.html', html);
