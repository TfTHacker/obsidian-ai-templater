# Description

This is a more advanced example that transcribes an MP3 file to text using OpenAI audio-to-text models. Select the MP3 file you want transcribed, and run the script. The model will transcribe the audio file to text and return the text.

# Template Code

```javascript
<%*
// Info for the API: https://platform.openai.com/docs/api-reference/audio/createTranscription

const fileName = '/mp3-sample.mp3';

const openai = new ait.helpers.OpenAI({
  apiKey: ait.helpers.defaultClientSettings.defaultApiKey,
  dangerouslyAllowBrowser: true
});

const activityIndicator = new ait.helpers.ActivityIndicator();
try {
  activityIndicator.add();
  const fileBuffer = await app.vault.adapter.readBinary(fileName)
  const fileStream = await ait.helpers.toFile(fileBuffer, 'audio.mp3');
  const transcription = await openai.audio.transcriptions.create({
    file: fileStream,
    model: "whisper-1",
  });
  activityIndicator.remove();
  return transcription.text;
} catch (error) {
  activityIndicator.remove();
  console.log(error)
  new Notice("Error: " + error);
  return '';
}%>
%>
```
