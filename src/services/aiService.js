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

    const promptText = `Bạn là một chuyên gia khảo thí và sư phạm học thuật. Hãy đưa ra một bản GIẢI THÍCH CHUYÊN MÔN, SÚC TÍCH, ĐI THẲNG VÀO BẢN CHẤT KIẾN THỨC cho câu hỏi trắc nghiệm sau:

[CÂU HỎI]:
${currentQ.q.replace(/<br>/g, '\n')}

[CÁC LỰA CHỌN]:
${currentQ.o.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n')}

[ĐÁP ÁN ĐÚNG]:
${correctTexts}

[LỰA CHỌN CỦA HỌC VIÊN]:
${userSelectedTexts}

=== CÁC QUY TẮC BẮT BUỘC ===
1. TUYỆT ĐỐI KHÔNG KHEN NGỢI, KHÔNG XÃ GIAO: Nghiêm cấm hoàn toàn các câu thừa thãi như "Em đã làm rất tốt", "Chúc mừng", "Hoàn toàn chính xác", "Việc em chọn đúng cho thấy...", "Chào bạn", v.v. Đi thẳng ngay vào cơ sở kiến thức chuyên môn từ từ đầu tiên.
2. TẠI SAO ĐÚNG (BẢN CHẤT KIẾN THỨC): Trình bày rõ định nghĩa, bản chất lý thuyết, công thức, căn cứ khoa học hoặc điều luật chứng minh tại sao đáp án đúng là chuẩn xác nhất. Nếu có các yếu tố thành phần (ví dụ: các đặc trưng, các bước, các tính chất), bắt buộc liệt kê rõ ràng bằng gạch đầu dòng (-) kèm in đậm từ khóa để học viên dễ học thuộc.
3. PHÂN TÍCH BẪY & CÁC PHƯƠNG ÁN SAI:
- Phân tích ngắn gọn tại sao các phương án còn lại là phương án nhiễu/sai.
- Nếu học viên chọn phương án Sai: Phân tích cụ thể lỗ hổng kiến thức hoặc bẫy tư duy mà học viên mắc phải khi chọn phương án đó.
4. MẸO GHI NHỚ (KEY TAKEAWAY): Đưa ra 1 câu chốt ngắn gọn (bắt đầu bằng 💡 Mẹo ghi nhớ: ...) giúp học viên ghi nhớ lâu hoặc phân biệt nhanh trong phòng thi.
5. HÌNH THỨC TRÌNH BÀY:
- Súc tích, mạch lạc (khoảng 3 - 6 câu), chia đoạn rõ ràng.
- Dùng gạch đầu dòng (-) cho các ý liệt kê và in đậm (**từ khóa quan trọng**).
- Tuyệt đối không lặp lại tiêu đề "Giải thích:".`;

    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-lite'];
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
