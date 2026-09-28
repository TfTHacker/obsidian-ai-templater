import type { App } from "obsidian";
import { Modal, Notice, Setting } from "obsidian";

// modal that asks for the vault password and verifies it by trying to
// decrypt one of the stored keys; on success the plugin keeps the derived
// key in memory for the rest of the session
export class PasswordModal extends Modal {
	private title: string;
	// true when no encrypted keys exist yet: asks to confirm the password
	private confirmMode: boolean;
	// returns true when the password was accepted
	private verify: (password: string) => Promise<boolean>;
	private errorEl: HTMLElement | null = null;

	constructor(
		app: App,
		title: string,
		verify: (password: string) => Promise<boolean>,
		options?: { confirmMode?: boolean },
	) {
		super(app);
		this.title = title;
		this.verify = verify;
		this.confirmMode = options?.confirmMode ?? false;
	}

	onOpen(): void {
		this.contentEl.empty();
		this.titleEl.setText(this.title);

		let password = "";
		let confirm = "";

		new Setting(this.contentEl).setName("Password").addText((text) => {
			text.inputEl.type = "password";
			text.setPlaceholder("Password");
			text.onChange((value) => {
				password = value;
				if (this.errorEl) {
					this.errorEl.setText("");
				}
			});
			text.inputEl.addEventListener("keydown", (event) => {
				if (event.key === "Enter") {
					event.preventDefault();
					void this.submit(password, confirm, () => this.close());
				}
			});
		});

		if (this.confirmMode) {
			new Setting(this.contentEl)
				.setName("Confirm password")
				.addText((text) => {
					text.inputEl.type = "password";
					text.setPlaceholder("Repeat password");
					text.onChange((value) => {
						confirm = value;
						if (this.errorEl) {
							this.errorEl.setText("");
						}
					});
					text.inputEl.addEventListener("keydown", (event) => {
						if (event.key === "Enter") {
							event.preventDefault();
							void this.submit(password, confirm, () => this.close());
						}
					});
				});
		}

		this.errorEl = this.contentEl.createDiv({ cls: "ait-unlock-error" });

		new Setting(this.contentEl)
			.addButton((button) => {
				button
					.setButtonText(this.confirmMode ? "Set password" : "Unlock")
					.setCta()
					.onClick(() => {
						void this.submit(password, confirm, () => this.close());
					});
			})
			.addButton((button) => {
				button.setButtonText("Cancel").onClick(() => this.close());
			});
	}

	private async submit(
		password: string,
		confirm: string,
		onSuccess: () => void,
	): Promise<void> {
		if (!password) return;
		if (this.confirmMode && password !== confirm) {
			if (this.errorEl) this.errorEl.setText("Passwords do not match.");
			new Notice("Passwords do not match.", 5000);
			return;
		}
		const ok = await this.verify(password);
		if (ok) {
			onSuccess();
		} else {
			new Notice("Wrong password.", 5000);
		}
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
