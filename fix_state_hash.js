const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

// Fix 1: Reset hiddenAIText in openImportScreen
const oldImport = `        function openImportScreen() {
            editQuizId = null; 
            document.getElementById('quiz-title-input').value = '';
            document.getElementById('raw-text-input').value = '';
            document.getElementById('import-screen-title').innerHTML = '<i class="fas fa-cloud-upload-alt mr-2"></i>Tạo Bộ Đề Mới';`;

const newImport = `        function openImportScreen() {
            editQuizId = null; 
            hiddenAIText = ''; // FIX: Reset hidden AI text
            document.getElementById('quiz-title-input').value = '';
            document.getElementById('raw-text-input').value = '';
            
            // Show raw text area and hide AI result div if it was shown
            document.getElementById('raw-text-input').classList.remove('hidden');
            const aiSuccess = document.getElementById('ai-success-msg');
            if(aiSuccess) aiSuccess.remove();

            document.getElementById('import-screen-title').innerHTML = '<i class="fas fa-cloud-upload-alt mr-2"></i>Tạo Bộ Đề Mới';`;

if (html.includes(oldImport)) {
    html = html.replace(oldImport, newImport);
} else {
    console.log("oldImport not found");
}

// Fix 2: History API for showScreen
const oldShowScreen = `        function showScreen(screenId) {
            screens.forEach(id => document.getElementById(id).classList.add('hidden'));
            document.getElementById(screenId).classList.remove('hidden');`;

const newShowScreen = `        function showScreen(screenId, pushState = true) {
            screens.forEach(id => document.getElementById(id).classList.add('hidden'));
            document.getElementById(screenId).classList.remove('hidden');
            
            if (pushState && window.history) {
                window.history.pushState({ screen: screenId }, "", "#" + screenId);
            }`;

if (html.includes(oldShowScreen)) {
    html = html.replace(oldShowScreen, newShowScreen);
    
    // Add popstate listener
    const popStateLogic = `
        window.addEventListener('popstate', function(event) {
            if (event.state && event.state.screen) {
                showScreen(event.state.screen, false);
            } else {
                if (currentUser) goToDashboard(true);
            }
        });
`;
    if (!html.includes('popstate')) {
        html = html.replace('        function showScreen', popStateLogic + '\n        function showScreen');
    }
} else {
    console.log("oldShowScreen not found");
}

// Fix 3: cancelPreview logic (must also clear hiddenAIText if user cancels)
const oldCancelPreview = `        function cancelPreview() {
            showScreen('import-screen');
        }`;
const newCancelPreview = `        function cancelPreview() {
            hiddenAIText = '';
            document.getElementById('raw-text-input').classList.remove('hidden');
            const aiSuccess = document.getElementById('ai-success-msg');
            if(aiSuccess) aiSuccess.remove();
            showScreen('import-screen');
        }`;

if (html.includes(oldCancelPreview)) {
    html = html.replace(oldCancelPreview, newCancelPreview);
}

fs.writeFileSync('index.html', html);
console.log('Fixed bugs');
