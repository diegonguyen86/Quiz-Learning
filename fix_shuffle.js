const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const startIdx = html.indexOf('        async function shuffleAndStart() {');
const endIdx = html.indexOf('        // CẮT SECTION VÀ ĐẾM CÂU');

if (startIdx !== -1 && endIdx !== -1) {
    const fixedShuffle = `        async function shuffleAndStart() {
            showConfirm("Trộn đề", "Trộn ngẫu nhiên toàn bộ câu hỏi?", async () => {
                for (let i = ALL_QUESTIONS.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [ALL_QUESTIONS[i], ALL_QUESTIONS[j]] = [ALL_QUESTIONS[j], ALL_QUESTIONS[i]];
                }
                currentSection = 0;
                if(!isStudentMode) await db.collection("users").doc(currentUser.uid).collection("my_quizzes").doc(activeQuizId).update({ questions: ALL_QUESTIONS, progress: 0 });
                startNextSection();
            });
        }

`;

    const newHtml = html.substring(0, startIdx) + fixedShuffle + html.substring(endIdx);
    fs.writeFileSync('index.html', newHtml);
    console.log('Successfully replaced shuffleAndStart block');
} else {
    console.log('Could not find start or end index for shuffleAndStart');
}
