# Description

Takes a PDF file and extracts its text content. That text content is then sent to the AI model as a prompt. The AI model will summarize the text in 20 words or less.

# Template Code

```javascript
<%*
const filePath = '/pdf-sample.pdf';
let prompt = 'Summarize the text in 20 words or less: ';

const pdfjsLib = await tp.obsidian.loadPdfJs();
const pdfFile = await app.vault.adapter.readBinary(filePath);
let textContent = '';

await pdfjsLib.getDocument({ data: pdfFile }).promise.then(async function (pdf) {
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const text = await page.getTextContent();
    textContent += text.items.map(item => item.str).join(' ') + '\n';
  }
}).catch(function (error) {
  console.log('Error: ' + error.message);
});

prompt += textContent;
const response = await tp.ai.chat(prompt);
return response;
%>
```
