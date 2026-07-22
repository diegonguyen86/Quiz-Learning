const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

// 1. goToDashboard buttons
html = html.replace(/onclick="showLearnOptions\('\$\{doc\.id\}'\)"/g, `onclick="showLearnOptions('\${doc.id}', '\${data.learnMode || ''}')"`);

// 2. showLearnOptions and selectLearnMode
const oldLogic = `        function showLearnOptions(quizId) {
            currentLearnQuizId = quizId;
            document.getElementById('learn-options-modal').classList.remove('hidden');
        }
        
        function closeLearnOptions() {
            document.getElementById('learn-options-modal').classList.add('hidden');
            currentLearnQuizId = null;
        }
        
        function selectLearnMode(mode) {
            const quizId = currentLearnQuizId;
            closeLearnOptions();
            if (quizId) {
                openQuiz(quizId, mode);
            }
        }`;

const newLogic = `        function showLearnOptions(quizId, savedMode = '') {
            currentLearnQuizId = quizId;
            if (savedMode) {
                openQuiz(quizId, savedMode);
            } else {
                document.getElementById('learn-options-modal').classList.remove('hidden');
            }
        }
        
        function closeLearnOptions() {
            document.getElementById('learn-options-modal').classList.add('hidden');
            currentLearnQuizId = null;
        }
        
        async function selectLearnMode(mode) {
            const quizId = currentLearnQuizId;
            closeLearnOptions();
            if (quizId) {
                if(currentUser) {
                    try {
                        await db.collection("users").doc(currentUser.uid).collection("my_quizzes").doc(quizId).update({ learnMode: mode });
                    } catch (e) { console.error(e); }
                }
                openQuiz(quizId, mode);
            }
        }`;

if (html.includes(oldLogic)) {
    html = html.replace(oldLogic, newLogic);
} else {
    console.log("Could not find oldLogic!");
}

// 3. resetQuiz
const oldReset = `        async function resetQuiz(quizId, quizTitle) {
            showConfirm("Reset", \`Bạn muốn reset tiến độ của "\${quizTitle}" về 0%?\`, async () => {
                await db.collection("users").doc(currentUser.uid).collection("my_quizzes").doc(quizId).update({ progress: 0 });
                goToDashboard();
            });
        }`;

const newReset = `        async function resetQuiz(quizId, quizTitle) {
            showConfirm("Reset", \`Bạn muốn reset tiến độ của "\${quizTitle}" về 0%?\`, async () => {
                await db.collection("users").doc(currentUser.uid).collection("my_quizzes").doc(quizId).update({ 
                    progress: 0,
                    learnMode: firebase.firestore.FieldValue.delete()
                });
                goToDashboard();
            });
        }`;

if (html.includes(oldReset)) {
    html = html.replace(oldReset, newReset);
} else {
    console.log("Could not find oldReset!");
}

fs.writeFileSync('index.html', html);
console.log('Saved preferences mode!');
