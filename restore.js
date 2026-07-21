const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const deletedCode = `                document.getElementById('current-quiz-title').innerText = data.title;
                
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
`;

const targetAnchor = `                    goToDashboard(); return;
                }

                showToast("Lỗi mở đề. Chi tiết hệ thống: " + e.message, 'error');`;

const replacedTarget = `                    goToDashboard(); return;
                }

${deletedCode}                showToast("Lỗi mở đề. Chi tiết hệ thống: " + e.message, 'error');`;

html = html.replace(targetAnchor, replacedTarget);

// Now apply the REAL change for elPrevBtn logic to elSkipBtn
const badPrevLogic = `const elPrevBtn = document.getElementById('prev-btn');
            
            if (currentQIndexInQueue > 0 && !isReviewMode) elPrevBtn.classList.remove('hidden'); 
            else elPrevBtn.classList.add('hidden');`;

const goodSkipLogic = `const elSkipBtn = document.getElementById('skip-btn');
            elSkipBtn.classList.remove('hidden');`;

html = html.replace(badPrevLogic, goodSkipLogic);

fs.writeFileSync('index.html', html);
console.log('Restored openQuiz and fixed renderCurrentQuestion.');
