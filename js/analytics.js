/**
 * Analytics and Student Progress Monitoring
 * With on-demand Chart.js loading
 */
import { state } from './state.js';
import { db } from './firebase-config.js';
import { showToast } from './ui.js';
import { loadScript } from './parser.js';

let progressChartInstance = null;

export async function viewStudentProgress(quizId) {
    const modal = document.getElementById('score-modal');
    const tbody = document.getElementById('score-table-body');
    const loading = document.getElementById('score-loading');

    modal?.classList.remove('hidden');
    if (tbody) tbody.innerHTML = '';
    loading?.classList.remove('hidden');

    try {
        const resultsSnap = await db.collection("users").doc(state.currentUser.uid).collection("my_quizzes").doc(quizId).collection("students").orderBy("lastActive", "desc").get();
        loading?.classList.add('hidden');

        if (resultsSnap.empty) {
            tbody.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-gray-400 italic">Chưa có học sinh nào tham gia lớp này.</td></tr>`;
        } else {
            let html = '';
            resultsSnap.forEach(doc => {
                const d = doc.data();
                const timeStr = d.lastActive ? new Date(d.lastActive.toDate()).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : 'Chưa rõ';
                const pct = Math.min(100, Math.round(((d.progress || 0) / (d.totalSections || 1)) * 100)) || 0;
                let color = "text-indigo-600 dark:text-indigo-400";
                if (pct === 100) color = "text-emerald-600 dark:text-emerald-400";
                if (pct === 0) color = "text-gray-400";

                html += `
                    <tr class="hover:bg-gray-50/70 dark:hover:bg-gray-700/50 transition">
                        <td class="p-3 font-semibold text-gray-900 dark:text-gray-100">${d.name} <br><span class="text-[11px] text-gray-400 font-normal">${d.email || ''}</span></td>
                        <td class="p-3 text-center font-bold ${color}">${d.progress || 0} / ${d.totalSections || 1}</td>
                        <td class="p-3 text-center text-sm text-gray-500">
                            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1 overflow-hidden">
                                <div class="bg-indigo-600 h-1.5 rounded-full" style="width: ${pct}%"></div>
                            </div>
                            <span class="text-[11px] font-bold text-gray-600 dark:text-gray-300">${pct}%</span>
                        </td>
                        <td class="p-3 text-right text-xs text-gray-400">${timeStr}</td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        }
    } catch (e) {
        showToast("Lỗi tải bảng tiến độ: " + e.message, 'error');
        closeScoreModal();
    }
}

export function closeScoreModal() {
    const modal = document.getElementById('score-modal');
    modal?.classList.add('hidden');
}

export async function openAnalytics(quizId) {
    try {
        let data = state.quizzesCache.find(q => q.id === quizId);
        if (!data) {
            const doc = await db.collection("users").doc(state.currentUser.uid).collection("my_quizzes").doc(quizId).get();
            data = doc.data();
        }
        if (!data) return;

        document.getElementById('analytics-title').innerText = "Bộ đề: " + data.title;

        const history = data.history || [];
        const totalSessions = history.length;
        let avgScore = 0;
        let streak = 0;

        if (totalSessions > 0) {
            const totalCorrect = history.reduce((sum, h) => sum + (h.correct || 0), 0);
            const totalQs = history.reduce((sum, h) => sum + ((h.correct || 0) + (h.wrong || 0)), 0);
            avgScore = totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : 0;
            streak = 1;
        }

        document.getElementById('stat-total').innerText = totalSessions;
        document.getElementById('stat-correct').innerText = avgScore + '%';
        document.getElementById('stat-streak').innerText = streak;

        const questions = data.questions || [];
        const masteredCount = questions.filter(q => q.ease && q.ease >= 2.5).length;
        const masteryPct = questions.length > 0 ? Math.round((masteredCount / questions.length) * 100) : 0;
        document.getElementById('stat-mastery').innerText = masteryPct + '%';

        document.getElementById('analytics-modal')?.classList.remove('hidden');

        // Dynamically load Chart.js if not already present
        if (!window.Chart) {
            await loadScript('https://cdn.jsdelivr.net/npm/chart.js');
        }

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

        progressChartInstance = new window.Chart(ctx, {
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
