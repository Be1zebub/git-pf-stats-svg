import "dotenv/config"
import { Server } from "./server/index.js"

const args = process.argv.slice(2)

const token = process.env.GITHUB_TOKEN
const username = process.env.GITHUB_USERNAME
const hasCredentials = Boolean(token && username)

const options = {
	mock: args.includes("--mock") || !hasCredentials,
	light: args.includes("--light"),
	port: 3000,
}

if (!args.includes("--mock") && !hasCredentials) {
	console.log(
		"Warning: GITHUB_TOKEN or GITHUB_USERNAME not set, using mock mode"
	)
}

console.log(`Mode: ${options.mock ? "mock" : "api"}`)
console.log(`Theme: ${options.light ? "light" : "dark"}`)
if (!options.mock) {
	console.log(`Username: ${username}`)
}

const server = new Server(options)
server.start()

process.on("SIGINT", () => {
	server.stop()
	process.exit(0)
})
