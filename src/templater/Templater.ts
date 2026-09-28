// Utility functions for interacting with the Templater plugin

import { around } from "monkey-around";
import type { App } from "obsidian";
import type AitPlugin from "../main";
import { InternalModuleAit } from "./InternalModuleAit";

type ObsidianPlugins = {
	enablePlugin: (id: string) => Promise<void>;
	disablePlugin: (id: string) => Promise<void>;
	getPlugin: (id: string) => unknown;
};

type TemplaterPluginLike = {
	templater: {
		functions_generator: {
			internal_functions: {
				modules_array: unknown[];
			};
		};
	};
};

export const initializeTemplaterInternalModule = async (
	plugin: AitPlugin,
): Promise<InternalModuleAit> => {
	return new Promise((resolve, reject) => {
		let retries = 30;
		const intervalId = activeWindow.setInterval(() => {
			const templater = (
				plugin.app as App & { plugins: ObsidianPlugins }
			).plugins.getPlugin("templater-obsidian") as TemplaterPluginLike;
			if (templater) {
				activeWindow.clearInterval(intervalId);
				const internal_module = new InternalModuleAit(templater);
				internal_module.setPlugin(plugin);

				// hot-reload re-runs this on every plugin reload; retire any
				// previous ai module first so Templater does not accumulate
				// duplicates
				const modules_array =
					templater.templater.functions_generator.internal_functions
						.modules_array;
				const previousIndex = modules_array.findIndex(
					(module) => (module as { name?: unknown })?.name === "ai",
				);
				if (previousIndex > -1) {
					const previous = modules_array[previousIndex] as
						| { teardown?: () => Promise<void> }
						| undefined;
					void previous?.teardown?.();
					modules_array.splice(previousIndex, 1);
				}
				modules_array.push(internal_module);
				internal_module
					.init()
					.then(() => {
						resolve(internal_module);
					})
					.catch((error: unknown) => {
						if (error instanceof Error) {
							console.error(
								"Error initializing internal module:",
								error.message,
							);
							reject(error);
						} else {
							console.error("Caught an unknown error:", error);
							reject(new Error("Caught an unknown error"));
						}
					});
			} else if (retries === 0) {
				activeWindow.clearInterval(intervalId);
				reject(new Error("Templater plugin not found after 30 seconds"));
			} else {
				retries--;
			}
		}, 1000);
	});
};

export const trackTemplater = (plugin: AitPlugin): void => {
	plugin.register(
		around((plugin.app as App & { plugins: ObsidianPlugins }).plugins, {
			enablePlugin(oldMethod: (id: string) => Promise<void>) {
				return async function (this: unknown, pluginId: string) {
					if (pluginId === "templater-obsidian") {
						activeWindow.setTimeout(async () => {
							if (window.ait?.plugin)
								window.ait.plugin.internalModuleAit =
									await initializeTemplaterInternalModule(window.ait.plugin);
						}, 1000);
					}
					return oldMethod.call(this, pluginId);
				};
			},
			disablePlugin(oldMethod: (id: string) => Promise<void>) {
				return async function (this: unknown, pluginId: string) {
					if (pluginId === "templater-obsidian") {
						if (window.ait?.plugin) window.ait.plugin.internalModuleAit = null;
					}
					return oldMethod.call(this, pluginId);
				};
			},
		}),
	);
};
