import { Plugin } from "obsidian";
import { setupAitApi } from "./open_ai/AitApi";
import OpenAiApi from "./open_ai/OpenAiClientLibrary";
import { OWlSettingTab } from "./settings/SettingsTab";
import type { Settings } from "./settings/settings";
import { DEFAULT_SETTINGS } from "./settings/settings";
import type { InternalModuleAit } from "./templater/InternalModuleAit";
import {
	initializeTemplaterInternalModule,
	trackTemplater,
} from "./templater/Templater";

export default class AitPlugin extends Plugin {
	APP_NAME = this.manifest.name;
	APP_ID = this.manifest.id;
	APP_ABBREVIARTION = "AIT";
	openAiApi!: OpenAiApi;
	internalModuleAit!: InternalModuleAit | null;
	settings: Settings = DEFAULT_SETTINGS;

	async onload() {
		console.log(`loading ${this.APP_NAME}`);
		await this.loadSettings();
		this.addSettingTab(new OWlSettingTab(this.app, this));
		this.openAiApi = new OpenAiApi(this);
		setupAitApi(this);

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
		console.log(`unloading ${this.APP_NAME}`);
	}

	async loadSettings(): Promise<void> {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Obsidian loadData is set to return Any
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	log = (logDescription: string, ...outputs: unknown[]): void => {
		console.log(`${this.APP_ABBREVIARTION}: ${logDescription}`, outputs);
	};
}
