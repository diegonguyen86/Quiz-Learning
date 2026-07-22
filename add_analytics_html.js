const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

// 1. Add Chart.js to <head>
html = html.replace('</head>', '    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>\n</head>');

// 2. Add Analytics Modal HTML
const analyticsModalHtml = `
    <div id="analytics-modal" class="fixed inset-0 bg-gray-900 bg-opacity-50 z-[100] hidden flex items-center justify-center p-4 fade-in">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl p-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onclick="document.getElementById('analytics-modal').classList.add('hidden')" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">
                <i class="fas fa-times"></i>
            </button>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2"><i class="fas fa-chart-line text-blue-600 mr-2"></i>Thống kê Học tập</h3>
            <p id="analytics-title" class="text-gray-600 dark:text-gray-300 text-sm mb-6">Bộ đề: ...</p>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-blue-50 dark:bg-gray-700 p-4 rounded-lg text-center">
                    <div class="text-2xl font-bold text-blue-600 dark:text-blue-400" id="stat-total">0</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Lượt ôn tập</div>
                </div>
                <div class="bg-green-50 dark:bg-gray-700 p-4 rounded-lg text-center">
                    <div class="text-2xl font-bold text-green-600 dark:text-green-400" id="stat-correct">0%</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Tỉ lệ đúng TB</div>
                </div>
                <div class="bg-amber-50 dark:bg-gray-700 p-4 rounded-lg text-center">
                    <div class="text-2xl font-bold text-amber-600 dark:text-amber-400" id="stat-streak">0</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Chuỗi ngày (Streak)</div>
                </div>
                <div class="bg-purple-50 dark:bg-gray-700 p-4 rounded-lg text-center">
                    <div class="text-2xl font-bold text-purple-600 dark:text-purple-400" id="stat-mastery">0%</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Mức độ Thành thạo</div>
                </div>
            </div>

            <div class="w-full h-72">
                <canvas id="progressChart"></canvas>
            </div>
        </div>
    </div>`;

let scriptStart = html.indexOf('    <script>\n        // Custom UI System');
html = html.substring(0, scriptStart) + analyticsModalHtml + '\n' + html.substring(scriptStart);

fs.writeFileSync('index.html', html);
console.log('Added Chart.js and Analytics Modal.');
