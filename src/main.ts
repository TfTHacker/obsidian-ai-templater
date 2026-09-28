import { Notice, Plugin } from "obsidian";
import { setupAitApi } from "./open_ai/AitApi";
import OpenAiApi from "./open_ai/OpenAiClientLibrary";
import { OWlSettingTab } from "./settings/SettingsTab";
import type {
	ModelLimit,
	SavedEndpoint,
	SavedModelList,
	Settings,
} from "./settings/settings";
import {
	DEFAULT_SETTINGS,
	mergeModels,
	sanitizeApiType,
	savedModelListFor,
} from "./settings/settings";
import type { InternalModuleAit } from "./templater/InternalModuleAit";
import {
	initializeTemplaterInternalModule,
	trackTemplater,
} from "./templater/Templater";
import { decrypt, deriveKey, encrypt, isEncrypted } from "./utils/Crypto";
import { PasswordModal } from "./utils/PasswordModal";

const OPENAI_DEFAULT_ENDPOINT = "https://api.openai.com/v1/";

// keeps only valid entries of a persisted limits record
const sanitizeLimits = (raw: unknown): Record<string, ModelLimit> => {
	const result: Record<string, ModelLimit> = {};
	const positive = (value: unknown): number | undefined =>
		typeof value === "number" && Number.isFinite(value) && value > 0
			? value
			: undefined;
	if (typeof raw === "object" && raw !== null) {
		for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
			if (typeof key === "string" && key && typeof value === "object") {
				const limit = value as {
					contextLength?: unknown;
					maxCompletionTokens?: unknown;
					fetchedAt?: unknown;
				};
				result[key] = {
					contextLength: positive(limit.contextLength),
					maxCompletionTokens: positive(limit.maxCompletionTokens),
					fetchedAt:
						typeof limit.fetchedAt === "number" ? limit.fetchedAt : undefined,
				};
			}
		}
	}
	return result;
};

// keeps only the manual max token values persisted from the settings UI
const sanitizeManualLimits = (raw: unknown): Record<string, number> => {
	const result: Record<string, number> = {};
	if (typeof raw === "object" && raw !== null) {
		for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
			if (
				typeof key === "string" &&
				key &&
				typeof value === "number" &&
				Number.isFinite(value) &&
				value > 0
			) {
				result[key] = value;
			}
		}
	}
	return result;
};

export default class AitPlugin extends Plugin {
	APP_NAME = this.manifest.name;
	APP_ID = this.manifest.id;
	APP_ABBREVIARTION = "AIT";
	openAiApi!: OpenAiApi;
	internalModuleAit!: InternalModuleAit | null;
	settings: Settings = DEFAULT_SETTINGS;

	// session unlock state: the AES-GCM key derived from the user password
	// lives only in memory; it is never persisted
	unlockKey: CryptoKey | null = null;

	async onload() {
		new Notice(`loading ${this.APP_NAME}`);
		await this.loadSettings();
		this.addSettingTab(new OWlSettingTab(this.app, this));
		this.openAiApi = new OpenAiApi(this);
		setupAitApi(this);

		this.addCommand({
			id: "unlock-api-keys",
			name: "Unlock API keys",
			callback: () => {
				this.promptUnlock();
			},
		});

		this.promptUnlockIfEncryptedKeys();

		this.app.workspace.onLayoutReady(async () => {
			trackTemplater(this);
			try {
				this.internalModuleAit = await initializeTemplaterInternalModule(this);
			} catch (error) {
				console.error("Error initializing internal module:", error);
			}
		});
	}

