# Description

Sends the contents of the current file to get five possible titles for this file. A suggester is displayed with the five titles. If a title is selected, the document is renamed.

# Template Code

```javascript
<%*
const prompt = `Generate interesting but succinct file titles that capture the essence of all the content. Each title should be on its own line, not numbered. Do not include characters not permitted in file names for most operating systems. Spaces can be used in the file name. Do not add extensions to the file name. Do not include any non-character characters. Generate no more than 5 titles.  Do this for the following content: ${tp.ai.content_without_properties}`;
const response = await tp.ai.chat(prompt);
const titles = response.split('\n')
const newTitle = await tp.system.suggester(titles,titles)
if(newTitle===null) return;
tp.file.rename(newTitle)
%>
```
