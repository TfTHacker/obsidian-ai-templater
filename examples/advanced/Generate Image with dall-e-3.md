# Description

This is a more advanced example that generates an image using the DALL-E-3 model. The model is capable of generating images from textual prompts. The prompt is a description of the image you want to generate. The model will generate an image based on the description.

This demonstrates using the OpenAI Client Library directly in javaScript code to interact with the OpenAI API.

# Template Code

```javascript
<%*
const selectedText = tp.file.selection();
if (selectedText === null || selectedText.length === 0) {
  new Notice("Select text that will serve as the prompt.", 10000);
  return;
}

// More info for parameters to the API: https://platform.openai.com/docs/api-reference/images/create
const model = "dall-e-3";
const size = "1024x1024"; // for dall-e-3: 1024x1024, 1792x1024, or 1024x1792 for dall-e-3 models.
const style = "vivid";  // for dall-e-3: vivid or natural
const quality = "standard";  // for dall-e-3: hd or standard

const openai = new ait.helpers.OpenAI({
  apiKey: ait.defaultClientSettings.defaultApiKey,
  dangerouslyAllowBrowser: true
});

const activityIndicator = new ait.helpers.ActivityIndicator();

try {
  activityIndicator.add();
  const imageB64 = await openai.images.generate({
    model: model,
    prompt: selectedText,
    response_format: "b64_json",
    size: size,
    style: style,
    quality: quality
  });
  const now = new Date();
  const dateString = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate() + '_' + now.getHours() + now.getMinutes() + now.getSeconds();
  const fileName = "/dalle_" + dateString + ".jpg";
  const imageBuffer = tp.obsidian.base64ToArrayBuffer(imageB64.data[0].b64_json)
  app.vault.adapter.writeBinary(fileName, imageBuffer)
  activityIndicator.remove();
  return `${selectedText}\n\n![${fileName}](${fileName})\n\n`;
} catch (error) {
  new Notice("Error: " + error.message, 10000);
  activityIndicator.remove();
  return selectedText;
}
%>
```
