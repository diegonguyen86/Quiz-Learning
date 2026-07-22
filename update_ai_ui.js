const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const startStr = '<textarea id="raw-text-input"';
const endStr = '<button id="btn-parse-data"';

const startIdx = html.indexOf(startStr);
const endIdx = html.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
    const newUI = `                        <textarea id="raw-text-input" rows="10" class="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white custom-scrollbar focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-y" placeholder="Dán toàn bộ nội dung đề trắc nghiệm vào đây... Hoặc tải ảnh lên ở bên dưới."></textarea>
                        
                        <!-- Tool AI -->
                        <div class="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 flex flex-col gap-3 mb-6">
                            <div class="flex items-center justify-between text-sm font-bold text-indigo-800 dark:text-indigo-300">
                                <div><i class="fas fa-robot mr-2"></i> AI Trợ Lý (Gemini 1.5 Flash)</div>
                            </div>
                            <div class="flex flex-col md:flex-row gap-3 items-center w-full">
                                <div class="flex-1 w-full">
                                    <input type="password" id="gemini-api-key" placeholder="Nhập Gemini API Key..." class="w-full text-sm p-2 border border-indigo-200 dark:border-indigo-700 rounded-lg bg-white dark:bg-gray-800 outline-none focus:ring-1 focus:ring-indigo-500">
                                </div>
                            </div>
                            
                            <!-- Chức năng AI -->
                            <div class="flex flex-col md:flex-row gap-2 w-full mt-1">
                                <!-- Tính năng 1: Giải thích text -->
                                <button id="btn-ai-explain" onclick="generateAIExplanations()" class="flex-1 whitespace-nowrap bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2 px-4 rounded-lg shadow-sm transition" title="Yêu cầu phải có chữ sẵn ở ô bên trên để AI giải">
                                    <i class="fas fa-magic mr-1"></i> Bổ sung Giải thích
                                </button>

                                <!-- Tính năng 2: OCR Ảnh -->
                                <div class="relative flex-1">
                                    <input type="file" id="ai-image-input" accept="image/*" class="hidden" onchange="handleAIImageUpload(event)">
                                    <button id="btn-ai-image" onclick="document.getElementById('ai-image-input').click()" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2 px-4 rounded-lg shadow-sm transition">
                                        <i class="fas fa-camera mr-1"></i> Quét Đề bằng Ảnh
                                    </button>
                                </div>
                            </div>
                        </div>

                        `;
    html = html.substring(0, startIdx) + newUI + html.substring(endIdx);
    fs.writeFileSync('index.html', html);
    console.log('Successfully replaced AI tool UI block.');
} else {
    console.log('Could not find start or end index for AI tool UI block.');
}
