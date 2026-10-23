/**
 * Dashboard & Quiz Management with Optimistic UI & Local Caching
 */
import { state, setQuizzesCache, getQuizFromCache, removeQuizFromCache, updateQuizInCache } from './state.js';
import { db, generateShareCode, saveSessionStateToFirebase } from './firebase-config.js';
import { showToast, showConfirm, showScreen, renderDashboardSkeleton, showTopSyncIndicator } from './ui.js';

export async function goToDashboard(force = false) {
    const quizScreen = document.getElementById('quiz-screen');
    const resultScreen = document.getElementById('result-screen');
    
    if (!force && ((quizScreen && !quizScreen.classList.contains('hidden')) || (resultScreen && !resultScreen.classList.contains('hidden')))) {
        showConfirm('Thoát bài học', 'Tiến trình hiện tại của bạn sẽ được lưu lại. Bạn có chắc chắn muốn thoát?', () => {
            saveSessionStateToFirebase();
            goToDashboard(true);
        });
        return;
    }

    if (force) {
        saveSessionStateToFirebase();
    }

    state.activeQuizId = null;
    state.editQuizId = null;
    state.isStudentMode = false;
    state.studentClassRef = null;
    state.globalSessionState = null;

    showScreen('dashboard-screen');

    // If cache is available and not forced, render immediately from cache (0ms delay)
    if (state.quizzesCache.length > 0 && !force) {
        renderQuizList();
        // Background silent re-sync
        syncQuizzesFromFirebase(false);
    } else {
        // Show lightweight skeletons inside the dashboard container, NOT a full screen blocker!
        renderDashboardSkeleton();
        await syncQuizzesFromFirebase(true);
    }
}

export async function syncQuizzesFromFirebase(showSkeleton = false) {
    if (!state.currentUser) return;
    
    showTopSyncIndicator(true);
    try {
        const snapshot = await db.collection("users").doc(state.currentUser.uid).collection("my_quizzes").orderBy("createdAt", "desc").get();
        const quizzes = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            quizzes.push({
                id: doc.id,
                ...data,
                ref: doc.ref
            });
            // Auto-heal missing shareCode in background
            if (!data.shareCode) {
                const newCode = generateShareCode();
                doc.ref.update({ shareCode: newCode }).catch(console.error);
            }
        });

        setQuizzesCache(quizzes);
        renderQuizList();
    } catch (error) {
        console.error("Error fetching quizzes:", error);
        showToast("Lỗi nạp kho đề: " + (error.message || "Không xác định"), 'error');
    } finally {
        showTopSyncIndicator(false);
    }
}

