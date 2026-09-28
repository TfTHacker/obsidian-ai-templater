import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";
import console from "console";
import fs from "fs";
import path from "path";

const prod = process.argv[2] === "production";

// optional deploy target: when AIT_OUT_DIR is set, every build (including
// esbuild watch rebuilds) copies main.js, manifest.json and styles.css to
// that directory, so a plugin installed in a test Obsidian vault stays up
// to date without manual copying (e.g. "npm run dev:vault")
const deployDir = process.env.AIT_OUT_DIR;
const deployPlugin = {
	name: "ait-deploy",
	setup(build) {
		build.onEnd(() => {
			if (!deployDir) return;
			if (!fs.existsSync(deployDir)) {
				console.log(`AIT deploy: target directory not found: ${deployDir}`);
				return;
			}
			for (const file of ["main.js", "manifest.json", "styles.css"]) {
				fs.copyFileSync(file, path.join(deployDir, file));
			}
			console.log(`AIT deploy: artifacts copied to ${deployDir}`);
		});
	},
};

const originalEmit = process.emit;
process.emit = function (name, data, ...args) {
	if (
		name === `warning` &&
		typeof data === `object` &&
		data.name === `ExperimentalWarning`
		//if you want to only stop certain messages, test for the message here:
		//&& data.message.includes(`Fetch API`)
	) {
		return false;
	}
	return originalEmit.apply(process, arguments);
};

const context = await esbuild.context({
	plugins: [deployPlugin],
	entryPoints: ["src/main.ts"],
	tsconfig: "tsconfig.build.json",
	bundle: true,
	external: [
		"obsidian",
		"electron",
		"@codemirror/autocomplete",
		"@codemirror/collab",
		"@codemirror/commands",
		"@codemirror/language",
		"@codemirror/lint",
		"@codemirror/search",
		"@codemirror/state",
		"@codemirror/view",
		"@lezer/common",
		"@lezer/highlight",
		"@lezer/lr",
		...builtins,
	],
	format: "cjs",
	target: "es2018",
	logLevel: "info",
	sourcemap: prod ? false : "inline",
	treeShaking: true,
	outfile: "main.js",
});

if (prod) {
	console.log("Building for production");
	await context.rebuild();
	process.exit(0);
} else {
	await context.watch();
}
