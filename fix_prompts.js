const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

// 1. Add HTML for custom-prompt-modal
const confirmModalHtmlEnd = `</div>
    </div>`;
const promptModalHtml = `
    <div id="custom-prompt-modal" class="fixed inset-0 bg-gray-900 bg-opacity-50 z-[100] hidden flex items-center justify-center p-4 fade-in">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <h3 id="prompt-title" class="text-lg font-bold text-gray-900 dark:text-white mb-2">Nhập liệu</h3>
            <p id="prompt-msg" class="text-gray-600 dark:text-gray-300 text-sm mb-4">Vui lòng nhập thông tin:</p>
            <input type="text" id="prompt-input" class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white mb-6 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" autocomplete="off">
            <div class="flex justify-end gap-3">
                <button id="prompt-cancel-btn" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md text-sm font-medium transition">Hủy</button>
                <button id="prompt-ok-btn" class="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-sm font-medium transition">Xác nhận</button>
            </div>
        </div>
    </div>`;

// Insert prompt modal html right after confirm modal
let insertIdx = html.indexOf('<div id="custom-confirm-modal"');
let insertEndIdx = html.indexOf('</script>', insertIdx); // find somewhere to insert safely, wait no, find the closing of confirm modal
// Let's just find `function showToast` and insert the promptModalHtml right before it (outside script)
let scriptStart = html.indexOf('    <script>\n        // Custom UI System');
html = html.substring(0, scriptStart) + promptModalHtml + '\n' + html.substring(scriptStart);


// 2. Add showPrompt JS function
const showPromptFunc = `
        function showPrompt(title, message, placeholder, onConfirm) {
            const modal = document.getElementById('custom-prompt-modal');
            document.getElementById('prompt-title').innerText = title;
            document.getElementById('prompt-msg').innerText = message;
            
            const inputEl = document.getElementById('prompt-input');
            inputEl.placeholder = placeholder || '';
            inputEl.value = '';
            
            const okBtn = document.getElementById('prompt-ok-btn');
            const cancelBtn = document.getElementById('prompt-cancel-btn');
            
            // Clear old event listeners
            const newOkBtn = okBtn.cloneNode(true);
            const newCancelBtn = cancelBtn.cloneNode(true);
            okBtn.parentNode.replaceChild(newOkBtn, okBtn);
            cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
            
            newCancelBtn.onclick = () => modal.classList.add('hidden');
            
            const submitVal = () => {
                const val = document.getElementById('prompt-input').value.trim();
                if(!val) {
                    showToast('Vui lòng không để trống!', 'warning');
                    return;
                }
                modal.classList.add('hidden');
                if (onConfirm) onConfirm(val);
            };
            
            newOkBtn.onclick = submitVal;
            
            // Press enter to submit
            inputEl.onkeyup = (e) => {
                if (e.key === 'Enter') submitVal();
            };
            
            modal.classList.remove('hidden');
            setTimeout(() => inputEl.focus(), 100);
        }
`;

html = html.replace('        function showConfirm', showPromptFunc + '\n        function showConfirm');

// 3. Fix importCopyQuiz (was using prompt())
const oldImport = `        async function importCopyQuiz() {
            const code = prompt("LẤY ĐỀ:\\nVui lòng dán Mã Share của bộ đề vào đây:");
            if (!code) return;`;
const newImport = `        async function importCopyQuiz() {
            showPrompt("Nhập Code Đề", "Vui lòng dán Mã Share của bộ đề vào đây:", "Ví dụ: QL-ABCDEF12", async (code) => {`;
html = html.replace(oldImport, newImport);