export function renderQuizList(filterText = '') {
    const container = document.getElementById('quiz-list-container');
    if (!container) return;

    const query = (filterText || state.searchFilter || '').trim().toLowerCase();
    let quizzes = state.quizzesCache;

    if (query) {
        quizzes = quizzes.filter(q => (q.title || '').toLowerCase().includes(query) || (q.shareCode || '').toLowerCase().includes(query));
    }

    // Update counter badge if available
    const countBadge = document.getElementById('quiz-total-badge');
    if (countBadge) {
        countBadge.innerText = `${state.quizzesCache.length} bộ đề`;
    }

    if (quizzes.length === 0) {
        if (query) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                    <i class="fas fa-search text-4xl text-gray-300 dark:text-gray-600 mb-3"></i>
                    <p class="text-gray-500 dark:text-gray-400 font-medium text-sm">Không tìm thấy bộ đề nào khớp với "${query}"</p>
                    <button onclick="window.clearDashboardSearch()" class="mt-3 text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Xóa bộ lọc</button>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="col-span-full text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 shadow-sm">
                    <div class="w-16 h-16 mx-auto mb-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-2xl flex items-center justify-center text-3xl">
                        <i class="fas fa-folder-open"></i>
                    </div>
                    <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-1">Bạn chưa có bộ đề nào</h3>
                    <p class="text-gray-400 text-sm max-w-sm mx-auto mb-6">Hãy tạo bộ đề mới bằng cách dán văn bản, tải file PDF/Word, hoặc tham gia lớp học.</p>
                    <button onclick="window.openImportScreen()" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl transition shadow-md inline-flex items-center text-sm">
                        <i class="fas fa-plus mr-2"></i> Tạo Đề Đầu Tiên
                    </button>
                </div>
            `;
        }
        return;
    }

    let html = '';
    quizzes.forEach(data => {
        const sCode = data.shareCode || "Chưa có";
        
        if (data.isClassroom) {
            const pct = Math.min(100, Math.round(((data.progress || 0) / (data.totalSections || 1)) * 100)) || 0;
            html += `
                <div id="quiz-card-${data.id}" class="quiz-card bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-950/20 dark:to-gray-800 rounded-2xl shadow-sm border border-blue-100 dark:border-blue-900/50 p-5 flex flex-col justify-between relative overflow-hidden group">
                    <div class="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                    <div class="pl-2">
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="font-bold text-base md:text-lg text-blue-900 dark:text-blue-200 truncate pr-2" title="${data.title}">
                                ${data.title}
                            </h3>
                            <button onclick="window.deleteQuiz('${data.id}', '${data.title.replace(/'/g, "\\'")}')" class="text-gray-400 hover:text-rose-500 p-1 transition" title="Rời lớp">
                                <i class="fas fa-sign-out-alt"></i>
                            </button>
                        </div>
                        <div class="flex items-center gap-1.5 mb-4">
                            <span class="text-[11px] font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                                <i class="fas fa-chalkboard-teacher mr-1"></i> LỚP HỌC (GV Giám sát)
                            </span>
                        </div>
                        <div class="w-full bg-blue-100 dark:bg-blue-950/60 rounded-full h-2 mb-1.5 overflow-hidden">
                            <div class="bg-blue-600 h-2 rounded-full transition-all duration-500" style="width: ${pct}%"></div>
                        </div>
                        <p class="text-right text-xs text-blue-600 dark:text-blue-400 font-bold mb-5">Đã học: ${pct}%</p>
                    </div>
                    <div class="pl-2">
                        <button onclick="window.showLearnOptions('${data.id}', '${data.learnMode || ''}')" class="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-sm font-bold py-2.5 rounded-xl transition shadow-sm flex items-center justify-center gap-2">
                            <i class="fas fa-play text-xs"></i> ${pct > 0 ? 'Tiếp tục học' : 'Vào Lớp Học'}
                        </button>
                    </div>
                </div>
            `;
        } else {
            const totalQuestions = data.questions ? data.questions.length : 0;
            const totalSec = Math.ceil(totalQuestions / state.SEC_SIZE);
            const progressPct = totalSec > 0 ? Math.min(100, Math.round(((data.progress || 0) / totalSec) * 100)) : 0;
            
            html += `
                <div id="quiz-card-${data.id}" class="quiz-card bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex flex-col justify-between relative overflow-hidden group">
                    <div class="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                    <div class="pl-2">
                        <div class="flex justify-between items-start mb-2">
                            <div class="flex-1 min-w-0 pr-2">
                                <h3 class="font-bold text-base md:text-lg text-gray-900 dark:text-white truncate" title="${data.title}">
                                    ${data.title}
                                </h3>
                                <p class="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                                    ${totalQuestions} câu hỏi &bull; ${totalSec} sections
                                </p>
                            </div>
                            <button onclick="window.resetQuiz('${data.id}', '${data.title.replace(/'/g, "\\'")}')" class="text-gray-400 hover:text-amber-500 p-1 transition" title="Làm lại từ đầu">
                                <i class="fas fa-sync-alt text-xs"></i>
                            </button>
                        </div>
                        
                        <div class="flex items-center gap-1.5 mb-4">
                            <span class="text-[11px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold px-2.5 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900/60">
                                Mã: <b class="font-mono text-xs">${sCode}</b>
                            </span>
                            <button onclick="window.copyShareCode('${sCode}')" class="text-gray-500 hover:text-indigo-600 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 px-2 py-0.5 rounded transition" title="Sao chép mã">
                                <i class="fas fa-copy"></i>
                            </button>
                            <button onclick="window.refreshShareCode('${data.id}')" class="text-gray-500 hover:text-amber-600 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 px-2 py-0.5 rounded transition" title="Đổi mã bảo mật">
                                <i class="fas fa-random"></i>
                            </button>
                        </div>
                        
                        <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-1.5 overflow-hidden">
                            <div id="quiz-progress-bar-${data.id}" class="bg-indigo-600 h-2 rounded-full transition-all duration-500" style="width: ${progressPct}%"></div>
                        </div>
                        <p id="quiz-progress-text-${data.id}" class="text-right text-xs text-gray-400 dark:text-gray-400 font-semibold mb-5">
                            Tiến độ: ${progressPct}%
                        </p>
                    </div>
                    
                    <div class="flex items-center gap-2 pl-2 pt-2 border-t border-gray-100 dark:border-gray-700/60">
                        <button onclick="window.showLearnOptions('${data.id}', '${data.learnMode || ''}')" class="flex-1 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-xs font-bold py-2.5 px-3 rounded-xl transition shadow-sm flex items-center justify-center gap-1.5">
                            <i class="fas fa-play text-[10px]"></i> Học
                        </button>
                        <button onclick="window.viewStudentProgress('${data.id}')" class="flex-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold py-2.5 px-2 rounded-xl transition flex items-center justify-center gap-1.5" title="Tiến độ học sinh">
                            <i class="fas fa-users text-[11px]"></i> Lớp
                        </button>
                        <button onclick="window.openAnalytics('${data.id}')" class="text-gray-500 hover:text-indigo-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 p-2.5 rounded-xl transition" title="Thống kê">
                            <i class="fas fa-chart-line text-xs"></i>
                        </button>
                        <button onclick="window.editQuiz('${data.id}')" class="text-gray-500 hover:text-indigo-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 p-2.5 rounded-xl transition" title="Sửa đề">
                            <i class="fas fa-pen text-xs"></i>
                        </button>
                        <button onclick="window.deleteQuiz('${data.id}', '${data.title.replace(/'/g, "\\'")}')" class="text-gray-400 hover:text-rose-500 bg-gray-50 hover:bg-rose-50 dark:bg-gray-800 dark:hover:bg-rose-950/40 p-2.5 rounded-xl transition" title="Xóa đề">
                            <i class="fas fa-trash-alt text-xs"></i>
                        </button>
                    </div>
                </div>
            `;
        }
    });

    container.innerHTML = html;
}

/**
 * OPTIMISTIC DELETE: Instant UI removal with smooth animation!
 * Zero waiting, zero full-page reloading!
 */
export async function deleteQuiz(quizId, quizTitle) {
    const isStudent = state.isStudentMode;
    const msg = isStudent 
        ? `Bạn muốn rời khỏi lớp học <b>"${quizTitle}"</b>?` 
        : `Bạn có chắc muốn xóa vĩnh viễn bộ đề <b>"${quizTitle}"</b>?<br><span class="text-rose-500 text-xs">Lưu ý: Thao tác này sẽ xóa toàn bộ câu hỏi và tiến trình học!</span>`;

    showConfirm("Xác nhận xóa", msg, async () => {
        // 1. Instant Optimistic UI: Find card and animate out immediately!
        const cardEl = document.getElementById(`quiz-card-${quizId}`);
        const deletedQuizSnapshot = getQuizFromCache(quizId);

        if (cardEl) {
            cardEl.classList.add('card-deleting');
            // Remove from DOM after CSS transition completes
            setTimeout(() => {
                if (cardEl && cardEl.parentNode) cardEl.remove();
            }, 320);
        }

        // 2. Remove immediately from local state cache
        removeQuizFromCache(quizId);
        showToast(`Đã xóa bộ đề "${quizTitle}"`, 'info');

        // Check if library is now empty
        if (state.quizzesCache.length === 0) {
            renderQuizList();
        }

        // 3. Fire delete to Firestore in background
        try {
            await db.collection("users").doc(state.currentUser.uid).collection("my_quizzes").doc(quizId).delete();
        } catch (error) {
            console.error("Firestore delete error:", error);
            showToast("Lỗi khi xóa trên máy chủ: " + error.message, 'error');
            // Rollback optimistic update if failed
            if (deletedQuizSnapshot) {
                state.quizzesCache.unshift(deletedQuizSnapshot);
                renderQuizList();
            }
        }
    }, 'Xác nhận xóa', true);
}

/**
 * OPTIMISTIC RESET: Instantly update progress bar
 */
export async function resetQuiz(quizId, quizTitle) {
    showConfirm("Reset tiến độ", `Bạn muốn reset tiến độ của bộ đề <b>"${quizTitle}"</b> về 0% để học lại từ đầu?`, async () => {
        // Optimistic UI update
        const bar = document.getElementById(`quiz-progress-bar-${quizId}`);
        const text = document.getElementById(`quiz-progress-text-${quizId}`);
        if (bar) bar.style.width = '0%';
        if (text) text.innerText = 'Tiến độ: 0%';

        updateQuizInCache(quizId, { progress: 0 });
        showToast(`Đã reset tiến độ bộ đề "${quizTitle}"`, 'success');

        try {
            await db.collection("users").doc(state.currentUser.uid).collection("my_quizzes").doc(quizId).update({
                progress: 0,
                sessionState: firebase.firestore.FieldValue.delete(),
                learnMode: firebase.firestore.FieldValue.delete()
            });
        } catch (e) {
            console.error("Error resetting quiz:", e);
            showToast("Lỗi cập nhật Firestore!", 'error');
        }
    });
}

/**
 * OPTIMISTIC SHARE CODE REFRESH
 */
export async function refreshShareCode(quizId) {
    showConfirm("Đổi mã bảo mật mới?", "Những người đang giữ mã cũ sẽ KHÔNG THỂ copy hay vào lớp học được nữa.", async () => {
        const newCode = generateShareCode();
        updateQuizInCache(quizId, { shareCode: newCode });
        renderQuizList();
        showToast("Đã đổi sang mã mới: " + newCode, 'success');

        try {
            await db.collection("users").doc(state.currentUser.uid).collection("my_quizzes").doc(quizId).update({
                shareCode: newCode
            });
        } catch (e) {
            console.error(e);
            showToast("Lỗi cập nhật mã lên máy chủ!", 'error');
        }
    });
}

export function copyShareCode(code) {
    if (!code || code === "Chưa có") return;
    navigator.clipboard.writeText(code).then(() => {
        showToast(`Đã sao chép mã: ${code}`, 'success');
    }).catch(() => {
        showToast(`Mã bộ đề: ${code}`, 'info');
    });
}

export async function importCopyQuiz() {
    const code = prompt("LẤY ĐỀ:\nVui lòng dán Mã Share của bộ đề vào đây:");
    if (!code || !code.trim()) return;

    showTopSyncIndicator(true);
    try {
        const qSnapshot = await db.collectionGroup("my_quizzes").where("shareCode", "==", code.trim()).get();
        if (qSnapshot.empty) {
            showToast("Không tìm thấy bộ đề! Mã đã hết hạn hoặc không tồn tại.", 'error');
            return;
        }

        const data = qSnapshot.docs[0].data();
        const newQuiz = {
            title: data.title + " (Bản sao)",
            questions: data.questions || [],
            progress: 0,
            shareCode: generateShareCode(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection("users").doc(state.currentUser.uid).collection("my_quizzes").add(newQuiz);
        showToast("Đã sao chép bộ đề thành công vào Kho cá nhân!", 'success');
        
        // Optimistically add to cache and render
        newQuiz.id = docRef.id;
        state.quizzesCache.unshift(newQuiz);
        renderQuizList();
    } catch (e) {
        console.error(e);
        showToast("Lỗi sao chép đề: " + e.message, 'error');
    } finally {
        showTopSyncIndicator(false);
    }
}

export async function joinClassroom() {
    const code = prompt("HỌC SINH:\nVui lòng dán Mã Lớp Học do giáo viên cấp:");
    if (!code || !code.trim()) return;

    showTopSyncIndicator(true);
    try {
        const qSnapshot = await db.collectionGroup("my_quizzes").where("shareCode", "==", code.trim()).get();
        if (qSnapshot.empty) {
            showToast("Mã lớp học không tồn tại hoặc đã bị đổi!", 'error');
            return;
        }

        const teacherDoc = qSnapshot.docs[0];
        const teacherData = teacherDoc.data();
        const totalSec = Math.ceil((teacherData.questions || []).length / state.SEC_SIZE);

        const studentRef = teacherDoc.ref.collection("students").doc(state.currentUser.uid);
        let savedProgress = 0;

        try {
            const studentDoc = await studentRef.get();
            if (studentDoc.exists) savedProgress = studentDoc.data().progress || 0;
            await studentRef.set({
                name: state.currentUser.displayName || "Học sinh",
                email: state.currentUser.email || "",
                progress: savedProgress,
                totalSections: totalSec,
                lastActive: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (e) {
            showToast("Lỗi quyền truy cập! Giáo viên cần mở Security Rules trên Firebase.", 'error');
            return;
        }

        const localCheck = await db.collection("users").doc(state.currentUser.uid).collection("my_quizzes").where("refPath", "==", teacherDoc.ref.path).get();
        if (localCheck.empty) {
            const newClassQuiz = {
                title: teacherData.title,
                isClassroom: true,
                refPath: teacherDoc.ref.path,
                progress: savedProgress,
                totalSections: totalSec,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            const added = await db.collection("users").doc(state.currentUser.uid).collection("my_quizzes").add(newClassQuiz);
            newClassQuiz.id = added.id;
            state.quizzesCache.unshift(newClassQuiz);
        } else {
            await localCheck.docs[0].ref.update({ progress: savedProgress });
            updateQuizInCache(localCheck.docs[0].id, { progress: savedProgress });
        }

        showToast("Đã tham gia lớp học thành công!", 'success');
        renderQuizList();
    } catch (e) {
        console.error(e);
        showToast("Lỗi kết nối lớp học: " + e.message, 'error');
    } finally {
        showTopSyncIndicator(false);
    }
}

export function showLearnOptions(quizId, savedMode = '') {
    state.currentLearnQuizId = quizId;
    if (savedMode) {
        window.openQuiz(quizId, savedMode);
    } else {
        const modal = document.getElementById('learn-options-modal');
        if (modal) modal.classList.remove('hidden');
    }
}

export function closeLearnOptions() {
    const modal = document.getElementById('learn-options-modal');
    if (modal) modal.classList.add('hidden');
    state.currentLearnQuizId = null;
}

export async function selectLearnMode(mode) {
    const quizId = state.currentLearnQuizId;
    closeLearnOptions();
    if (quizId) {
        if (state.currentUser) {
            db.collection("users").doc(state.currentUser.uid).collection("my_quizzes").doc(quizId).update({ learnMode: mode }).catch(console.error);
        }
        window.openQuiz(quizId, mode);
    }
}
