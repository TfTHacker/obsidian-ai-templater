export interface Settings {
	defaultEndpoint: string;
	defaultModel: string;
	defaultApiKey: string;
	defaultMaxNumTokens: number;
	defaultMaxOutgoingCharacters: number;
	debugToConsole?: boolean;
	displayTokenUsageDesktop?: boolean;
	displayTokenUsageMobile?: boolean;
	defaultSystemMessage: string;
}

export const DEFAULT_SETTINGS: Settings = {
	defaultEndpoint: "",
	defaultModel: "gpt-3.5-turbo",
	defaultApiKey: "",
	defaultMaxOutgoingCharacters: 4096,
	defaultMaxNumTokens: 1024,
	debugToConsole: false,
	displayTokenUsageDesktop: true,
	displayTokenUsageMobile: false,
	defaultSystemMessage: "You are a helpful assistant.",
};
