import { TFile } from "obsidian";
import type { ChatCompletionMessageParam } from "openai/resources";
import { InternalModule } from "templater-obsidian/src/core/functions/internal_functions/InternalModule";
import type { ModuleName } from "templater-obsidian/src/editor/TpDocumentation";
import type AitPlugin from "../main";
import ActivityIndicator from "../utils/ActivityIndicator";

// Integration module to add custom commands to Templater
// This file using an interface from another library, so some eslint checks need to be disabled.

export class InternalModuleAit extends InternalModule {
	// @ts-expect-error -- adding internal module to templater
	public name: ModuleName = "ai";
	plugin: AitPlugin | undefined;

	setPlugin = (plugin: AitPlugin) => {
		this.plugin = plugin;
	};

	async create_static_templates(): Promise<void> {
		this.static_functions.set(
			"selection_or_nearest",
			this.generate_selection_or_nearest(),
		);
		this.static_functions.set("chat", this.generate_run_chat());
	}

	async create_dynamic_templates(): Promise<void> {
		this.dynamic_functions.set(
			"content_without_properties",
			await this.generate_content_without_properties(),
		);
	}

	async teardown(): Promise<void> {}

	generate_selection_or_nearest(): () => string {
		return () => {
			const active_editor = this.plugin?.app.workspace.activeEditor;
			if (!active_editor?.editor) {
				throw new Error("Active editor is null, can't read selection.");
			}
			const { editor } = active_editor;
			let selection = editor.getSelection();
			if (!selection) {
				const { line } = editor.getCursor();
				selection = editor.getLine(line);
				editor.setSelection({ line, ch: 0 }, { line, ch: selection.length });
			}
			return selection;
		};
	}

	async generate_content_without_properties(): Promise<string> {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- target_file is a valid property
		if (this.config.target_file instanceof TFile) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access -- target_file is a valid property
			const file = this.config.target_file;
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- target_file is a valid property
			const fileContents = await this.plugin?.app.vault.read(file);
			return fileContents
				? fileContents.replace(/^---\n([\s\S]*?)\n---\n/, "")
				: "";
		}
		throw new Error("target_file is not a TFile");
	}

	generate_run_chat(): (
		promptOrMessages: string | ChatCompletionMessageParam[],
		model?: string,
		systemMessage?: string,
		maxTokens?: number,
		maxOutgoingCharacters?: number,
		baseURL?: string | null,
		apiKey?: string,
		organization?: string | null,
	) => Promise<string> {
		return async (
			promptOrMessages: string | ChatCompletionMessageParam[],
			model?: string,
			systemMessage?: string,
			maxTokens?: number,
			maxOutgoingCharacters?: number,
			baseURL?: string | null,
			apiKey?: string,
			organization?: string | null,
		) => {
			const spinner = new ActivityIndicator();
			spinner.add();
			try {
				const result =
					(await this.plugin?.openAiApi.chat(
						promptOrMessages,
						model,
						systemMessage,
						maxTokens,
						maxOutgoingCharacters,
						baseURL,
						apiKey,
						organization,
					)) ?? "No result";
				spinner.remove();
				return result;
			} catch (error) {
				console.log("Error in generate_run_chat", error);
				spinner.remove();
				return "";
			}
		};
	}
}
