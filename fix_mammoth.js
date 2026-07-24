const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const oldMammoth = `const result = await mammoth.extractRawText({arrayBuffer: arrayBuffer});
                    extractedText = result.value;`;

const newMammoth = `const result = await mammoth.convertToHtml({arrayBuffer: arrayBuffer});
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = result.value;
                    
                    let textContent = '';
                    tempDiv.childNodes.forEach(node => {
                        if (node.nodeName === 'P') {
                            textContent += node.innerText + '\\n\\n';
                        } else if (node.nodeName === 'OL' || node.nodeName === 'UL') {
                            let i = 0;
                            node.childNodes.forEach(li => {
                                if (li.nodeName === 'LI') {
                                    const prefix = String.fromCharCode(65 + i) + '. '; // A., B., C., D.
                                    textContent += prefix + li.innerText + '\\n';
                                    i++;
                                }
                            });
                            textContent += '\\n';
                        } else if (node.innerText) {
                            textContent += node.innerText + '\\n\\n';
                        }
                    });
                    extractedText = textContent.trim();`;

html = html.replace(oldMammoth, newMammoth);

fs.writeFileSync('index.html', html);
console.log('Fixed mammoth parsing for Word lists');
