const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const cdn = '<script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script>';
if (!html.includes('Sortable.min.js')) {
    html = html.replace('</head>', cdn + '\n</head>');
}

const startStr = 'function renderPreviewScreen() {';
const endStr = 'document.getElementById(\\'preview-screen\\').classList.remove(\\'hidden\\');\n        }';
const startIdx = html.indexOf(startStr);
const endIdx = html.indexOf(endStr, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const newCode = `function movePendingOption(qIndex, oldIndex, newIndex) {
            const question = pendingParsedQuestions[qIndex];
            
            // Generate a boolean array representing correctness before moving
            const correctStates = question.o.map((_, i) => question.a.includes(i));
            
            // Move option text
            const opt = question.o.splice(oldIndex, 1)[0];
            question.o.splice(newIndex, 0, opt);
            
            // Move correctness state
            const state = correctStates.splice(oldIndex, 1)[0];
            correctStates.splice(newIndex, 0, state);
            
            // Rebuild correct answer array
            question.a = correctStates.map((isCorrect, i) => isCorrect ? i : -1).filter(i => i !== -1);
            
            renderPreviewScreen();
        }

        function renderPreviewScreen() {
            document.getElementById('preview-title').innerHTML = \`<i class="fas fa-eye mr-2"></i>Kiểm tra lại: \${pendingQuizTitle}\`;
            document.getElementById('preview-count').innerText = \`\${pendingParsedQuestions.length} câu hỏi\`;
            
            const container = document.getElementById('preview-container');
            const savedScroll = container.scrollTop;
            let html = '';
            
            pendingParsedQuestions.forEach((q, index) => {
                let optionsHtml = \`<div class="sortable-options" data-qindex="\${index}">\`;
                q.o.forEach((opt, optIndex) => {
                    const isCorrect = q.a.includes(optIndex);
                    const styleClass = isCorrect ? 'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700';
                    const textClass = isCorrect ? 'text-green-800 font-bold dark:text-green-300' : 'text-gray-700 dark:text-gray-300';
                    
                    optionsHtml += \`
                        <div class="flex items-center p-2 mt-1 rounded border \${styleClass} text-sm transition-colors group">
                            <i class="fas fa-grip-vertical text-gray-400 hover:text-gray-600 cursor-grab mr-2 px-1"></i>
                            <input type="checkbox" onchange="togglePendingAns(\${index}, \${optIndex}, this.checked)" \${isCorrect ? 'checked' : ''} class="w-4 h-4 text-blue-700 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 mr-3 shrink-0 cursor-pointer">
                            <input type="text" oninput="updatePendingOpt(\${index}, \${optIndex}, this.value)" value="\${opt.replace(/"/g, '&quot;')}" class="flex-1 bg-transparent border-none focus:ring-0 outline-none \${textClass} w-full">
                            <button onclick="removePendingOption(\${index}, \${optIndex})" class="ml-2 text-gray-400 hover:text-red-500 transition-colors p-1" title="Xóa đáp án này"><i class="fas fa-times"></i></button>
                        </div>
                    \`;
                });
                optionsHtml += \`</div>\`;
                
                optionsHtml += \`
                    <div class="mt-2 text-right">
                        <button onclick="addPendingOption(\${index})" class="text-xs px-2 py-1 bg-blue-50 text-blue-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-blue-500 dark:hover:bg-indigo-900/50 rounded transition-colors inline-flex items-center">
                            <i class="fas fa-plus mr-1"></i> Thêm đáp án
                        </button>
                    </div>
                \`;

                // Add validation class if missing answer
                const hasAnswer = q.a.length > 0;
                const cardClass = hasAnswer ? 'border-gray-200 dark:border-gray-700' : 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/20';

                html += \`
                    <div class="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-sm border \${cardClass} mb-4">
                        <div class="flex justify-between items-start mb-3 gap-2">
                            <div class="flex-1">
                                <span class="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300 mb-2">Câu \${index + 1}</span>
                                \${!hasAnswer ? \`<span class="inline-block bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300 mb-2 ml-2"><i class="fas fa-exclamation-circle mr-1"></i>Chưa chọn đáp án đúng</span>\` : ''}
                                <textarea oninput="updatePendingQuestion(\${index}, this.value)" class="w-full bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-blue-500 outline-none resize-none font-semibold text-gray-800 dark:text-gray-100">\${q.q}</textarea>
                            </div>
                            <button onclick="removePendingQuestion(\${index})" class="text-gray-400 hover:text-red-500 transition px-2"><i class="fas fa-trash-alt"></i></button>
                        </div>
                        
                        \${q.img ? \`<div class="mb-3"><img src="\${q.img}" class="max-h-48 rounded-lg object-contain border border-gray-200 dark:border-gray-700"></div>\` : ''}
                        
                        <div class="space-y-1">
                            \${optionsHtml}
                        </div>
                        
                        <div class="mt-4">
                            <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1"><i class="fas fa-lightbulb text-yellow-500 mr-1"></i>Giải thích (Tùy chọn)</label>
                            <textarea oninput="updatePendingExp(\${index}, this.value)" class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm focus:border-blue-500 outline-none" rows="2" placeholder="Thêm giải thích cho câu hỏi này...">\${q.exp || ''}</textarea>
                        </div>
                    </div>
                \`;
            });

            container.innerHTML = html;
            
            // Initialize SortableJS
            document.querySelectorAll('.sortable-options').forEach(el => {
                new Sortable(el, {
                    animation: 150,
                    handle: '.fa-grip-vertical',
                    ghostClass: 'opacity-50',
                    onEnd: function (evt) {
                        const qIndex = parseInt(evt.from.dataset.qindex);
                        movePendingOption(qIndex, evt.oldIndex, evt.newIndex);
                    }
                });
            });

            container.scrollTop = savedScroll;
            document.getElementById('import-screen').classList.add('hidden');
            document.getElementById('preview-screen').classList.remove('hidden');
        }`;

    const finalHtml = html.substring(0, startIdx) + newCode + html.substring(endIdx + endStr.length);
    fs.writeFileSync('index.html', finalHtml);
    console.log('Successfully updated preview screen with Drag and Drop');
} else {
    console.log('Could not find start or end index for renderPreviewScreen');
}