// Have to close the callback for importCopyQuiz
const oldImportEnd = `                }
                
                // ... logic copy collection sang my_quizzes của current User ...
                // Khá tốn dung lượng nếu đề lớn, nhưng phục vụ MVP hiện tại.
                const newRef = db.collection("users").doc(currentUser.uid).collection("my_quizzes").doc(docId);
                await newRef.set({
                    ...data,
                    shareCode: generateShareCode(), 
                    progress: 0,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                showToast("Đã copy bộ đề thành công vào Kho cá nhân!", 'success');
                goToDashboard();
            } catch (e) { showToast("Lỗi tải đề!", 'error'); }
        }`;
const newImportEnd = `                }
                
                // ... logic copy collection sang my_quizzes của current User ...
                // Khá tốn dung lượng nếu đề lớn, nhưng phục vụ MVP hiện tại.
                const newRef = db.collection("users").doc(currentUser.uid).collection("my_quizzes").doc(docId);
                await newRef.set({
                    ...data,
                    shareCode: generateShareCode(), 
                    progress: 0,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                showToast("Đã copy bộ đề thành công vào Kho cá nhân!", 'success');
                goToDashboard();
            } catch (e) { showToast("Lỗi tải đề!", 'error'); }
            });
        }`;
html = html.replace(oldImportEnd, newImportEnd);

// 4. Fix joinClassroom
const oldJoin = `        async function joinClassroom() {
            const code = prompt("VÀO LỚP HỌC:\\nVui lòng dán Mã Lớp Học vào đây:");
            if (!code) return;`;
const newJoin = `        async function joinClassroom() {
            showPrompt("Vào Lớp Học", "Vui lòng dán Mã Lớp Học vào đây:", "Ví dụ: QL-XYZ987", async (code) => {`;
html = html.replace(oldJoin, newJoin);

const oldJoinEnd = `                // Link trực tiếp đến document lớp học
                await db.collection("users").doc(currentUser.uid).collection("my_quizzes").doc(quizId).set({
                    isClassroom: true,
                    refPath: teacherQuizRef.path,
                    title: data.title,
                    progress: 0,
                    joinedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                showToast("Đã tham gia lớp học thành công!", 'success');
                goToDashboard();
            } catch (e) { showToast("Lỗi kết nối lớp học!", 'error'); goToDashboard(); }
        }`;
const newJoinEnd = `                // Link trực tiếp đến document lớp học
                await db.collection("users").doc(currentUser.uid).collection("my_quizzes").doc(quizId).set({
                    isClassroom: true,
                    refPath: teacherQuizRef.path,
                    title: data.title,
                    progress: 0,
                    joinedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                showToast("Đã tham gia lớp học thành công!", 'success');
                goToDashboard();
            } catch (e) { showToast("Lỗi kết nối lớp học!", 'error'); goToDashboard(); }
            });
        }`;
html = html.replace(oldJoinEnd, newJoinEnd);

// 5. Fix refreshShareCode (confirm missing closing paren fix)
const oldRefresh = `        async function refreshShareCode(quizId) {
            if(!confirm("Đổi mã bảo mật mới?\\nNhững ai giữ mã cũ sẽ KHÔNG THỂ vào copy hay học được nữa.")) return;
            try { await db.collection("users").doc(currentUser.uid).collection("my_quizzes").doc(quizId).update({ shareCode: generateShareCode() }); goToDashboard(); } 
            catch(e) { showToast("Lỗi cập nhật mã!", 'error'); }
        }`;
const newRefresh = `        async function refreshShareCode(quizId) {
            showConfirm("Đổi mã bảo mật", "Những ai giữ mã cũ sẽ KHÔNG THỂ vào copy hay học được nữa. Bạn chắc chứ?", async () => {
                try { await db.collection("users").doc(currentUser.uid).collection("my_quizzes").doc(quizId).update({ shareCode: generateShareCode() }); goToDashboard(); } 
                catch(e) { showToast("Lỗi cập nhật mã!", 'error'); }
            });
        }`;
html = html.replace(oldRefresh, newRefresh);

fs.writeFileSync('index.html', html);
console.log('Fixed prompts and remaining confirms');
