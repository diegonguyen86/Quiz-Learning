const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const oldBlock = `                <div class="flex flex-col md:flex-row gap-2">
                    <input type="password" id="gemini-api-key" class="flex-1 p-2 text-sm bg-white dark:bg-gray-800 border border-purple-200 dark:border-gray-700 rounded-lg focus:border-purple-500 outline-none" placeholder="Dán mã API Key (Bắt đầu bằng AIza...) vào đây">
                    <button id="btn-ai-explain" onclick="generateAIExplanations()" class="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow transition text-sm flex items-center justify-center shrink-0">
                        <i class="fas fa-brain mr-2"></i> Nhờ AI giải thích
                    </button>
                </div>`;

const newBlock = `                <div class="flex flex-col gap-2">
                    <input type="password" id="gemini-api-key" class="w-full p-2 text-sm bg-white dark:bg-gray-800 border border-purple-200 dark:border-gray-700 rounded-lg focus:border-purple-500 outline-none" placeholder="Dán mã API Key (Bắt đầu bằng AIza...) vào đây">
                    
                    <div class="flex gap-2">
                        <button id="btn-ai-explain" onclick="generateAIExplanations()" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-2 rounded-lg transition shadow-sm text-sm" title="Giữ nguyên chữ bên trên để AI giải thích">
                            <i class="fas fa-comment-dots mr-1"></i> Giải text
                        </button>
                        <input type="file" id="ai-image-input" accept="image/*" class="hidden" onchange="handleAIImageUpload(event)">
                        <button id="btn-ai-image" onclick="document.getElementById('ai-image-input').click()" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-2 rounded-lg transition shadow-sm text-sm" title="Tải ảnh chứa đề thi để AI đọc">
                            <i class="fas fa-camera mr-1"></i> Quét Ảnh
                        </button>
                    </div>
                </div>`;

if (html.includes(oldBlock)) {
    html = html.replace(oldBlock, newBlock);
} else {
    console.log("Error: old block not found!");
}

fs.writeFileSync('index.html', html);
console.log('Successfully updated AI block');
