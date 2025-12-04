import "dotenv/config"
import fs from "node:fs"
import path from "node:path"
import { GitHubAPI } from "./core/github-api.js"
import { Stats } from "./core/stats.js"
import { Theme } from "./core/theme.js"
import { SVGGenerator } from "./generator/svg-generator.js"

const args = process.argv.slice(2)
const isMock = args.includes("--mock")
const isLight = args.includes("--light")
const outputPath = "output/stats.svg"

const token = process.env.GITHUB_TOKEN
const username = process.env.GITHUB_USERNAME

async function main() {
	let statsData

	if (isMock) {
		console.log("Mode: mock")
		statsData = Stats.mock()
	} else {
		if (!token || !username) {
			console.error("Error: GITHUB_TOKEN and GITHUB_USERNAME required")
			console.error("Use --mock flag for testing without API")
			process.exit(1)
		}

		console.log(`Mode: api`)
		console.log(`Username: ${username}`)

		const api = new GitHubAPI(token, username)
		const data = await api.fetchStats()
		statsData = new Stats(data)
	}

	console.log(`Theme: ${isLight ? "light" : "dark"}`)

	const theme = isLight ? Theme.light() : Theme.dark()
	const generator = new SVGGenerator(statsData, theme)
	const svg = generator.generate()

	const dir = path.dirname(outputPath)
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true })
	}

	fs.writeFileSync(outputPath, svg)
	console.log(`SVG generated: ${outputPath}`)
}

main().catch((err) => {
	console.error("Error:", err.message)
	process.exit(1)
})
