const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const srsBlock = '<button id="btn-srs" onclick="startSRS()" class="hidden md:block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl border-2 border-indigo-600 hover:border-indigo-700 shadow-sm transition" title="Chỉ ôn tập các câu đến hạn">\n                <i class="fas fa-brain mr-1"></i> Ôn tập Thông minh (SRS)\n            </button>';

if (html.includes(srsBlock)) {
    const newBtn = srsBlock + '\n            <button id="btn-pdf" onclick="exportPDF()" class="hidden md:block bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 font-bold py-2 px-4 rounded-xl border-2 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900 shadow-sm transition" title="Xuất bộ đề ra PDF kèm đáp án">\n                <i class="fas fa-file-pdf mr-1"></i> Xuất PDF\n            </button>';
    html = html.replace(srsBlock, newBtn);
    
    // Also add exportPDF function
    const logic = `
        function exportPDF() {
            let printWindow = window.open('', '_blank');
            printWindow.document.write('<html><head><title>Bộ đề: ' + (activeQuizTitle || 'Ôn tập') + '</title>');
            printWindow.document.write('<style>body { font-family: Arial, sans-serif; padding: 30px; line-height: 1.6; } .question { margin-bottom: 25px; break-inside: avoid; } .option { margin-left: 20px; } .correct { font-weight: bold; color: #16a34a; } .explanation { color: #4b5563; font-size: 0.9em; margin-top: 8px; padding-left: 20px; border-left: 3px solid #e5e7eb; }</style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write('<h2 style="text-align: center; margin-bottom: 30px;">' + (activeQuizTitle || 'BỘ ĐỀ ÔN TẬP') + '</h2><hr style="margin-bottom: 30px;"/>');
            
            ALL_QUESTIONS.forEach((q, i) => {
                printWindow.document.write('<div class="question">');
                printWindow.document.write('<p><b>Câu ' + (i+1) + ':</b> ' + q.q.replace(/\\n/g, '<br/>') + '</p>');
                q.opts.forEach((opt, optIdx) => {
                    const isCorrect = q.a.includes(optIdx);
                    const optLetter = String.fromCharCode(65 + optIdx);
                    printWindow.document.write('<div class="option ' + (isCorrect ? 'correct' : '') + '">' + optLetter + '. ' + opt + '</div>');
                });
                if (q.ex) {
                    printWindow.document.write('<div class="explanation"><b>Giải thích:</b> ' + q.ex.replace(/\\n/g, '<br/>') + '</div>');
                }
                printWindow.document.write('</div>');
            });
            
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
            }, 500);
        }
    `;
    html = html.replace('        async function startSRS()', logic + '\n        async function startSRS()');
    
    // show hide btn-pdf in openQuiz
    html = html.replace("document.getElementById('btn-srs').classList.add('hidden');", "document.getElementById('btn-srs').classList.add('hidden'); document.getElementById('btn-pdf').classList.add('hidden');");
    html = html.replace("document.getElementById('btn-srs').classList.remove('hidden');", "document.getElementById('btn-srs').classList.remove('hidden'); document.getElementById('btn-pdf').classList.remove('hidden');");

    fs.writeFileSync('index.html', html);
    console.log('Added PDF export');
} else {
    console.log('SRS button block not found!');
}
