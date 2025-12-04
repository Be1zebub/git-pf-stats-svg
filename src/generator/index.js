import { GitHubAPI } from "../core/github-api.js"
import { Stats } from "../core/stats.js"
import { Theme } from "../core/theme.js"
import { SVGGenerator } from "./svg-generator.js"

const TOKEN = process.env.GITHUB_TOKEN
const USERNAME = process.env.GITHUB_USERNAME

async function generate(options) {
	const start = performance.now()

	let statsData

	if (options.mock) {
		statsData = Stats.mock()
	} else {
		if (!TOKEN || !USERNAME) {
			throw new Error("GITHUB_TOKEN and GITHUB_USERNAME required")
		}

		const api = new GitHubAPI(TOKEN, USERNAME)
		const data = await api.fetchStats()
		statsData = new Stats(data)
	}

	const theme = options.light ? Theme.light() : Theme.dark()
	const generator = new SVGGenerator(statsData, theme)
	const svg = generator.generate()

	const time = (performance.now() - start).toFixed(2)
	return { svg, time }
}

process.on("message", async (msg) => {
	if (msg.type === "generate") {
		try {
			const result = await generate(msg.options)
			process.send({ type: "svg", id: msg.id, ...result })
		} catch (error) {
			process.send({ type: "error", id: msg.id, message: error.message })
		}
	}
})

process.send({ type: "ready" })
