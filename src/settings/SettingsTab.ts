import type { App, ToggleComponent } from "obsidian";
import { PluginSettingTab, Setting } from "obsidian";
import type AitPlugin from "../main";
import { promotionalLinks } from "./Promotional";

export class OWlSettingTab extends PluginSettingTab {
	plugin: AitPlugin;

	constructor(app: App, plugin: AitPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Endpoint")
			.setDesc(
				`The default endpoint for the AI service. Leave this field blank to use the default OpenAI endpoint. 
         Otherwise provide an OpenAI API compatible endpoint. For example: https://openrouter.ai/api/v1/`,
			)
			.setClass("ait-settings")
			.addText((text) => {
				text
					.setValue(this.plugin.settings.defaultEndpoint)
					.onChange(async (value) => {
						this.plugin.settings.defaultEndpoint = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("API Key")
			.setDesc("The API Key for accessing the AI endpoint.")
			.setClass("ait-settings")
			.addText((text) => {
				setPasswordOnBlur(text.inputEl);
				text
					.setValue(this.plugin.settings.defaultApiKey)
					.onChange(async (value) => {
						this.plugin.settings.defaultApiKey = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Model")
			.setDesc("Name of language model to use.")
			.setClass("ait-settings")
			.addText((text) => {
				text
					.setValue(this.plugin.settings.defaultModel)
					.onChange(async (value) => {
						this.plugin.settings.defaultModel = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Max tokens per request")
			.setDesc(
				`Maximum number of tokens the AI can generate. This is a safety feature to prevent the AI from 
        running indefinitely. It also helps in managing costs.`,
			)
			.setClass("ait-settings")
			.addText((text) => {
				text
					.setValue(this.plugin.settings.defaultMaxNumTokens.toString())
					.onChange(async (value) => {
						this.plugin.settings.defaultMaxNumTokens = Number.parseInt(value);
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Max characters per outgoing request")
			.setDesc(
				`Each model calculates tokens differently. This setting controls how many characters can be sent 
        before a function call fails. This is not the same as token count, but is a safety measure to 
        prevent large amounts of text being sent and potentially large costs being incurred.`,
			)
			.setClass("ait-settings")
			.addText((text) => {
				text
					.setValue(
						this.plugin.settings.defaultMaxOutgoingCharacters.toString(),
					)
					.onChange(async (value) => {
						this.plugin.settings.defaultMaxOutgoingCharacters =
							Number.parseInt(value);
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("System message")
			.setDesc(
				"Default system message sent with each prompt. This message is used to initialize the conversation.",
			)
			.setClass("ait-settings")
			.addTextArea((textEl) => {
				textEl
					.setValue(this.plugin.settings.defaultSystemMessage || "")
					.onChange(async (value) => {
						this.plugin.settings.defaultSystemMessage = value;
						await this.plugin.saveData(this.plugin.settings);
					});
				textEl.inputEl.rows = 6;
			});

		promotionalLinks(containerEl);
		containerEl.createEl("hr");

		new Setting(containerEl).setName("Debugging").setHeading();

		new Setting(containerEl)
			.setName("Debug to the console")
			.setDesc("Dumps detailed into to the console for debugging.")
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.plugin.settings.debugToConsole ?? false);
				cb.onChange(async (value: boolean) => {
					this.plugin.settings.debugToConsole = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Display token usage on desktop")
			.setDesc(
				`Displays the number of tokens used a notification on the desktop. Message format is prompt 
         tokens/completion tokens/total tokens. So it will look something like:  45/100/145.`,
			)
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.plugin.settings.displayTokenUsageDesktop ?? false);
				cb.onChange(async (value: boolean) => {
					this.plugin.settings.displayTokenUsageDesktop = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Display token usage on mobile")
			.setDesc(
				"Displays the  number of tokens used a notification on the mobile.",
			)
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.plugin.settings.displayTokenUsageMobile ?? false);
				cb.onChange(async (value: boolean) => {
					this.plugin.settings.displayTokenUsageMobile = value;
					await this.plugin.saveSettings();
				});
			});
	}
}

// Thank you chhoumann for this code
// https://github.com/chhoumann/quickadd/blob/master/src/utils/setPasswordOnBlur.ts
function setPasswordOnBlur(el: HTMLInputElement) {
	el.addEventListener("focus", () => {
		el.type = "text";
	});

	el.addEventListener("blur", () => {
		el.type = "password";
	});

	el.type = "password";
}
