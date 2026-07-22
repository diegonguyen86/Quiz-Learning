const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const oldBtns = `                                    <div class="flex justify-between items-center gap-1 pl-2">
                                        <button onclick="openQuiz('\${doc.id}')" class="flex-1 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold py-2.5 px-2 rounded-xl transition shadow-sm" title="Học nội bộ">
                                            <i class="fas fa-play mr-1"></i> Học
                                        </button>
                                        <button onclick="openDashboard('\${doc.id}')" class="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs font-bold py-2.5 px-2 rounded-xl transition" title="Tiến độ Học sinh">
                                            <i class="fas fa-users mr-1"></i> Tiến độ
                                        </button>`;

const newBtns = `                                    <div class="flex justify-between items-center gap-1 pl-2">
                                        <button onclick="openQuiz('\${doc.id}')" class="flex-1 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold py-2.5 px-2 rounded-xl transition shadow-sm" title="Học nội bộ">
                                            <i class="fas fa-play mr-1"></i> Học
                                        </button>
                                        <button onclick="openAnalytics('\${doc.id}')" class="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs font-bold py-2.5 px-2 rounded-xl transition" title="Thống kê Học tập cá nhân">
                                            <i class="fas fa-chart-pie mr-1"></i> Tiến độ
                                        </button>
                                        <button onclick="openDashboard('\${doc.id}')" class="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs font-bold py-2.5 px-3 rounded-xl transition" title="Quản lý Lớp học">
                                            <i class="fas fa-users"></i>
                                        </button>`;

html = html.replace(oldBtns, newBtns);

const openAnalyticsCode = `
        let progressChartInstance = null;

        async function openAnalytics(quizId) {
            try {
                const doc = await db.collection("users").doc(currentUser.uid).collection("my_quizzes").doc(quizId).get();
                const data = doc.data();
                if (!data) return;
                
                document.getElementById('analytics-title').innerText = "Bộ đề: " + data.title;
                
                // Giả lập lịch sử nếu chưa có (Analytics MVP)
                const history = data.history || [];
                
                // Calculate stats
                const totalSessions = history.length;
                let avgScore = 0;
                let streak = 0;
                
                if (totalSessions > 0) {
                    const totalCorrect = history.reduce((sum, h) => sum + (h.correct || 0), 0);
                    const totalQs = history.reduce((sum, h) => sum + ((h.correct || 0) + (h.wrong || 0)), 0);
                    avgScore = totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : 0;
                    
                    // Simple streak: count consecutive days backwards
                    streak = 1; 
                }

                document.getElementById('stat-total').innerText = totalSessions;
                document.getElementById('stat-correct').innerText = avgScore + '%';
                document.getElementById('stat-streak').innerText = streak;
                
                const questions = data.questions || [];
                const masteredCount = questions.filter(q => q.ease && q.ease >= 2.5).length;
                const masteryPct = questions.length > 0 ? Math.round((masteredCount / questions.length) * 100) : 0;
                document.getElementById('stat-mastery').innerText = masteryPct + '%';

                document.getElementById('analytics-modal').classList.remove('hidden');

                // Draw chart
                const ctx = document.getElementById('progressChart').getContext('2d');
                if (progressChartInstance) {
                    progressChartInstance.destroy();
                }

                const labels = history.map(h => {
                    const d = h.timestamp ? h.timestamp.toDate() : new Date();
                    return d.getDate() + '/' + (d.getMonth() + 1);
                });
                
                const correctData = history.map(h => h.correct || 0);
                const wrongData = history.map(h => h.wrong || 0);

                progressChartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels.length ? labels : ['Chưa có DL'],
                        datasets: [
                            {
                                label: 'Số câu Đúng',
                                data: correctData.length ? correctData : [0],
                                borderColor: '#10B981',
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                tension: 0.3,
                                fill: true
                            },
                            {
                                label: 'Số câu Sai',
                                data: wrongData.length ? wrongData : [0],
                                borderColor: '#EF4444',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                tension: 0.3,
                                fill: true
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom' }
                        },
                        scales: {
                            y: { beginAtZero: true }
                        }
                    }
                });
            } catch (e) {
                console.error(e);
                showToast("Lỗi tải thống kê", "error");
            }
        }
`;

html = html.replace('        async function resetQuiz(quizId, quizTitle)', openAnalyticsCode + '\n        async function resetQuiz(quizId, quizTitle)');

// We also need to SAVE history when user completes a phase
const oldFinishPhase = `            if (isReviewMode) {
                if (mistakes.length === 0) {
                    showToast("Xuất sắc! Bạn đã vượt qua các câu sai.", 'success');
                    isReviewMode = false;
                    startNextSection();
                } else {
                    startRetry();
                }
            } else {
                if (mistakes.length > 0) {
                    startRetry();
                } else {
                    currentSection++;
                    startNextSection();
                }
            }`;

const newFinishPhase = `            
            // Save history
            try {
                if (!isStudentMode && activeQuizId) {
                    const today = new Date();
                    const correctCount = ALL_QUESTIONS.length > 0 ? queue.length - mistakes.length : 0;
                    const wrongCount = mistakes.length;
                    
                    if (correctCount > 0 || wrongCount > 0) {
                        const dbRef = db.collection("users").doc(currentUser.uid).collection("my_quizzes").doc(activeQuizId);
                        dbRef.update({
                            history: firebase.firestore.FieldValue.arrayUnion({
                                timestamp: today,
                                correct: correctCount,
                                wrong: wrongCount
                            })
                        });
                    }
                }
            } catch (e) { console.error("Could not save history", e); }

            if (isReviewMode) {
                if (mistakes.length === 0) {
                    showToast("Xuất sắc! Bạn đã vượt qua các câu sai.", 'success');
                    isReviewMode = false;
                    startNextSection();
                } else {
                    startRetry();
                }
            } else {
                if (mistakes.length > 0) {
                    startRetry();
                } else {
                    currentSection++;
                    startNextSection();
                }
            }`;

html = html.replace(oldFinishPhase, newFinishPhase);

fs.writeFileSync('index.html', html);
console.log('Added analytics logic');
