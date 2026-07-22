const fs = require('fs');
eval(fs.readFileSync('extract_parseAndSaveData.js', 'utf-8'));

const mockText = `Câu 1: Thủ đô của Việt Nam là gì?
A. Hà Nội
B. Hồ Chí Minh
C. Đà Nẵng
D. Cần Thơ
Đáp án: A
`;

global.document = {
    getElementById: (id) => ({ value: (id==='raw-text-input' ? mockText : 'Mock Title'), innerHTML: '', disabled: false })
};
global.hiddenAIText = '';
global.showToast = console.log;
global.currentUser = { uid: '123' };
global.editQuizId = null;

// mock next function call
global.showScreen = console.log;
global.renderPreviewScreen = console.log;
global.pendingParsedQuestions = [];
global.pendingQuizTitle = '';

parseAndSaveData().catch(e => console.log('ERROR:', e.message, e.stack));