	onunload() {
		new Notice(`unloading ${this.APP_NAME}`);
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

		// 0 = auto (model maximum / omit the field); guard against invalid data
		if (!Number.isFinite(this.settings.defaultMaxNumTokens)) {
			this.settings.defaultMaxNumTokens = 0;
		}

		const rawEndpoints: unknown = this.settings.savedEndpoints;
		const endpoints: SavedEndpoint[] = [];
		if (Array.isArray(rawEndpoints)) {
			for (const raw of rawEndpoints) {
				let value = "";
				let alias = "";
				let apiKey = "";
				let apiType: unknown = "auto";
				if (typeof raw === "string") {
					value = raw;
				} else if (typeof raw === "object" && raw !== null) {
					const entry = raw as {
						value?: unknown;
						alias?: unknown;
						apiKey?: unknown;
						apiType?: unknown;
					};
					if (typeof entry.value === "string") value = entry.value;
					if (typeof entry.alias === "string") alias = entry.alias;
					if (typeof entry.apiKey === "string") apiKey = entry.apiKey;
					apiType = entry.apiType;
				}
				if (value && !endpoints.some((item) => item.value === value)) {
					endpoints.push({
						value,
						alias,
						apiKey,
						apiType: sanitizeApiType(apiType),
					});
				}
			}
		}
		this.settings.savedEndpoints = endpoints;

		// migration: savedModels used to be string[] (global list); now it is a
		// SavedModelList[] with one list per endpoint. Legacy entries are linked
		// to the active endpoint.
		const rawModelLists: unknown = this.settings.savedModels;
		const modelLists: SavedModelList[] = [];
		const legacyModels: string[] = [];
		if (Array.isArray(rawModelLists)) {
			for (const raw of rawModelLists) {
				if (typeof raw === "string") {
					if (raw) legacyModels.push(raw);
				} else if (typeof raw === "object" && raw !== null) {
					const entry = raw as {
						endpoint?: unknown;
						models?: unknown;
						fetchedAt?: unknown;
						limits?: unknown;
						manualLimits?: unknown;
					};
					if (
						typeof entry.endpoint === "string" &&
						Array.isArray(entry.models)
					) {
						const models = [
							...new Set(
								entry.models.filter(
									(model): model is string =>
										typeof model === "string" && Boolean(model),
								),
							),
						];
						const sanitizedLimits = sanitizeLimits(entry.limits);
						const sanitizedManualLimits = sanitizeManualLimits(
							entry.manualLimits,
						);
						const hasExtraData =
							Object.keys(sanitizedLimits).length > 0 ||
							Object.keys(sanitizedManualLimits).length > 0;
						if (modelLists.some((list) => list.endpoint === entry.endpoint)) {
							const existing = modelLists.find(
								(list) => list.endpoint === entry.endpoint,
							);
							if (existing) {
								existing.models = mergeModels(existing.models, models);
								existing.limits = hasExtraData
									? { ...(existing.limits ?? {}), ...sanitizedLimits }
									: existing.limits;
								existing.manualLimits = hasExtraData
									? {
											...(existing.manualLimits ?? {}),
											...sanitizedManualLimits,
										}
									: existing.manualLimits;
							}
						} else {
							modelLists.push({
								endpoint: entry.endpoint,
								models,
								fetchedAt:
									typeof entry.fetchedAt === "number"
										? entry.fetchedAt
										: undefined,
								...(hasExtraData && {
									limits: sanitizedLimits,
									manualLimits: sanitizedManualLimits,
								}),
							});
						}
					}
				}
			}
		}
		if (legacyModels.length > 0) {
			const legacyEndpoint = this.settings.defaultEndpoint || "";
			const existing = modelLists.find(
				(list) => list.endpoint === legacyEndpoint,
			);
			if (existing) {
				existing.models = mergeModels(existing.models, legacyModels);
			} else {
				modelLists.push({
					endpoint: legacyEndpoint,
					models: [...new Set(legacyModels)],
				});
			}
		}
		this.settings.savedModels = modelLists;

		if (
			this.settings.defaultEndpoint &&
			!endpoints.some((item) => item.value === this.settings.defaultEndpoint)
		) {
			endpoints.push({
				value: this.settings.defaultEndpoint,
				alias: "",
				apiKey: "",
				apiType: "auto",
			});
		}
		if (this.settings.defaultEndpoint) {
			const activeEndpoint = endpoints.find(
				(item) => item.value === this.settings.defaultEndpoint,
			);
			if (activeEndpoint && !activeEndpoint.apiKey) {
				activeEndpoint.apiKey = this.settings.defaultApiKey;
			}
		} else {
			const legacyOpenAiKey = (
				this.settings as { defaultOpenAiApiKey?: unknown }
			).defaultOpenAiApiKey;
			const legacyKey =
				typeof legacyOpenAiKey === "string" && legacyOpenAiKey
					? legacyOpenAiKey
					: this.settings.defaultApiKey;
			if (legacyKey) {
				const openAiEndpoint = endpoints.find(
					(item) => item.value === OPENAI_DEFAULT_ENDPOINT,
				);
				if (openAiEndpoint) {
					if (!openAiEndpoint.apiKey) openAiEndpoint.apiKey = legacyKey;
				} else {
					endpoints.push({
						value: OPENAI_DEFAULT_ENDPOINT,
						alias: "OpenAI",
						apiKey: legacyKey,
						apiType: "auto",
					});
				}
				this.settings.defaultEndpoint = OPENAI_DEFAULT_ENDPOINT;
				this.settings.defaultApiKey = legacyKey;
			}
		}
		if (this.settings.defaultModel) {
			const activeList = modelLists.find(
				(list) => list.endpoint === (this.settings.defaultEndpoint || ""),
			);
			if (
				activeList &&
				!activeList.models.includes(this.settings.defaultModel)
			) {
				activeList.models.push(this.settings.defaultModel);
			}
		}

		await this.saveSettings();
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// true when there is at least one encrypted key stored
	hasEncryptedKeys(): boolean {
		return (
			isEncrypted(this.settings.defaultApiKey) ||
			this.settings.savedEndpoints.some((entry) => isEncrypted(entry.apiKey))
		);
	}

	// true when there is at least one plaintext (not yet encrypted) key
	hasPlaintextKeys(): boolean {
		const hasValue = (apiKey: string): boolean => Boolean(apiKey);
		return (
			hasValue(this.settings.defaultApiKey) ||
			this.settings.savedEndpoints.some((entry) => hasValue(entry.apiKey))
		);
	}

	isUnlocked(): boolean {
		return this.unlockKey !== null;
	}

	// shows the unlock/set-password modal when there are keys to protect
	// (encrypted or still in plaintext) and the session is not unlocked yet
	promptUnlockIfEncryptedKeys(): void {
		if (
			(this.hasEncryptedKeys() || this.hasPlaintextKeys()) &&
			!this.isUnlocked()
		) {
			this.promptUnlock();
		}
	}

	promptUnlock(): void {
		// with encrypted keys the password is verified by decrypting one;
		// with only plaintext keys this is the first run and the password
		// being set becomes the session key
		const settingPassword = !this.hasEncryptedKeys();
		new PasswordModal(
			this.app,
			settingPassword
				? `${this.APP_NAME}: set a password to protect your API keys`
				: `${this.APP_NAME}: unlock API keys`,
			async (password) => {
				const key = await deriveKey(password, new Uint8Array(16));
				const sample = this.firstEncryptedKey();
				if (sample) {
					try {
						await decrypt(sample, key);
					} catch {
						return false;
					}
				}
				this.unlockKey = key;
				new Notice(
					settingPassword
						? `${this.APP_ABBREVIARTION}: password set. API keys are now encrypted.`
						: `${this.APP_ABBREVIARTION}: API keys unlocked.`,
					4000,
				);
				// migrate any plaintext keys now that we have the session key
				await this.encryptPlaintextKeys();
				return true;
			},
			{ confirmMode: settingPassword },
		).open();
	}

	// first encrypted blob found, used to verify the password
	private firstEncryptedKey(): string | null {
		if (isEncrypted(this.settings.defaultApiKey)) {
			return this.settings.defaultApiKey;
		}
		const entry = this.settings.savedEndpoints.find((item) =>
			isEncrypted(item.apiKey),
		);
		return entry ? entry.apiKey : null;
	}

	// encrypts every key still stored in plaintext (legacy migration or keys
	// saved while locked). No-op when the session is locked.
	async encryptPlaintextKeys(): Promise<void> {
		if (!this.unlockKey) return;
		let changed = false;
		const encryptIfNeeded = async (apiKey: string): Promise<string> => {
			if (!apiKey || isEncrypted(apiKey)) return apiKey;
			changed = true;
			return encrypt(apiKey, this.unlockKey as CryptoKey);
		};
		for (const endpoint of this.settings.savedEndpoints) {
			endpoint.apiKey = await encryptIfNeeded(endpoint.apiKey);
		}
		this.settings.defaultApiKey = await encryptIfNeeded(
			this.settings.defaultApiKey,
		);
		if (changed) {
			await this.saveSettings();
		}
	}

	// returns the decrypted key for the given endpoint, or null when the
	// session is locked or the value cannot be decrypted
	async decryptKeyFor(endpoint: string): Promise<string | null> {
		const entry = this.settings.savedEndpoints.find(
			(item) => item.value === endpoint,
		);
		const apiKey = entry?.apiKey ?? this.settings.defaultApiKey;
		if (!apiKey) return "";
		if (!isEncrypted(apiKey)) return apiKey; // plaintext (migration pending)
		if (!this.unlockKey) return null;
		try {
			return await decrypt(apiKey, this.unlockKey);
		} catch (error) {
			this.log("decryptKeyFor", "failed to decrypt key", error);
			return null;
		}
	}

	// encrypts a plaintext key with the session key; returns the input
	// unchanged when there is nothing to encrypt or the session is locked
	async encryptKey(apiKey: string): Promise<string> {
		if (!apiKey || isEncrypted(apiKey) || !this.unlockKey) return apiKey;
		return encrypt(apiKey, this.unlockKey);
	}

	// stores the token limits reported by an endpoint for its models; called
	// after a models fetch. The models list itself is managed by the caller.
	async saveModelLimits(
		endpoint: string,
		limits: Record<string, ModelLimit>,
	): Promise<void> {
		if (!endpoint || Object.keys(limits).length === 0) return;
		let list = savedModelListFor(this.settings.savedModels, endpoint);
		if (!list) {
			list = { endpoint, models: [] };
			this.settings.savedModels.push(list);
		}
		list.limits = { ...(list.limits ?? {}), ...limits };
		await this.saveSettings();
	}

	// stores the manually entered max token value for a model on the active
	// endpoint (informational only). Passing undefined removes the entry.
	async saveManualMaxTokens(
		endpoint: string,
		model: string,
		maxTokens: number | undefined,
	): Promise<void> {
		if (!endpoint || !model) return;
		const existing = savedModelListFor(this.settings.savedModels, endpoint);
		if (!existing) {
			if (maxTokens === undefined) return;
			this.settings.savedModels.push({
				endpoint,
				models: [model],
				manualLimits: { [model]: maxTokens },
			});
		} else {
			existing.manualLimits = { ...(existing.manualLimits ?? {}) };
			if (maxTokens === undefined) {
				delete existing.manualLimits[model];
			} else {
				existing.manualLimits[model] = maxTokens;
			}
		}
		await this.saveSettings();
	}

	// resolves the max_completion_tokens value for a request using this
	// cascade: explicit argument (template call) > manual setting (>0) >
	// maximum detected for the model > 0 (= omit the field, provider default)
	resolveMaxTokens(
		explicit?: number | null,
		baseURL?: string | null,
		model?: string | null,
	): number {
		if (explicit !== undefined && explicit !== null && explicit > 0) {
			return explicit;
		}
		const manual = this.settings.defaultMaxNumTokens;
		if (Number.isFinite(manual) && manual > 0) return manual;
		const endpoint = baseURL || this.settings.defaultEndpoint;
		const modelName = model ?? this.settings.defaultModel;
		const list = savedModelListFor(this.settings.savedModels, endpoint);
		const limit = list?.limits?.[modelName];
		const detected = limit?.maxCompletionTokens ?? limit?.contextLength;
		return detected !== undefined && detected > 0 ? detected : 0;
	}

	// maximum detected for a model on the active endpoint, for display in the
	// settings UI (0 when unknown)
	detectedMaxTokensFor(endpoint: string, model: string): number {
		const limit = savedModelListFor(this.settings.savedModels, endpoint)
			?.limits?.[model];
		const detected = limit?.maxCompletionTokens ?? limit?.contextLength;
		return detected !== undefined && detected > 0 ? detected : 0;
	}

	log = (logDescription: string, ...outputs: unknown[]): void => {
		console.log(`${this.APP_ABBREVIARTION}: ${logDescription}`, outputs);
	};
}
