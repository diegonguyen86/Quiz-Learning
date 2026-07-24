const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const oldStep1 = `            <div class="mb-6">
                <label class="block text-base font-bold mb-2 text-blue-700 dark:text-blue-500">BƯỚC 1: Dán nội dung bộ đề vào đây</label>
                <textarea id="raw-text-input" class="w-full h-48 md:h-64 p-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:border-indigo-500 outline-none font-mono text-xs md:text-sm" placeholder="Dán nội dung bộ đề vào đây..."></textarea>
            </div>`;

const newStep1 = `            <div class="mb-6">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-2">
                    <label class="block text-base font-bold text-blue-700 dark:text-blue-500">BƯỚC 1: Nội dung bộ đề</label>
                    <input type="file" id="document-upload" accept=".pdf,.docx,image/*" class="hidden" onchange="handleFileUpload(event)">
                    <button onclick="document.getElementById('document-upload').click()" class="bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-bold py-1.5 px-3 rounded-lg transition flex items-center border border-blue-300 shadow-sm">
                        <i class="fas fa-file-upload mr-1.5"></i> Tải file (Word, PDF, Ảnh)
                    </button>
                </div>
                <div id="upload-status" class="hidden mb-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center">
                    <i class="fas fa-spinner fa-spin mr-2"></i> Đang đọc file...
                </div>
                <textarea id="raw-text-input" class="w-full h-48 md:h-64 p-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:border-indigo-500 outline-none font-mono text-xs md:text-sm" placeholder="Dán nội dung bộ đề vào đây, hoặc tải file lên..."></textarea>
            </div>`;

html = html.replace(oldStep1, newStep1);

const oldStep2Btns = `                    <div class="flex gap-2">
                        <button id="btn-ai-explain" onclick="generateAIExplanations()" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-2 rounded-lg transition shadow-sm text-sm" title="Giữ nguyên chữ bên trên để AI giải thích">
                            <i class="fas fa-comment-dots mr-1"></i> Giải text
                        </button>
                        <input type="file" id="ai-image-input" accept="image/*" class="hidden" onchange="handleAIImageUpload(event)">
                        <button id="btn-ai-image" onclick="document.getElementById('ai-image-input').click()" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-2 rounded-lg transition shadow-sm text-sm" title="Tải ảnh chứa đề thi để AI đọc">
                            <i class="fas fa-camera mr-1"></i> Quét Ảnh
                        </button>
                    </div>`;

const newStep2Btns = `                    <div class="flex gap-2">
                        <button id="btn-ai-explain" onclick="generateExplanationsAI()" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-2 rounded-lg transition shadow-sm text-sm" title="Tự động thêm giải thích cho các câu hỏi ở BƯỚC 1">
                            <i class="fas fa-magic mr-1"></i> Tự động tạo Giải Thích bằng AI
                        </button>
                    </div>`;

html = html.replace(oldStep2Btns, newStep2Btns);

fs.writeFileSync('index.html', html);
console.log('Updated import screen UI');
