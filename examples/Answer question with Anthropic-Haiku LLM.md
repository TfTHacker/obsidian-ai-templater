# Description
Grabs the current selection or line and sends it to the AI and then  Returns a response under the selection.
Make sure to use your API key in the template code by replacing API-KEY with your API key.

This sample uses the Open Router service to call the Haiku LLM from Antropic. Open Router offers access to many Large Language Models.
# Template Code
```javascript
<%tp.ai.selection_or_nearest()%>
<% "\n" + (await  tp.ai.chat(tp.file.selection(), "anthropic/claude-3-haiku", null, null, null, "https://openrouter.ai/api/v1/", "API-KEY"))%>

```