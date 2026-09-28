// creates and removes a visual indicator element that is appended to the active workspace leaf's view header
// provides user feedback that the plugin is working on a AI task

class ActivityIndicator {
	private spinner: HTMLElement | null = null;
	private timerId: number | null = null;

	add(): void {
		// built with standard DOM APIs and fully wrapped: the spinner is
		// cosmetic and must never break a chat call (Obsidian's
		// Document.createDiv helper has shown version-dependent append
		// behavior that can abort template runs)
		try {
			const spinner = activeDocument.createElement("div");
			spinner.className = "ait-spinner";

			// Create the child divs
			const bounceDelays = ["-0.42s", "-0.36s", "-0.16s", "0s"];
			for (const delay of bounceDelays) {
				const bounce = activeDocument.createElement("div");
				bounce.className = "oil-bounce";
				bounce.style.setProperty("--bounce-delay", delay);
				spinner.appendChild(bounce);
			}

			// Append the spinner to the active workspace leaf's view header
			const activeViewHeader = activeDocument.querySelector(
				".workspace-leaf.mod-active .cm-scroller",
			);
			if (activeViewHeader) activeViewHeader.after(spinner);
			this.spinner = spinner;

			// Remove the spinner after a brief period in case the task gets stuck
			this.timerId = activeWindow.setTimeout(() => {
				this.remove();
			}, 120000);
		} catch (error) {
			console.log("ActivityIndicator: failed to attach spinner", error);
		}
	}

	remove(): void {
		// Clear the timer if it's still running
		if (this.timerId) {
			activeWindow.clearTimeout(this.timerId);
			this.timerId = null;
		}

		// Remove the spinner
		if (this.spinner) {
			this.spinner.remove();
			this.spinner = null;
		}
	}
}

export default ActivityIndicator;
