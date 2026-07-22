const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

// 1. Inject SRS logic in handleNext
const oldSRS1 = `                if (!isCorrect) {
                    if(!mistakes.includes(realIdx)) mistakes.push(realIdx);
                    statusEl.innerHTML += isMissing ? ' <span class="text-amber-600 ml-2 font-bold animate-pulse">- THIẾU ĐÁP ÁN!</span>' : ' <span class="text-red-500 ml-2 font-bold animate-pulse">- SAI RỒI!</span>';
                } else {
                    statusEl.innerHTML += ' <span class="text-green-500 ml-2 font-bold animate-pulse">- CHÍNH XÁC!</span>';`;

const newSRS1 = `                if (!isCorrect) {
                    if(!mistakes.includes(realIdx)) mistakes.push(realIdx);
                    // SRS logic (Wrong)
                    qData.ease = Math.max(1.3, (qData.ease || 2.5) - 0.2);
                    qData.interval = 0;
                    qData.nextReview = new Date().toISOString();

                    statusEl.innerHTML += isMissing ? ' <span class="text-amber-600 ml-2 font-bold animate-pulse">- THIẾU ĐÁP ÁN!</span>' : ' <span class="text-red-500 ml-2 font-bold animate-pulse">- SAI RỒI!</span>';
                } else {
                    // SRS logic (Correct)
                    if (!isReviewMode) {
                        qData.ease = (qData.ease || 2.5) + 0.1;
                        if (!qData.interval) qData.interval = 1;
                        else if (qData.interval === 1) qData.interval = 3;
                        else qData.interval = Math.round(qData.interval * qData.ease);
                        
                        let nr = new Date();
                        nr.setDate(nr.getDate() + qData.interval);
                        qData.nextReview = nr.toISOString();
                    }
                    statusEl.innerHTML += ' <span class="text-green-500 ml-2 font-bold animate-pulse">- CHÍNH XÁC!</span>';`;

html = html.replace(oldSRS1, newSRS1);

// 2. Save ALL_QUESTIONS in finishPhase
const oldSaveHistory = `                    if (correctCount > 0 || wrongCount > 0) {
                        const dbRef = db.collection("users").doc(currentUser.uid).collection("my_quizzes").doc(activeQuizId);
                        dbRef.update({
                            history: firebase.firestore.FieldValue.arrayUnion({
                                timestamp: today,
                                correct: correctCount,
                                wrong: wrongCount
                            })
                        });
                    }`;

const newSaveHistory = `                    if (correctCount > 0 || wrongCount > 0) {
                        const dbRef = db.collection("users").doc(currentUser.uid).collection("my_quizzes").doc(activeQuizId);
                        dbRef.update({
                            history: firebase.firestore.FieldValue.arrayUnion({
                                timestamp: today,
                                correct: correctCount,
                                wrong: wrongCount
                            }),
                            questions: ALL_QUESTIONS, // Save SRS data
                            progress: currentSection + 1
                        });
                    }`;
html = html.replace(oldSaveHistory, newSaveHistory);


// 3. Add SRS button to UI (replace Shuffle button with SRS button if personal quiz)
// Original code in loadMyQuizzes/goToDashboard for openQuiz:
// wait, the shuffle button is in the Quiz screen itself!
const oldShuffleBtn = `<button id="btn-shuffle" onclick="shuffleAndStart()" class="hidden md:block bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400 font-bold py-2 px-4 rounded-xl border-2 border-amber-200 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900 shadow-sm transition">
                <i class="fas fa-random mr-1"></i> Trộn đề
            </button>`;
const newShuffleBtn = `<button id="btn-shuffle" onclick="shuffleAndStart()" class="hidden md:block bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400 font-bold py-2 px-4 rounded-xl border-2 border-amber-200 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900 shadow-sm transition" title="Làm ngẫu nhiên tất cả">
                <i class="fas fa-random mr-1"></i> Trộn đề
            </button>
            <button id="btn-srs" onclick="startSRS()" class="hidden md:block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl border-2 border-indigo-600 hover:border-indigo-700 shadow-sm transition" title="Chỉ ôn tập các câu đến hạn">
                <i class="fas fa-brain mr-1"></i> Ôn tập Thông minh (SRS)
            </button>`;

html = html.replace(oldShuffleBtn, newShuffleBtn);
// Also need to show/hide btn-srs in openQuiz:
html = html.replace("document.getElementById('btn-shuffle').classList.add('hidden');", "document.getElementById('btn-shuffle').classList.add('hidden'); document.getElementById('btn-srs').classList.add('hidden');");
html = html.replace("document.getElementById('btn-shuffle').classList.remove('hidden');", "document.getElementById('btn-shuffle').classList.remove('hidden'); document.getElementById('btn-srs').classList.remove('hidden');");

// 4. Implement startSRS() function
const srsFunction = `
        async function startSRS() {
            showConfirm("Ôn tập Thông minh (SRS)", "Hệ thống sẽ lọc ra các câu hỏi đã đến hạn ôn tập dựa trên độ khó và trí nhớ của bạn.", async () => {
                const now = new Date().toISOString();
                
                // Lọc ra những câu chưa từng làm hoặc đã đến hạn
                let srsQuestions = ALL_QUESTIONS.filter(q => !q.nextReview || q.nextReview <= now);
                
                if (srsQuestions.length === 0) {
                    showToast("Tuyệt vời! Bạn không có câu nào cần ôn tập hôm nay.", "success");
                    return;
                }

                showToast(\`Đã lọc được \${srsQuestions.length} câu cần ôn tập hôm nay.\`, "info");
                
                // Trộn nhẹ danh sách SRS
                for (let i = srsQuestions.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [srsQuestions[i], srsQuestions[j]] = [srsQuestions[j], srsQuestions[i]];
                }
                
                // Đưa srsQuestions lên đầu ALL_QUESTIONS, và phần còn lại đẩy xuống dưới
                const nonSrs = ALL_QUESTIONS.filter(q => q.nextReview && q.nextReview > now);
                ALL_QUESTIONS = [...srsQuestions, ...nonSrs];
                
                TOTAL_SECTIONS = Math.ceil(srsQuestions.length / SEC_SIZE); // Chỉ đếm section cho srs
                currentSection = 0;
                
                if(!isStudentMode) await db.collection("users").doc(currentUser.uid).collection("my_quizzes").doc(activeQuizId).update({ questions: ALL_QUESTIONS, progress: 0 });
                startNextSection();
            });
        }
`;
html = html.replace('        async function shuffleAndStart() {', srsFunction + '\n        async function shuffleAndStart() {');

fs.writeFileSync('index.html', html);
console.log('Added SRS logic');
