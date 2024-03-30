# Description

Analyzes the current document and outputs a number of tags based on the topic and and key thoughts.

# Template Code

```javascript
<%*
const prompt = `
Generate tags using #, focusing on single words over phrases for documents' key topics. Format: #tag1 #tag2 #tag3. Limit tags to four or five. Limit multiword tags.

Contents: ${tp.ai.content_without_properties}
`;
const response = await tp.ai.chat(prompt);
return response
%>
```
