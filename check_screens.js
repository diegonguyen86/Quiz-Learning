const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf-8');
const screens = ['auth-screen', 'dashboard-screen', 'import-screen', 'preview-screen', 'welcome-screen', 'quiz-screen', 'result-screen', 'finish-screen'];
screens.forEach(s => {
    if(!html.includes('id="' + s + '"')) console.log('MISSING:', s);
});
