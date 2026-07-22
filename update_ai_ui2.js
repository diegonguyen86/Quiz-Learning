const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const oldBlock = `                <div class="flex items-center justify-between mb-2 mt-2">
                    <label class="text-sm font-bold text-purple-700 dark:text-purple-400"><i class="fas fa-magic mr-1"></i> Trợ lý AI Giải Thích Đáp Án</label>
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

                <div class="flex gap-2 mb-2">
                    <input type="password" id="gemini-api-key" placeholder="Dán API Key vào đây..." class="flex-1 p-2 bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 rounded focus:border-purple-500 outline-none text-sm">
                    <button id="btn-ai-explain" onclick="generateAIExplanations()" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition shadow-sm whitespace-nowrap">
                        <i class="fas fa-robot mr-1"></i> Bổ sung giải thích
                    </button>
                </div>`;

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
                        <button id="btn-ai-explain" onclick="generateAIExplanations()" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-2 rounded transition shadow-sm text-sm">
                            <i class="fas fa-comment-dots mr-1"></i> Giải thích text
                        </button>
                        <input type="file" id="ai-image-input" accept="image/*" class="hidden" onchange="handleAIImageUpload(event)">
                        <button id="btn-ai-image" onclick="document.getElementById('ai-image-input').click()" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-2 rounded transition shadow-sm text-sm">
                            <i class="fas fa-camera mr-1"></i> Quét ảnh ra Đề
                        </button>
                    </div>
                </div>`;

if (html.includes(oldBlock)) {
    html = html.replace(oldBlock, newBlock);
} else {
    console.log("Error: old block not found!");
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

if (!html.includes('async function handleAIImageUpload')) {
    html = html.replace('        async function generateAIExplanations()', aiImageLogic + '\n        async function generateAIExplanations()');
}

// Fix the Gemini API version used in generateAIExplanations
html = html.replace('gemini-3.5-flash', 'gemini-1.5-flash');
html = html.replace('gemini-pro', 'gemini-1.5-flash');

fs.writeFileSync('index.html', html);
console.log('Successfully updated AI block');
