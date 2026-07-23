const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const startStr = `printWindow.document.write('`;
let startIdx = -1;
let idx = html.indexOf(startStr);
while (idx !== -1) {
    if (html.substring(idx + startStr.length).trim().startsWith('<div id="analytics-modal"')) {
        startIdx = idx;
        break;
    }
    idx = html.indexOf(startStr, idx + 1);
}

if (startIdx !== -1) {
    const endStr = `</html>');`;
    const endIdx = html.indexOf(endStr, startIdx);
    if (endIdx !== -1) {
        let brokenContent = html.substring(startIdx + startStr.length, endIdx);
        // remove the \n</body> or </body>\n
        const bIdx = brokenContent.indexOf('</body>');
        if(bIdx !== -1) {
            brokenContent = brokenContent.substring(0, bIdx);
        }
        
        html = html.substring(0, startIdx) + `printWindow.document.write('</body></html>');` + html.substring(endIdx + endStr.length);
        
        const lastBodyIdx = html.lastIndexOf('</body>');
        if (lastBodyIdx !== -1) {
            html = html.substring(0, lastBodyIdx) + brokenContent + '\n</body>' + html.substring(lastBodyIdx + 7);
            fs.writeFileSync('index.html', html);
            console.log('Fixed index.html properly with alternative pattern!');
        } else console.log('last body not found');
    } else console.log('endIdx not found');
} else console.log('startIdx not found');
