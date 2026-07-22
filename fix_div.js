const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const oldBlock = `            <div>
                <label class="block text-base font-bold mb-2 text-green-600 dark:text-green-400">BƯỚC 3: Hoàn tất</label>
                <button id="btn-parse" onclick="parseAndSaveData()" class="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 md:py-4 rounded-xl shadow-lg transition transform text-base md:text-lg">
                    <i class="fas fa-cogs mr-2"></i> Xử lý & Kiểm tra lại
                </button>
            </div>
        </div>

        <div id="preview-screen"`;

const newBlock = `            </div>
        </div>

        <div>
            <label class="block text-base font-bold mb-2 text-green-600 dark:text-green-400">BƯỚC 3: Hoàn tất</label>
            <button id="btn-parse" onclick="parseAndSaveData()" class="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 md:py-4 rounded-xl shadow-lg transition transform text-base md:text-lg">
                <i class="fas fa-cogs mr-2"></i> Xử lý & Kiểm tra lại
            </button>
        </div>
    </div> <!-- Close import-screen -->

    <div id="preview-screen"`;

if (html.includes(oldBlock)) {
    html = html.replace(oldBlock, newBlock);
    fs.writeFileSync('index.html', html);
    console.log('Fixed div nesting!');
} else {
    console.log('Not found block!');
}
