const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

// Fix the \n literal
html = html.replace('<head>\\n', '<head>\n');

// Fix the font family
html = html.replace(
    /body \{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;/g, 
    "body { font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;"
);

fs.writeFileSync('index.html', html);
console.log('Fixed \\n and font-family.');
