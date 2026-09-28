// translation layer between the OpenAI-style message arrays used by the
// plugin/templates and the native Anthropic Messages API

import type AnthropicSdk from "@anthropic-ai/sdk";
import type { ChatCompletionMessageParam } from "openai/resources";
import type { SimpleChatCompletion } from "./types";

export interface AnthropicMessagesDraft {
	// top-level system prompt (Anthropic keeps it out of the messages array)
	system?: string;
	messages: AnthropicSdk.MessageParam[];
}

// ChatCompletionMessageParam content can be a plain string or an array of
// content parts; flatten both into plain text
const textFromContent = (content: unknown): string => {
	if (typeof content === "string") return content;
	if (Array.isArray(content)) {
		return content
			.map((part) =>
				part && typeof part === "object" && "text" in part
					? String((part as { text?: unknown }).text ?? "")
					: "",
			)
			.join("");
	}
	return "";
};

// converts an OpenAI-style message list into Anthropic's shape:
// - system messages become the top-level system prompt (the default system
//   message is prepended when the list has none)
// - roles other than user/assistant/system are dropped (tool/function calls
//   are not supported yet)
// - consecutive same-role messages are merged (Anthropic expects turns)
// - empty messages are dropped (Anthropic rejects them)
export const messagesToAnthropic = (
	defaultSystemMessage: string,
	messages: ChatCompletionMessageParam[],
): AnthropicMessagesDraft => {
	const systemParts: string[] = [];
	let hasSystem = false;
	const converted: AnthropicSdk.MessageParam[] = [];

	for (const message of messages) {
		if (message.role === "system") {
			const text = textFromContent(message.content).trim();
			if (text) {
				systemParts.push(text);
				hasSystem = true;
			}
			continue;
		}
		if (message.role !== "user" && message.role !== "assistant") {
			continue;
		}
		const text = textFromContent(message.content);
		if (!text.trim()) continue;
		const previous = converted[converted.length - 1];
		if (previous && previous.role === message.role) {
			previous.content = `${previous.content}\n${text}`;
		} else {
			converted.push({ role: message.role, content: text });
		}
	}

	if (!hasSystem && defaultSystemMessage.trim()) {
		systemParts.unshift(defaultSystemMessage.trim());
	}

	return {
		system: systemParts.length > 0 ? systemParts.join("\n\n") : undefined,
		messages: converted,
	};
};

// flattens an Anthropic response into the shared completion shape so the
// token usage notice and debug logging work for both providers
export const anthropicToSimpleCompletion = (
	response: AnthropicSdk.Message,
): SimpleChatCompletion => {
	const content = response.content
		.filter((block) => block.type === "text")
		.map((block) => block.text)
		.join("")
		.trim();
	const input = response.usage?.input_tokens ?? 0;
	const output = response.usage?.output_tokens ?? 0;
	return {
		content,
		usage: {
			prompt_tokens: input,
			completion_tokens: output,
			total_tokens: input + output,
		},
		stop_reason: response.stop_reason ?? undefined,
		model: response.model,
	};
};
