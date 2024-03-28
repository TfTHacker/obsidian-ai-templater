# Intro

I will be starting documentation soon. However this is a basic intro.

- Install the plugin with BRAT
- In the _AI for Templater_ settings, provide your API key and preferred default model for.

# Templater commands

Basically this plugin extends Templater with these commands:

## tp.ai.chat()

Sends a prompt to an LLM and returns the response intot the template.

### Command Definition

```javscript
tp.ai.chat(
    promptOrMessages: string | ChatCompletionMessageParam[],
    model?: string,
    systemMessage?: string,
    maxTokens?: number,
    maxOutgoingCharacters?: number,
    baseURL?: string,
    apiKey?: string,
    organization?: string
)
```

### Command argumets

- `promptOrMessages`: The prompt to send to the large language model. if it is a string, a single prompt is sent. For more advanced chat completions, use the [ChatCompletionMessageParam](https://platform.openai.com/docs/api-reference/chat/create) format.
- `model`: (optional) name of the large language model, like gpt-4-turbo-preview or gpt-3.5-turbo
- `systemMessage`: (optional) Overrides the system message as defined in settins.
- `maxTokens`: (optional) Overrides the max tokens as defined in settings.
- `maxOutgoingCharacters`: (optional) Overrides the max characters that can be sent to the LLM, as defined in settings.
- `baseURL`: (optional) Overrides the base URL as defined in settings.
- `apiKey`: (optional) Overrides the API key as defined in settings.
- `organization`: (optional) Overrides the organization as defined in settings.

## Example

`<%tp.ai.chat("How old is the moon?")%>`

## tp.ai.selection_or_nearest()

Grabs the currently selected text in a document, or selects the line where the cursor is and returns the entire line.

### Command Definition

```javscript
tp.ai.selection_or_nearest()
```

## Example

`<%tp.ai.selection_or_nearest()%>`

## tp.ai.content_without_properties()

Similiar to templaters tp.file.content, but does not return any of the properties.

### Command Definition

```javscript
tp.ai.content_without_properties()
```

## Example

`<%tp.ai.content_without_properties()%>`

# OpenAI Client Library

This plugin also exposes the client library from OpenAI and by default uses the configuration information from the _AI for Templater_ plugin settings.

This library can be accessed in the console or in Templater scripts with the object: `OpenAI`.
