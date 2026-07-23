const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

// The HTML was broken starting at line 1801
// Find the exact broken piece of code inside `exportToPDF`
// `printWindow.document.write('`
// followed by `<div id="analytics-modal"`
const brokenStartIdx = html.indexOf(`printWindow.document.write('\n    <div id="analytics-modal"`);
if (brokenStartIdx !== -1) {
    const brokenEndIdx = html.indexOf(`\n</body>\n</html>');`, brokenStartIdx);
    if (brokenEndIdx !== -1) {
        const brokenContent = html.substring(brokenStartIdx + `printWindow.document.write('`.length, brokenEndIdx);
        
        // Fix the JS code
        const fixedScript = `printWindow.document.write('</body></html>');`;
        html = html.substring(0, brokenStartIdx) + fixedScript + html.substring(brokenEndIdx + `\n</body>\n</html>');`.length);
        
        // Find the actual </body>
        const lastBodyIdx = html.lastIndexOf('</body>');
        if (lastBodyIdx !== -1) {
            html = html.substring(0, lastBodyIdx) + brokenContent + '\n</body>' + html.substring(lastBodyIdx + 7);
            fs.writeFileSync('index.html', html);
            console.log('Fixed index.html properly!');
        } else {
            console.log('last </body> not found');
        }
    } else {
        console.log('brokenEndIdx not found');
    }
} else {
    // Try another pattern
    console.log('Trying alternative pattern...');
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
        // find end
        const endStr = `</html>');`;
        const endIdx = html.indexOf(endStr, startIdx);
        if (endIdx !== -1) {
            let brokenContent = html.substring(startIdx + startStr.length, endIdx);
            // remove `\n</body>` or `</body>\n` from end of brokenContent if exists
            brokenContent = brokenContent.replace(/<\/body>\s*$/, '');
            
            html = html.substring(0, startIdx) + `printWindow.document.write('</body></html>');` + html.substring(endIdx + endStr.length);
            
            const lastBodyIdx = html.lastIndexOf('</body>');
            if (lastBodyIdx !== -1) {
                html = html.substring(0, lastBodyIdx) + brokenContent + '\n</body>' + html.substring(lastBodyIdx + 7);
                fs.writeFileSync('index.html', html);
                console.log('Fixed index.html properly with alternative pattern!');
            }
        }
    } else {
        console.log('Start index not found');
    }
}
