/**
 * UI Utilities, Notifications, Modals & Screen Management
 */
import { state } from './state.js';

export const screens = [
    'auth-screen',
    'dashboard-screen',
    'import-screen',
    'preview-screen',
    'welcome-screen',
    'quiz-screen',
    'result-screen',
    'finish-screen'
];

export function showTopSyncIndicator(show = true) {
    const el = document.getElementById('top-sync-indicator');
    if (el) el.style.display = show ? 'block' : 'none';
}

export function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');

    let bgColor = 'bg-blue-600 border-blue-500';
    let icon = 'fa-info-circle';
    if (type === 'success') {
        bgColor = 'bg-emerald-600 border-emerald-500';
        icon = 'fa-check-circle';
    } else if (type === 'error') {
        bgColor = 'bg-rose-600 border-rose-500';
        icon = 'fa-exclamation-circle';
    } else if (type === 'warning') {
        bgColor = 'bg-amber-600 border-amber-500';
        icon = 'fa-exclamation-triangle';
    }

    toast.className = `toast-item flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-semibold border ${bgColor} backdrop-blur-md`;
    toast.innerHTML = `<i class="fas ${icon} text-lg shrink-0"></i><span class="leading-snug">${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px) scale(0.95)';
        setTimeout(() => toast.remove(), 250);
    }, 3200);
}

export function showConfirm(title, message, onConfirm, okText = 'Đồng ý', isDanger = false) {
    const modal = document.getElementById('custom-confirm-modal');
    if (!modal) return;

    document.getElementById('confirm-title').innerText = title;
    document.getElementById('confirm-msg').innerHTML = message;

    const okBtn = document.getElementById('confirm-ok-btn');
    const cancelBtn = document.getElementById('confirm-cancel-btn');

    okBtn.innerText = okText;
    if (isDanger) {
        okBtn.className = 'px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold transition shadow-sm';
    } else {
        okBtn.className = 'px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition shadow-sm';
    }

    const newOkBtn = okBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    newCancelBtn.onclick = () => modal.classList.add('hidden');
    newOkBtn.onclick = () => {
        modal.classList.add('hidden');
        if (onConfirm) onConfirm();
    };

    modal.classList.remove('hidden');
}

export function showPrompt(title, message, placeholder, onConfirm) {
    const modal = document.getElementById('custom-prompt-modal');
    if (!modal) return;

    document.getElementById('prompt-title').innerText = title;
    document.getElementById('prompt-msg').innerHTML = message;

    const inputEl = document.getElementById('prompt-input');
    inputEl.placeholder = placeholder || '';
    inputEl.value = '';

    const pasteBtn = document.getElementById('prompt-paste-btn');
    pasteBtn.onclick = async () => {
        try {
            const text = await navigator.clipboard.readText();
            inputEl.value = text;
            inputEl.focus();
        } catch (err) {
            showToast('Không thể dán tự động. Vui lòng dán thủ công!', 'error');
        }
    };

    const okBtn = document.getElementById('prompt-ok-btn');
    const cancelBtn = document.getElementById('prompt-cancel-btn');

    const newOkBtn = okBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    newCancelBtn.onclick = () => modal.classList.add('hidden');

    const submitVal = () => {
        const val = document.getElementById('prompt-input').value.trim();
        if (!val) {
            showToast('Vui lòng không để trống!', 'warning');
            return;
        }
        modal.classList.add('hidden');
        if (onConfirm) onConfirm(val);
    };

    newOkBtn.onclick = submitVal;
    inputEl.onkeyup = (e) => {
        if (e.key === 'Enter') submitVal();
    };

    modal.classList.remove('hidden');
    setTimeout(() => inputEl.focus(), 80);
}

export function showScreen(screenId, pushState = true) {
    screens.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    const target = document.getElementById(screenId);
    if (target) {
        target.classList.remove('hidden');
    }

    if (pushState && window.history) {
        window.history.pushState({ screen: screenId }, '', '#' + screenId);
    }

    const isPlaying = ['quiz-screen', 'welcome-screen', 'result-screen', 'finish-screen'].includes(screenId);
    const headerProgress = document.getElementById('header-progress');
    if (headerProgress) {
        headerProgress.style.display = isPlaying ? 'block' : 'none';
    }

    const dBtn = document.getElementById('desktop-back-btn');
    const mBtn = document.getElementById('mobile-back-btn');
    if (dBtn && mBtn) {
        if (isPlaying) {
            dBtn.classList.remove('hidden');
            mBtn.classList.remove('hidden');
            mBtn.classList.add('inline-flex');
        } else {
            dBtn.classList.add('hidden');
            mBtn.classList.add('hidden');
            mBtn.classList.remove('inline-flex');
        }
    }
}

export function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

export function initTheme() {
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

export function renderDashboardSkeleton() {
    const container = document.getElementById('quiz-list-container');
    if (!container) return;

    let skeletons = '';
    for (let i = 0; i < 6; i++) {
        skeletons += `
            <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex flex-col justify-between shadow-sm animate-pulse">
                <div>
                    <div class="h-5 skeleton-box w-3/4 mb-3 rounded-lg"></div>
                    <div class="h-4 skeleton-box w-1/3 mb-4 rounded-md"></div>
                    <div class="h-2 skeleton-box w-full rounded-full mb-2"></div>
                    <div class="h-3 skeleton-box w-1/4 ml-auto mb-6 rounded"></div>
                </div>
                <div class="flex gap-2">
                    <div class="h-9 skeleton-box flex-1 rounded-xl"></div>
                    <div class="h-9 skeleton-box flex-1 rounded-xl"></div>
                    <div class="h-9 skeleton-box w-10 rounded-xl"></div>
                </div>
            </div>
        `;
    }
    container.innerHTML = skeletons;
}
