# Description

Retrieves an inspirational quote for the day.

# Template Code

```javascript
<%*
const prompt = `
Find and share an inspirational quote from a famous or well-known individual from modern times to the past. Please choose from diverse sources such as renowned writers, philosophers, leaders, artists, scientists, and other influential historical figures. Format the quote as a markdown callout and include the author's name.

For example:

> [!quote] "The bigger the challenge, the greater the opportunity for growth." - Les Brown
`;
const response = await tp.ai.chat(prompt);
return response + '\n\n';
%>
```
