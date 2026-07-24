const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const movePendingOptionScript = `function movePendingOption(qIndex, oldIndex, newIndex) {
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

        function renderPreviewScreen() {`;

html = html.replace('function renderPreviewScreen() {', movePendingOptionScript);

const oldOptionsLoop = `                let optionsHtml = '';
                q.o.forEach((opt, optIndex) => {
                    const isCorrect = q.a.includes(optIndex);
                    const styleClass = isCorrect ? 'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700';
                    const textClass = isCorrect ? 'text-green-800 font-bold dark:text-green-300' : 'text-gray-700 dark:text-gray-300';
                    
                    optionsHtml += \`
                        <div class="flex items-center p-2 mt-1 rounded border \${styleClass} text-sm transition-colors">
                            <input type="checkbox" onchange="togglePendingAns(\${index}, \${optIndex}, this.checked)" \${isCorrect ? 'checked' : ''} class="w-4 h-4 text-blue-700 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 mr-3 shrink-0 cursor-pointer">
                            <input type="text" oninput="updatePendingOpt(\${index}, \${optIndex}, this.value)" value="\${opt.replace(/"/g, '&quot;')}" class="flex-1 bg-transparent border-none focus:ring-0 outline-none \${textClass} w-full">
                            <button onclick="removePendingOption(\${index}, \${optIndex})" class="ml-2 text-gray-400 hover:text-red-500 transition-colors p-1" title="Xóa đáp án này"><i class="fas fa-times"></i></button>
                        </div>
                    \`;
                });`;

const newOptionsLoop = `                let optionsHtml = \`<div class="sortable-options" data-qindex="\${index}">\`;
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
                optionsHtml += \`</div>\`;`;

html = html.replace(oldOptionsLoop, newOptionsLoop);

const oldEndOfRender = `            setTimeout(() => { container.scrollTop = savedScroll; }, 0);
        }`;

const newEndOfRender = `            
            document.querySelectorAll('.sortable-options').forEach(el => {
                new Sortable(el, {
                    animation: 150,
                    handle: '.fa-grip-vertical',
                    ghostClass: 'opacity-50',
                    onEnd: function (evt) {
                        if (evt.oldIndex !== evt.newIndex) {
                            const qIndex = parseInt(evt.from.dataset.qindex);
                            movePendingOption(qIndex, evt.oldIndex, evt.newIndex);
                        }
                    }
                });
            });

            setTimeout(() => { container.scrollTop = savedScroll; }, 0);
        }`;

html = html.replace(oldEndOfRender, newEndOfRender);

fs.writeFileSync('index.html', html);
console.log('Successfully applied drag and drop to preview screen');
