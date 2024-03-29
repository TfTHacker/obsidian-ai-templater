# Description
Grabs the current selection or line and sends it to the AI and then  Returns a response under the selection.
# Template Code
```javascript
<%tp.ai.selection_or_nearest()%>
<% "\n" + (await tp.ai.chat(tp.file.selection())) %>
```