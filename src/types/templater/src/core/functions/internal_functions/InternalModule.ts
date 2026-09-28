export abstract class InternalModule {
	declare name: string;
	declare static_functions: Map<string, unknown>;
	declare dynamic_functions: Map<string, unknown>;
	declare config: { target_file: unknown };
	protected declare plugin: unknown;

	constructor(plugin: unknown) {
		this.plugin = plugin;
	}

	abstract create_static_templates(): Promise<void>;
	abstract create_dynamic_templates(): Promise<void>;
	abstract teardown(): Promise<void>;

	async init(): Promise<void> {}
}
