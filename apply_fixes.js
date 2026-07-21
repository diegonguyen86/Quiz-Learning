const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

// 1. Replace rounded-full on buttons to rounded-lg
html = html.replace(/rounded-full/g, function(match, offset, str) {
    // Check if it's an avatar or icon container or progress bar
    const context = str.substring(offset - 40, offset + 40);
    if (context.includes('w-8 h-8') || context.includes('w-20 h-20') || context.includes('w-24 h-24') || context.includes('w-32 h-32') || context.includes('logo.png') || context.includes('progress-bar') || context.includes('rounded-full h-') || context.includes('retry-badge') || context.includes('student-badge') || context.includes('bg-green-200')) {
        return 'rounded-full'; // keep it full for structural UI elements
    }
    return 'rounded-lg';
});

// 2. Change global colors to academic style
// Replace indigo-600 with blue-700
html = html.replace(/bg-indigo-600/g, 'bg-blue-700');
html = html.replace(/text-indigo-600/g, 'text-blue-700');
html = html.replace(/border-indigo-600/g, 'border-blue-700');
html = html.replace(/hover:bg-indigo-700/g, 'hover:bg-blue-800');
html = html.replace(/text-indigo-500/g, 'text-blue-600');
html = html.replace(/bg-indigo-50/g, 'bg-blue-50');
html = html.replace(/text-indigo-400/g, 'text-blue-500');

// Replace orange-500 with a more academic amber-600
html = html.replace(/text-orange-500/g, 'text-amber-600');
html = html.replace(/bg-orange-500/g, 'bg-amber-600');
html = html.replace(/bg-orange-100/g, 'bg-amber-100');

// 3. Update Quiz Screen Flow
const oldNextPrevBtnChunk = `<div class="mt-6 md:mt-8 flex justify-between gap-4">
                <button id="prev-btn" onclick="handlePrev()" class="hidden w-full md:w-auto justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold py-3 px-6 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center text-base">
                    <i class="fas fa-arrow-left mr-2"></i> Câu trước
                </button>
                <button id="next-btn" onclick="handleNext()" disabled class="w-full md:w-auto justify-center bg-indigo-600 text-white cursor-not-allowed opacity-50 font-bold py-3 px-8 rounded-xl transition flex items-center text-base ml-auto">
                    Kiểm tra <i class="fas fa-check ml-2"></i>
                </button>
            </div>`;

const newNextPrevBtnChunk = `<div class="mt-6 md:mt-8 flex justify-between gap-4">
                <button id="skip-btn" onclick="handleSkip()" class="w-full md:w-auto justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold py-3 px-6 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center text-base">
                    <i class="fas fa-question-circle mr-2"></i> Không biết
                </button>
                <button id="next-btn" onclick="handleNext()" disabled class="w-full md:w-auto justify-center bg-blue-700 text-white cursor-not-allowed opacity-50 font-bold py-3 px-8 rounded-lg transition flex items-center text-base ml-auto">
                    Kiểm tra <i class="fas fa-check ml-2"></i>
                </button>
            </div>`;
html = html.replace(oldNextPrevBtnChunk, newNextPrevBtnChunk);

// 4. Update JS logic
html = html.replace(/function handlePrev\(\) \{.*?\}/, 'function handleSkip() { if(!hasSubmitted) { selectedOptions = []; handleNext(); } }');

html = html.replace(
    `const elPrevBtn = document.getElementById('prev-btn');
            
            if (currentQIndexInQueue > 0 && !isReviewMode) elPrevBtn.classList.remove('hidden'); 
            else elPrevBtn.classList.add('hidden');`,
    `const elSkipBtn = document.getElementById('skip-btn');
            elSkipBtn.classList.remove('hidden');`
);

html = html.replace(
    'hasSubmitted = true;',
    `hasSubmitted = true;
                document.getElementById('skip-btn').classList.add('hidden');`
);

// 5. Academic color adjustments for Quiz Options
// Make selected option slightly darker blue instead of bright indigo
html = html.replace(/\.option-btn\.selected \{ border-color: #6366f1; background-color: #e0e7ff;/g, '.option-btn.selected { border-color: #1d4ed8; background-color: #eff6ff;');

// Make the text style more professional, adjust line-height
html = html.replace('font-family: \\\'Segoe UI\\\', Tahoma, Geneva, Verdana, sans-serif;', 'font-family: \\\'Inter\\\', \\\'Segoe UI\\\', system-ui, sans-serif; line-height: 1.6;');
html = html.replace('<head>', '<head>\\n    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">');

fs.writeFileSync('index.html', html);
console.log('Applied UX flow fixes successfully.');
