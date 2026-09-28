// API dialect selection stored per endpoint; "auto" inspects the URL
// (api.anthropic.com => Anthropic, anything else => OpenAI-compatible)
export type ApiTypeSetting = "auto" | "openai" | "anthropic";

export const API_TYPE_OPTIONS: ApiTypeSetting[] = [
	"auto",
	"openai",
	"anthropic",
];

export const API_TYPE_LABELS: Record<ApiTypeSetting, string> = {
	auto: "Auto-detect",
	openai: "OpenAI compatible",
	anthropic: "Anthropic",
};

// accepts only the three known values; anything else falls back to "auto"
export const sanitizeApiType = (value: unknown): ApiTypeSetting =>
	value === "openai" || value === "anthropic" ? value : "auto";

export interface SavedEndpoint {
	value: string;
	alias: string;
	apiKey: string;
	apiType: ApiTypeSetting;
}

// stored api type for an endpoint ("auto" when absent)
export const apiTypeForEndpoint = (
	endpoints: SavedEndpoint[],
	endpoint: string,
): ApiTypeSetting =>
	endpoints.find((entry) => entry.value === endpoint)?.apiType ?? "auto";

// models fetched from an endpoint (or added manually), keyed by endpoint URL
export interface SavedModelList {
	endpoint: string;
	models: string[];
	fetchedAt?: number;
	// token limits per model id, when the endpoint reports them
	// (e.g. OpenRouter's context_length / top_provider.max_completion_tokens)
	limits?: Record<string, ModelLimit>;
	// max tokens per model id entered manually in settings (informational,
	// useful when the endpoint does not report the limits itself)
	manualLimits?: Record<string, number>;
}

// manual max tokens edited by the user for a model in settings, when any
export const manualMaxTokensFor = (
	lists: SavedModelList[],
	endpoint: string,
	model: string,
): number | undefined =>
	savedModelListFor(lists, endpoint)?.manualLimits?.[model];

// token limits for a single model as reported by the endpoint
export interface ModelLimit {
	// total context window (input + output), when reported
	contextLength?: number;
	// maximum completion (output) tokens, when reported
	maxCompletionTokens?: number;
	fetchedAt?: number;
}

export interface Settings {
	defaultEndpoint: string;
	defaultModel: string;
	savedEndpoints: SavedEndpoint[];
	savedModels: SavedModelList[];
	defaultApiKey: string;
	defaultMaxNumTokens: number;
	defaultMaxOutgoingCharacters: number;
	debugToConsole?: boolean;
	displayTokenUsageDesktop?: boolean;
	displayTokenUsageMobile?: boolean;
	defaultSystemMessage: string;
}

export const savedModelListFor = (
	lists: SavedModelList[],
	endpoint: string,
): SavedModelList | undefined =>
	lists.find((list) => list.endpoint === endpoint);

export const mergeModels = (...sourceLists: string[][]): string[] => [
	...new Set(sourceLists.flat().filter(Boolean)),
];

export const DEFAULT_SETTINGS: Settings = {
	defaultEndpoint: "",
	defaultModel: "",
	savedEndpoints: [],
	savedModels: [],
	defaultApiKey: "",
	defaultMaxOutgoingCharacters: 4096,
	// 0 = auto: use the maximum detected for the selected model (when the
	// endpoint reports it); if nothing is detected, omit max_completion_tokens
	defaultMaxNumTokens: 0,
	debugToConsole: false,
	displayTokenUsageDesktop: true,
	displayTokenUsageMobile: false,
	defaultSystemMessage: "You are a helpful assistant.",
};
