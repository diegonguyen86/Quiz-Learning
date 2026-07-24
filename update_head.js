const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const libraries = `
    <!-- Libraries for parsing files -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <script>pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';</script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"></script>
`;

if (!html.includes('pdf.min.js')) {
    html = html.replace('</head>', libraries + '</head>');
    fs.writeFileSync('index.html', html);
    console.log('Added CDNs');
} else {
    console.log('CDNs already exist');
}
