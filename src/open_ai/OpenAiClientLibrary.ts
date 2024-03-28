// This module takes care of all communication with the OpenAI Client Library
// https://platform.openai.com/docs/api-reference

import type AitPlugin from '../main';
import { OpenAI } from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources';
import type { ClientOptions } from 'openai';
import { Notice, Platform } from 'obsidian';

export default class OpenAiApi {
  private plugin: AitPlugin;

  constructor(plugin: AitPlugin) {
    this.plugin = plugin;
  }

  // validates the current settings (API Key and Model)
  validateSettings = (): boolean => {
    if (!this.plugin.settings.defaultApiKey) {
      this.plugin.log('validateSettings', 'defaultApiKey is not set');
      return false;
    }
    if (!this.plugin.settings.defaultModel) {
      this.plugin.log('validateSettings', 'defaultModel is not set');
      return false;
    }
    return true;
  };

  // executes a single prompt and returns the completion
  chat = async (
    promptOrMessages: string | ChatCompletionMessageParam[],
    model?: string | null,
    systemMessage?: string | null,
    maxTokens?: number,
    maxOutgoingCharacters?: number,
    baseURL?: string | null,
    apiKey?: string | null,
    organization?: string | null
  ): Promise<string> => {
    const openai = new OpenAI({
      apiKey: apiKey ?? this.plugin.settings.defaultApiKey,
      dangerouslyAllowBrowser: true
    } as ClientOptions);

    if (baseURL) openai.baseURL = baseURL;
    if (organization) openai.organization = organization;

    if (!this.validateSettings()) {
      new Notice('Check your setting for valid API key, model and endpoint.', 10000);
      return '';
    }

    if (this.plugin.settings.defaultEndpoint !== '') openai.baseURL = this.plugin.settings.defaultEndpoint;

    const messages: ChatCompletionMessageParam[] =
      typeof promptOrMessages === 'string' ? [{ role: 'user', content: promptOrMessages }] : promptOrMessages;

    // check if messages contains a role of 'system' and if not, add it
    if (!messages.find((message) => message.role === 'system')) {
      messages.unshift({ role: 'system', content: this.plugin.settings.defaultSystemMessage });
    }
    // find the system message from the messages and replace it with the systemMessage parameter if defined
    if (systemMessage) {
      const systemMessageIndex = messages.findIndex((message) => message.role === 'system');
      if (systemMessageIndex > -1) {
        messages[systemMessageIndex].content = systemMessage;
      }
    }

    // Test the character count of messages to make sure it does not exceed the user defined maxOutgoingCharacters
    const jsonString = JSON.stringify(messages);
    const characterCount = jsonString.length;

    const maxCharacters = maxOutgoingCharacters ? maxOutgoingCharacters : this.plugin.settings.defaultMaxOutgoingCharacters;
    if (characterCount > maxCharacters) {
      new Notice(
        `${this.plugin.APP_ABBREVIARTION}: Character count exceeds the limit of ${maxCharacters.toString()} for outgoing AI requests. 
        This setting can be changed in Settings or as part of the command.`,
        10000
      );
      this.plugin.log(
        `chat', 'Character count exceeds limt. Defined limit is ${maxCharacters.toString()} and the current character count is ${characterCount.toString()}.`
      );
      return '';
    }

    try {
      const completion = await openai.chat.completions.create({
        messages: messages,
        model: model ?? this.plugin.settings.defaultModel,
        max_tokens: maxTokens ?? this.plugin.settings.defaultMaxNumTokens
      });

      if (this.plugin.settings.debugToConsole) {
        const logMessage = {
          prompt: messages,
          completion: completion,
          clientOptions: openai,
          outgoingCharacterCountMax: maxCharacters,
          outgoingCharacerCountActual: characterCount
        };
        this.plugin.log('chat', logMessage);
      }

      if (
        ((Platform.isDesktop && this.plugin.settings.displayTokenUsageDesktop) ?? false) ||
        ((Platform.isMobile && this.plugin.settings.displayTokenUsageMobile) ?? false)
      ) {
        const { usage } = completion;
        if (usage) {
          const displayMessage =
            `${this.plugin.APP_ABBREVIARTION}:\n` +
            `Tokens: ${usage.prompt_tokens.toString()}/${usage.completion_tokens.toString()}/${usage.total_tokens.toString()}\n` +
            `Character count: ${characterCount.toString()}`;
          new Notice(displayMessage, 8000);
        }
      }

      return completion.choices[0].message.content ? completion.choices[0].message.content : '';
    } catch (error) {
      new Notice(`${this.plugin.APP_ABBREVIARTION} Error: ` + String(error), 20000);
      return '';
    }
  };

  // for the current endpoint, returns a list of available modeels
  availableModels = async (): Promise<string[]> => {
    const openai = new OpenAI({
      apiKey: this.plugin.settings.defaultApiKey,
      dangerouslyAllowBrowser: true
    } as ClientOptions);

    if (!this.validateSettings()) {
      new Notice(`${this.plugin.APP_ABBREVIARTION} Check your setting for valid API key, model and endpoint.`, 10000);
      return [];
    }

    const models = await openai.models.list();

    if (this.plugin.settings.debugToConsole) {
      this.plugin.log('availableModels', models);
    }

    return models.data.map((model) => model.id);
  };
}
