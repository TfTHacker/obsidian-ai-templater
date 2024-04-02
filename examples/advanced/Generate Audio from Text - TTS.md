# Description

This is a more advanced example that generates audio from text using OpenAI text-to-speech models. Select the text you want an audio file generated for, and run the script. The model will generate an audio file based on the text, save it to the vault and insert a link to the audio file in the note.

This demonstrates using the OpenAI Client Library directly in javaScript code to interact with the OpenAI API.

# Template Code

```javascript
<%*
// Info for the API: https://platform.openai.com/docs/api-reference/audio/createSpeech?lang=node
const model = "tts-1"; // tts-1 or tts-1-hd
const voice = "nova"; // alloy, echo, fable, onyx, nova, and shimmer

const selectedText = tp.file.selection();
if (selectedText === null || selectedText.length === 0) {
  new Notice("Select text that will serve as the prompt.", 10000);
  return;
}

const now = new Date();
const dateString = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate() + '_' + now.getHours() + now.getMinutes() + now.getSeconds();
const fileName = "/tts_" + dateString + ".mp3";

const openai = new ait.OpenAI({
  apiKey: ait.defaultClientSettings.defaultApiKey,
  dangerouslyAllowBrowser: true
});

const activityIndicator = new ait.ActivityIndicator();
try {
  activityIndicator.add();
  const mp3 = await openai.audio.speech.create({
    model: model,
    voice: voice,
    input: selectedText,
  });
  const buffer = await mp3.arrayBuffer();
  await app.vault.adapter.writeBinary(fileName, buffer);
  activityIndicator.remove();
} catch (error) {
  activityIndicator.remove();
  new Notice("Error: " + error);
  return;
}

return `${selectedText}\n\n![${fileName}](${fileName})\n\n`;
%>
```
