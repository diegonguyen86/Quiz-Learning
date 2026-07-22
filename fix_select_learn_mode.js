const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const oldLogic = `        function selectLearnMode(mode) {
            closeLearnOptions();
            if (currentLearnQuizId) {
                openQuiz(currentLearnQuizId, mode);
            }
        }`;

const newLogic = `        function selectLearnMode(mode) {
            const quizId = currentLearnQuizId;
            closeLearnOptions();
            if (quizId) {
                openQuiz(quizId, mode);
            }
        }`;

if (html.includes(oldLogic)) {
    html = html.replace(oldLogic, newLogic);
    fs.writeFileSync('index.html', html);
    console.log('Fixed selectLearnMode');
} else {
    console.log('Block not found');
}
