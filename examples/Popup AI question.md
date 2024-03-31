# Description

Displays an input box that the user can type into for a prompt to be sent to the AI. They AI rsponse will be displayed in a notification that last for 60 seconds, unlessed clicked on to close.

This is a convenient way to interact with the AI without having to create a new document or insert something into the document.

# Template Code

```javascript
<%*
const prompt = await tp.system.prompt("What is your request for the AI?", null, null, true);

const response = await tp.ai.chat(prompt);
new Notice(response, 60000);

return false;
%>
```
