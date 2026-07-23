const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

// The broken string was inserted at the FIRST </body>
// So there is a section: printWindow.document.write(' + brokenModals + \n</body></html>');
const brokenStart = html.indexOf(`printWindow.document.write('    <div id="analytics-modal"`);
if (brokenStart !== -1) {
    const endBroken = html.indexOf(`\n</body></html>');`, brokenStart);
    if (endBroken !== -1) {
        const brokenModals = html.substring(brokenStart + `printWindow.document.write('`.length, endBroken);
        
        // Remove it from the script
        const fixedScript = `printWindow.document.write('</body></html>');`;
        html = html.substring(0, brokenStart) + fixedScript + html.substring(endBroken + `\n</body></html>');`.length);
        
        // Now insert brokenModals right before the LAST </body>
        const lastBodyIdx = html.lastIndexOf('</body>');
        if (lastBodyIdx !== -1) {
            html = html.substring(0, lastBodyIdx) + brokenModals + '\n' + html.substring(lastBodyIdx);
            fs.writeFileSync('index.html', html);
            console.log('Fixed the broken JS string!');
        } else {
            console.log('Could not find last </body>');
        }
    } else {
        console.log('Could not find end of broken section');
    }
} else {
    console.log('Could not find start of broken section');
}
