// a global window object named ait for access to this plugin, plus access to the OpenAI client library

import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources";
import { toFile } from "openai/uploads";
import type AitPlugin from "../main";
import type { Settings } from "../settings/settings";
import ActivityIndicator from "../utils/ActivityIndicator";
import ChatBuilder from "./ChatBuilder";

declare global {
	interface Window {
		ait?: {
			availableModels: (
				baseURL?: string | null,
				apiKey?: string | null,
			) => Promise<string[]>;
			chat: (
				promptOrMessages: string | ChatCompletionMessageParam[],
			) => Promise<string>;
			defaultClientSettings: Settings;
			helpers: {
				ActivityIndicator: typeof ActivityIndicator;
				ChatBuilder: typeof ChatBuilder;
				OpenAI: typeof OpenAI;
				toFile: typeof toFile;
			};
			plugin: AitPlugin;
		};
	}
}

export const setupAitApi = (plugin: AitPlugin) => {
	// API access to Ait and OpenAI Client Library from Javascript and the console debugger
	window.ait = {
		availableModels: plugin.openAiApi.availableModels,
		chat: plugin.openAiApi.chat,
		defaultClientSettings: plugin.settings,
		helpers: {
			ActivityIndicator: ActivityIndicator,
			ChatBuilder: ChatBuilder,
			OpenAI: OpenAI,
			toFile: toFile,
		},
		plugin: plugin,
	};
};
