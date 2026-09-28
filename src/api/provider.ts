// provider resolution and Anthropic-specific constants

import type { ApiTypeSetting } from "../settings/settings";

// API dialect used to talk to an endpoint
export type ApiProvider = "openai" | "anthropic";

// endpoints that speak the native Anthropic Messages API
const ANTHROPIC_HOSTNAMES = new Set(["api.anthropic.com"]);

// resolves the provider for an endpoint: the explicit per-endpoint setting
// wins; otherwise the hostname is inspected ("auto" / unknown endpoints)
export const providerForEndpoint = (
	endpoint: string,
	apiType?: ApiTypeSetting,
): ApiProvider => {
	if (apiType === "openai") return "openai";
	if (apiType === "anthropic") return "anthropic";
	try {
		return ANTHROPIC_HOSTNAMES.has(new URL(endpoint).hostname)
			? "anthropic"
			: "openai";
	} catch {
		return "openai";
	}
};

// max_tokens is a required parameter on the Anthropic Messages API; when the
// resolution cascade yields nothing (0 = auto and no detected/manual limit)
// this fallback is sent so the request stays valid
export const DEFAULT_ANTHROPIC_MAX_TOKENS = 4096;

// OAuth access tokens (created via claude.ai / claude code login) use the
// Authorization header instead of x-api-key and need the oauth beta flag
export const isAnthropicOAuthKey = (apiKey: string): boolean =>
	apiKey.startsWith("sk-ant-oat");

export const ANTHROPIC_OAUTH_BETA = "oauth-2025-04-20";

// the Anthropic SDK builds /v1/messages on top of baseURL, so a "/v1" suffix
// (the usual convention for OpenAI-compatible endpoints) must be stripped to
// avoid /v1/v1/messages requests
export const normalizeAnthropicBaseURL = (
	baseURL: string,
): string | undefined => {
	if (!baseURL) return undefined;
	let normalized = baseURL.trim().replace(/\/+$/, "");
	if (normalized.endsWith("/v1")) {
		normalized = normalized.slice(0, -3);
	}
	return normalized || undefined;
};
