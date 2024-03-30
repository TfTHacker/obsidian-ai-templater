# Description
Analyzes the contents of the current file, not including the properties and creates a very short summary of the note. This summary is then put into a property in the note called *Summary*.

This code first loads another file that has the prompt to be used. In some cases I like to put prompts into a simple markdown file so I cna refine the prompt without having to touch the template code. It makes it easier to refine the prompt without accidently breaking the code.

# Template Code
```javascript
<%*
const file_with_prompt = tp.file.find_tfile("SummarizeNote");
let ai_prompt = await app.vault.read(file_with_prompt);
let ai_response = await tp.ai.chat(ai_prompt + tp.file.content)

tp.hooks.on_all_templates_executed(async () => { 
	const this_file = tp.file.find_tfile(tp.file.path(true)); 
	await app.fileManager.processFrontMatter(this_file, (frontmatter) => { 
		frontmatter["Summary"] = ai_response; 
	}); 
});
%>
```

# Prompt 
```markdown
Summarize the following text in a factual paragraph in 25 words or less, focusing solely on key points and their interrelations without any introductions or attributions. Do not mention any names of individuals in the output. Do NOT mention if it is a briefing, meeting, discussion, or document. Keep it to 25 words or less.  Text to summarize:
```