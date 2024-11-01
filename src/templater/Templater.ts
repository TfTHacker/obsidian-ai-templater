// Utility functions for interacting with the Templater plugin

/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- calling external library */
import { around } from "monkey-around";
import type AitPlugin from "../main";
import { InternalModuleAit } from "./InternalModuleAit";

export const initializeTemplaterInternalModule = async (
	plugin: AitPlugin,
): Promise<InternalModuleAit> => {
	return new Promise((resolve, reject) => {
		let retries = 30;
		const intervalId = setInterval(() => {
			const templater = plugin.app.plugins.getPlugin("templater-obsidian");
			if (templater) {
				clearInterval(intervalId);
				const internal_module = new InternalModuleAit(templater);
				internal_module.setPlugin(plugin);

				templater.templater.functions_generator.internal_functions.modules_array.push(
					internal_module,
				);
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
				clearInterval(intervalId);
				reject(new Error("Templater plugin not found after 30 seconds"));
			} else {
				retries--;
			}
		}, 1000);
	});
};

export const trackTemplater = (plugin: AitPlugin): void => {
	plugin.register(
		around(plugin.app.plugins, {
			enablePlugin(oldMethod) {
				return async function (pluginId) {
					if (pluginId === "templater-obsidian") {
						// eslint-disable-next-line @typescript-eslint/no-misused-promises -- setTimeout needs to be called async
						setTimeout(async () => {
							if (window.ait?.plugin)
								window.ait.plugin.internalModuleAit =
									await initializeTemplaterInternalModule(window.ait.plugin);
						}, 1000);
					}
					// @ts-expect-error - monkey-around ignore this
					return oldMethod.call(this, pluginId);
				};
			},
			disablePlugin(oldMethod) {
				return async function (pluginId) {
					if (pluginId === "templater-obsidian") {
						if (window.ait?.plugin) window.ait.plugin.internalModuleAit = null;
					}
					// @ts-expect-error - monkey-around ignore this
					return oldMethod.call(this, pluginId);
				};
			},
		}),
	);
};
