// Convenience class for building chat messages array for use with OpenAI's chat completions API
// sample end result of chatMessages array in use:
// const completion = await openai.chat.completions.create({
//   messages: [{“role”: “system”, “content”: “You are a helpful assistant.”},
//       {“role”: “user”, “content”: “Who won the world series in 2020?”},
//       {“role”: “assistant”, “content”: “The Los Angeles Dodgers won the World Series in 2020.”},
//       {“role”: “user”, “content”: “Where was it played?”}],
//   model: “gpt-3.5-turbo”,
// });

export default class ChatBuilder {
	public chatMessages: { role: string; content: string }[] = [];

	constructor(systemMessage = "You are a helpful assistant.") {
		this.chatMessages.push({ role: "system", content: systemMessage });
	}

	setSystemMessage(content: string) {
		// If a system message already exists, overwrite it
		this.chatMessages[0].content = content;
		return this;
	}

	addUserInput(content: string) {
		if (
			this.chatMessages.length === 0 ||
			this.chatMessages[this.chatMessages.length - 1].role !== "user"
		) {
			this.chatMessages.push({ role: "user", content });
		} else {
			throw new Error("Cannot add two user inputs in a row");
		}
		return this;
	}

	addAssistantReply(content: string) {
		if (
			this.chatMessages.length === 0 ||
			this.chatMessages[this.chatMessages.length - 1].role !== "assistant"
		) {
			this.chatMessages.push({ role: "assistant", content });
		} else {
			throw new Error("Cannot add two assistant replies in a row");
		}
		return this;
	}
}
