const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const oldTextAreaUI = `                        <textarea id="raw-text-input" rows="10" class="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white custom-scrollbar focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-y" placeholder="Dán toàn bộ nội dung đề trắc nghiệm vào đây..."></textarea>
                        
                        <!-- Tool AI -->
                        <div class="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 flex flex-col md:flex-row gap-3 items-center">
                            <div class="flex-1 w-full">
                                <div class="flex items-center text-sm font-bold text-indigo-800 dark:text-indigo-300 mb-1">
                                    <i class="fas fa-robot mr-2"></i> AI Phân tích & Bổ sung Giải thích (Tùy chọn)
                                </div>
                                <input type="password" id="gemini-api-key" placeholder="Nhập Gemini API Key..." class="w-full text-sm p-2 border border-indigo-200 dark:border-indigo-700 rounded-lg bg-white dark:bg-gray-800 outline-none focus:ring-1 focus:ring-indigo-500">
                            </div>
                            <button id="btn-ai-explain" onclick="generateAIExplanations()" class="w-full md:w-auto mt-2 md:mt-0 whitespace-nowrap bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-lg shadow transition">
                                <i class="fas fa-magic mr-1"></i> Gọi AI
                            </button>
                        </div>`;

const newTextAreaUI = `                        <textarea id="raw-text-input" rows="10" class="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white custom-scrollbar focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-y" placeholder="Dán toàn bộ nội dung đề trắc nghiệm vào đây... Hoặc tải ảnh lên ở bên dưới."></textarea>
                        
                        <!-- Tool AI -->
                        <div class="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 flex flex-col gap-3">
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
                        </div>`;

if (html.includes(oldTextAreaUI)) {
    html = html.replace(oldTextAreaUI, newTextAreaUI);
} else {
    console.log("Could not find old UI block!");
}

const aiImageLogic = `
        async function handleAIImageUpload(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const apiKey = document.getElementById('gemini-api-key').value.trim();
            if (!apiKey) return showToast("Vui lòng nhập Gemini API Key để quét ảnh!", 'error');
            
            const btnImage = document.getElementById('btn-ai-image');
            const originalHtml = btnImage.innerHTML;
            btnImage.disabled = true;
            btnImage.innerHTML = \`<i class="fas fa-spinner fa-spin mr-1"></i> Đang đọc chữ...\`;
            
            try {
                localStorage.setItem('GEMINI_API_KEY', apiKey);
                
                // Convert file to Base64
                const base64Data = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result.split(',')[1]);
                    reader.onerror = error => reject(error);
                    reader.readAsDataURL(file);
                });

                const prompt = \`Hãy đọc toàn bộ văn bản trong bức ảnh này, đây là một đề thi trắc nghiệm. Nhiệm vụ của bạn là trích xuất nguyên văn toàn bộ câu hỏi và đáp án ra dạng Text.
Không được thay đổi bất kỳ từ ngữ nào, giữ nguyên các lựa chọn A, B, C, D...
Chỉ trả về nội dung đề thi, không thêm lời chào, không định dạng markdown. Không tự giải.\`;

                const response = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=\${apiKey}\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ 
                            parts: [
                                { text: prompt },
                                { inlineData: { mimeType: file.type, data: base64Data } }
                            ] 
                        }],
                        generationConfig: { temperature: 0.1 }
                    })
                });

                const data = await response.json();
                if (data.error) throw new Error(data.error.message);

                let aiResult = data.candidates[0].content.parts[0].text;
                aiResult = aiResult.replace(/^\`\`\`[a-z]*\\n/gm, '').replace(/\`\`\`$/gm, '').trim();

                const textArea = document.getElementById('raw-text-input');
                textArea.value = (textArea.value + "\\n\\n" + aiResult).trim();
                showToast("Đã trích xuất đề thi từ ảnh thành công!", 'success');
                
            } catch (err) {
                console.error(err);
                showToast("Lỗi AI: " + err.message, 'error');
            } finally {
                btnImage.disabled = false;
                btnImage.innerHTML = originalHtml;
                e.target.value = ''; // Reset file input
            }
        }
`;

html = html.replace('        async function generateAIExplanations()', aiImageLogic + '\n        async function generateAIExplanations()');

fs.writeFileSync('index.html', html);
console.log('Added AI Image OCR feature');
