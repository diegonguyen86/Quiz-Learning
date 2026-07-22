const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const oldBlockStart = '                <div class="flex items-center justify-between mb-2 mt-2">\n                    <label class="text-sm font-bold text-purple-700 dark:text-purple-400"><i class="fas fa-magic mr-1"></i> Trợ lý AI Giải Thích Đáp Án</label>';
const oldBlockEnd = '                        <i class="fas fa-robot mr-1"></i> Bổ sung\n                    </button>\n                </div>';

const idxStart = html.indexOf(oldBlockStart);
const idxEndSearch = html.indexOf('</button>', idxStart) + 9;
const endOfDiv = html.indexOf('</div>', idxEndSearch) + 6;

if (idxStart !== -1) {
const newBlock = `                <div class="flex items-center justify-between mb-2 mt-2">
                    <label class="text-sm font-bold text-purple-700 dark:text-purple-400"><i class="fas fa-magic mr-1"></i> Trợ lý AI Đa Năng (Gemini 1.5 Flash)</label>
                    <button onclick="document.getElementById('api-guide').classList.toggle('hidden')" class="text-[10px] md:text-xs text-blue-500 hover:underline">
                        <i class="fas fa-question-circle"></i> Lấy API Key ở đâu?
                    </button>
                </div>
                
                <div id="api-guide" class="hidden mb-3 p-3 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded text-xs text-gray-600 dark:text-gray-300">
                    <b>Cách lấy API Key (1 phút):</b><br>
                    1. Truy cập <a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-blue-500 underline font-bold">Google AI Studio</a> và đăng nhập bằng Gmail.<br>
                    2. Bấm nút <b>"Get API key"</b> (hoặc "Create API Key").<br>
                    3. Bấm <b>"Create API key in new project"</b>.<br>
                    4. Copy chuỗi ký tự vừa tạo và dán vào ô bên dưới!
                </div>

                <div class="flex flex-col gap-2 mb-2">
                    <input type="password" id="gemini-api-key" placeholder="Dán API Key vào đây..." class="w-full p-2 bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 rounded focus:border-purple-500 outline-none text-sm">
                    <div class="flex gap-2">
                        <button id="btn-ai-explain" onclick="generateAIExplanations()" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-2 rounded transition shadow-sm text-sm" title="Giữ nguyên chữ bên trên để AI giải thích">
                            <i class="fas fa-comment-dots mr-1"></i> Giải text
                        </button>
                        <input type="file" id="ai-image-input" accept="image/*" class="hidden" onchange="handleAIImageUpload(event)">
                        <button id="btn-ai-image" onclick="document.getElementById('ai-image-input').click()" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-2 rounded transition shadow-sm text-sm" title="Tải ảnh chứa đề thi để AI đọc">
                            <i class="fas fa-camera mr-1"></i> Quét Ảnh
                        </button>
                    </div>
                </div>`;

    html = html.substring(0, idxStart) + newBlock + html.substring(endOfDiv);
    fs.writeFileSync('index.html', html);
    console.log('Successfully replaced AI tool UI block dynamically.');
} else {
    console.log('Could not find idxStart for AI block.');
}
