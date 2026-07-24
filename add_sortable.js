const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const cdn = '<script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script>';
if (!html.includes('Sortable.min.js')) {
    html = html.replace('</head>', cdn + '\n</head>');
}

// Find renderPreviewScreen
const startIdx = html.indexOf('function renderPreviewScreen() {');
if (startIdx !== -1) {
    const endStr = 'document.getElementById(\'preview-screen\').classList.remove(\'hidden\');';
    const endIdx = html.indexOf(endStr, startIdx);
    
    if (endIdx !== -1) {
        // We will just replace the render logic to include sortable-options and Sortable initialization
        const originalFunc = html.substring(startIdx, endIdx + endStr.length);
        
        let newFunc = `function moveOption(qIndex, oldIndex, newIndex) {
            const question = pendingParsedQuestions[qIndex];
            const opt = question.o.splice(oldIndex, 1)[0];
            question.o.splice(newIndex, 0, opt);
            
            const correctStates = question.o.map((_, i) => question.a.includes(i));
            // Correct states array before splice was matching original 'o' array length... Wait!
            // Actually, we must create correctStates BEFORE splicing 'o' to map correctly!
            // Let's rewrite moveOption inside renderPreviewScreen or as a global function.
        }
        
        function renderPreviewScreen() {`;

        // It's safer to just write a Node script that accurately parses and replaces the lines.
    }
}
