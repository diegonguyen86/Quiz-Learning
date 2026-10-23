export async function translateText(text, targetLang = 'vi') {
    try {
        const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
        const data = await response.json();
        return data[0].map(item => item[0]).join('');
    } catch (e) {
        console.error("Translation error:", e);
        return text;
    }
}

export async function askGeminiExplanation(currentQ, selectedIndices, apiKey) {
    if (!apiKey) throw new Error("Chưa có Google Gemini API Key!");

    const userSelectedTexts = selectedIndices.length > 0 
        ? selectedIndices.map(idx => `"${currentQ.o[idx]}" (${currentQ.a.includes(idx) ? 'Đúng' : 'Sai'})`).join(', ') 
        : "Không chọn đáp án nào";
    const correctTexts = currentQ.a.map(idx => `"${currentQ.o[idx]}"`).join(', ');

    const promptText = `Đóng vai một trợ giảng xuất sắc. Bạn đang chấm bài cho học viên.\n\nCâu hỏi: ${currentQ.q}\nCác đáp án:\n${currentQ.o.map(opt => "- " + opt).join('\n')}\nĐáp án đúng của hệ thống: ${correctTexts}\n\nHọc viên đã chọn: ${userSelectedTexts}\n\nYÊU CẦU:\n- Dựa vào trạng thái (Đúng/Sai) của từng đáp án học viên đã chọn, hãy giải thích tại sao các đáp án Sai (nếu có) lại không chính xác, và tại sao đáp án Đúng lại là đáp án chuẩn xác nhất.\n- Chỉ ra chỗ sai trong tư duy của học viên khi họ chọn các đáp án Sai.\n- Giải thích ngắn gọn (2-4 câu), trực tiếp vào vấn đề.\n- Viết dưới dạng văn bản thuần, không dùng Markdown.\n- Trả về đúng nội dung giải thích, không lặp lại chữ "Giải thích:".`;

    const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'];
    let lastError = null;

    for (let model of modelsToTry) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptText }] }],
                    generationConfig: { temperature: 0.1 }
                })
            });

            const resData = await response.json();
            if (resData.error) throw new Error(resData.error.message);
            
            let aiResult = resData.candidates[0].content.parts[0].text;
            return aiResult.replace(/^```[a-z]*\n/gm, '').replace(/```$/gm, '').trim();
        } catch (e) {
            lastError = e;
            if (e.message && e.message.includes("API key not valid")) break;
        }
    }

    throw lastError || new Error("Không thể kết nối với Google Gemini AI!");
}
