const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const doctypeIdx = html.indexOf('<!DOCTYPE html>');
if (doctypeIdx > 0) {
    const brokenModals = html.substring(0, doctypeIdx);
    // Remove them from top
    html = html.substring(doctypeIdx);
    
    // Insert them before </body>
    const bodyEnd = html.indexOf('</body>');
    if (bodyEnd !== -1) {
        html = html.substring(0, bodyEnd) + brokenModals + '\n</body>' + html.substring(bodyEnd + 7);
        fs.writeFileSync('index.html', html);
        console.log('Fixed HTML structure!');
    } else {
        console.log('Could not find </body>');
    }
} else {
    console.log('HTML is not broken at the top, doctypeIdx is', doctypeIdx);
}
