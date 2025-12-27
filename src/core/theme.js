export class Theme {
	constructor({
		background = "#161b22",
		border = "#30363d",
		text = "#c9d1d9",
		textSecondary = "#8b949e",
		accent = "#58a6ff",
	} = {}) {
		this.background = background
		this.border = border
		this.text = text
		this.textSecondary = textSecondary
		this.accent = accent
	}

	static dark() {
		return new Theme()
	}

	static light() {
		return new Theme({
			background: "#f6f8fa",
			border: "#d0d7de",
			text: "#24292f",
			textSecondary: "#57606a",
			accent: "#0969da",
		})
	}
}

export const themes = {
	dark: Theme.dark(),
	light: Theme.light(),
}
