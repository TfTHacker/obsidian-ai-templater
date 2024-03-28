// a global window object named ait for access to this plugin, plus access to the OpenAI client library

/* eslint-disable import/no-named-as-default, @typescript-eslint/naming-convention -- for OpenAi export */
import type AitPlugin from '../main';
import type { Settings } from '../settings/settings';
import ChatBuilder from './ChatBuilder';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources';

declare global {
  interface Window {
    ait?: {
      availableModels: () => Promise<string[]>;
      chat: (promptOrMessages: string | ChatCompletionMessageParam[]) => Promise<string>;
      ChatBuilder: typeof ChatBuilder;
      defaultClientSettings: Settings;
      plugin: AitPlugin;
    };
    OpenAI: typeof OpenAI;
  }
}

export const setupAitApi = (plugin: AitPlugin) => {
  // API access to Ait and OpenAI Client Library from Javascript and the console debugger
  window.ait = {
    availableModels: plugin.openAiApi.availableModels,
    chat: plugin.openAiApi.chat,
    ChatBuilder: ChatBuilder,
    defaultClientSettings: plugin.settings,
    plugin: plugin
  };
  window.OpenAI = OpenAI;
};
