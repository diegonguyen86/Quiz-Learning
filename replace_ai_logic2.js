const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const startIdx = html.indexOf('async function handleAIImageUpload(e)');
if (startIdx !== -1) {
    const endStr = "btnAI.classList.remove('opacity-50');\n        }";
    let endIdx = html.indexOf(endStr, startIdx);
    
    if (endIdx !== -1) {
        endIdx += endStr.length;
        
        const newCode = `async function handleFileUpload(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const status = document.getElementById('upload-status');
            status.classList.remove('hidden');
            
            try {
                const type = file.name.split('.').pop().toLowerCase();
                let extractedText = '';

                if (type === 'pdf') {
                    status.innerHTML = \`<i class="fas fa-spinner fa-spin mr-2"></i> Đang đọc file PDF...\`;
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map(item => item.str).join(' ');
                        extractedText += pageText + '\\n\\n';
                    }
                } else if (type === 'docx') {
                    status.innerHTML = \`<i class="fas fa-spinner fa-spin mr-2"></i> Đang đọc file Word...\`;
                    const arrayBuffer = await file.arrayBuffer();
                    const result = await mammoth.extractRawText({arrayBuffer: arrayBuffer});
                    extractedText = result.value;
                } else if (file.type.startsWith('image/')) {
                    status.innerHTML = \`<i class="fas fa-spinner fa-spin mr-2"></i> Đang đọc chữ từ ảnh (10-20s)...\`;
                    const result = await Tesseract.recognize(file, 'vie');
                    extractedText = result.data.text;
                } else {
                    throw new Error("Định dạng file không hỗ trợ! Vui lòng chọn PDF, DOCX hoặc Ảnh.");
                }

                const textArea = document.getElementById('raw-text-input');
                textArea.value = (textArea.value + '\\n\\n' + extractedText).trim();
                showToast("Đã trích xuất chữ thành công!", 'success');
            } catch (err) {
                console.error(err);
                showToast("Lỗi khi đọc file: " + err.message, 'error');
            } finally {
                status.classList.add('hidden');
                e.target.value = '';
            }
        }

        async function generateExplanationsAI() {
            const apiKey = document.getElementById('gemini-api-key').value.trim();
            const rawText = document.getElementById('raw-text-input').value.trim();
            const btnAI = document.getElementById('btn-ai-explain');

            if (!apiKey) return showToast("Vui lòng nhập Gemini API Key để sử dụng tính năng này!", 'error');
            if (!rawText) return showToast("Vui lòng dán nội dung bộ đề vào ô bên dưới trước khi gọi AI!", 'error');

            localStorage.setItem('GEMINI_API_KEY', apiKey);
            btnAI.disabled = true;
            btnAI.classList.add('opacity-50');
            btnAI.innerHTML = \`<i class="fas fa-spinner fa-spin mr-1"></i> Đang xử lý...\`;

            const blocks = rawText.split(/\\n\\s*\\n/).filter(b => b.trim() !== '');
            const CHUNK_SIZE = 15;
            const chunks = [];
            for (let i = 0; i < blocks.length; i += CHUNK_SIZE) {
                chunks.push(blocks.slice(i, i + CHUNK_SIZE).join('\\n\\n'));
            }

            let finalResult = "";
            const promptTemplate = \`
            Dưới đây là một phần của bộ đề thi trắc nghiệm. Nhiệm vụ của bạn là đóng vai một Trợ giảng kiểm định chất lượng (QA Reviewer):
            Bước 1: Đọc và tìm hiểu mỗi câu hỏi.
            Bước 2: Viết một câu giải thích ngắn gọn (1-2 câu) cho câu hỏi đó, chỉ ra đáp án đúng theo kiến thức thực tế, và để dưới dạng "Giải thích: [Nội dung giải thích]".

            YÊU CẦU BẮT BUỘC:
            1. Tuyệt đối KHÔNG ĐƯỢC tự ý sửa hay xóa nội dung gốc của người dùng.
            2. KHÔNG thay đổi từ ngữ, không phá vỡ định dạng A, B, C, D của bộ đề.
            3. Chỉ trả về nội dung bộ đề gốc đã được chèn thêm dòng "Giải thích: [Nội dung giải thích]" ở cuối mỗi câu hỏi. Không chèn thẻ markdown, không chào hỏi.

            Phần bộ đề cần xử lý:
            \`;

            try {
                for (let i = 0; i < chunks.length; i++) {
                    const response = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=\${apiKey}\`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: promptTemplate + chunks[i] }] }],
                            generationConfig: { temperature: 0.1 }
                        })
                    });

                    const data = await response.json();
                    if (data.error) throw new Error(data.error.message);

                    let aiResult = data.candidates[0].content.parts[0].text;
                    aiResult = aiResult.replace(/^\\\`\\\`\\\`[a-z]*\\n/gm, '').replace(/\\\`\\\`\\\`$/gm, '').trim();
                    finalResult += aiResult + "\\n\\n";
                    
                    if(i < chunks.length - 1) {
                        btnAI.innerHTML = \`<i class="fas fa-spinner fa-spin mr-1"></i> Đang xử lý \${i + 1}/\${chunks.length}...\`;
                    }
                }

                document.getElementById('raw-text-input').value = finalResult.trim();
                showToast("Đã chèn giải thích AI thành công!", 'success');
            } catch (err) {
                console.error(err);
                showToast("Lỗi AI: " + err.message, 'error');
            } finally {
                btnAI.disabled = false;
                btnAI.innerHTML = \`<i class="fas fa-magic mr-1"></i> Tự động tạo Giải Thích bằng AI\`;
                btnAI.classList.remove('opacity-50');
            }
        }`;
        
        html = html.substring(0, startIdx) + newCode + html.substring(endIdx);
        fs.writeFileSync('index.html', html);
        console.log('Replaced AI logic with handleFileUpload and generateExplanationsAI');
    } else {
        console.log('Could not find end of generateAIExplanations');
    }
} else {
    console.log('Could not find start of handleAIImageUpload');
}
