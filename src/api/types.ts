// provider-agnostic completion shape shared by every adapter; mirrors the
// fields OpenAiClientLibrary needs (text, usage for the token notice, debug)

export interface SimpleChatUsage {
	prompt_tokens: number;
	completion_tokens: number;
	total_tokens: number;
}

export interface SimpleChatCompletion {
	content: string;
	usage?: SimpleChatUsage;
	stop_reason?: string;
	model?: string;
}
