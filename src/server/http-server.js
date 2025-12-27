import fs from "node:fs"
import http from "node:http"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CLIENT_DIR = path.join(__dirname, "../client/dist")

const MIME_TYPES = {
	".html": "text/html",
	".css": "text/css",
	".js": "text/javascript",
}

export class HttpServer {
	constructor(port, generateFn) {
		this.port = port
		this.generateFn = generateFn
		this.server = null
		this.sseClients = new Set()
	}

	start() {
		this.server = http.createServer((req, res) =>
			this.handleRequest(req, res)
		)
		this.server.listen(this.port)
	}

	stop() {
		this.sseClients.forEach((res) => res.end())
		this.server?.close()
	}

	broadcast(event, data = {}) {
		const payload = JSON.stringify(data)
		this.sseClients.forEach((res) => {
			res.write(`event: ${event}\ndata: ${payload}\n\n`)
		})
	}

	async handleRequest(req, res) {
		const url = req.url === "/" ? "/index.html" : req.url

		if (url === "/api/svg" || url === "/stats.svg") {
			return this.serveSvg(res, undefined)
		}

		if (url === "/api/svg/dark" || url === "/dark.svg") {
			return this.serveSvg(res, false)
		}

		if (url === "/api/svg/light" || url === "/light.svg") {
			return this.serveSvg(res, true)
		}

		if (url === "/events") {
			return this.serveSSE(req, res)
		}

		this.serveStatic(url, res)
	}

	serveStatic(url, res) {
		const filePath = path.join(CLIENT_DIR, url)
		const ext = path.extname(filePath)

		if (!fs.existsSync(filePath)) {
			res.writeHead(404)
			res.end("Not found")
			return
		}

		const content = fs.readFileSync(filePath)
		res.writeHead(200, {
			"Content-Type": MIME_TYPES[ext] || "text/plain",
			"Cache-Control": "no-cache",
		})
		res.end(content)
	}

	async serveSvg(res, lightTheme) {
		try {
			const { svg, time } = await this.generateFn(lightTheme)
			res.writeHead(200, {
				"Content-Type": "application/json",
				"Cache-Control": "no-cache",
			})
			res.end(JSON.stringify({ svg, time }))
		} catch (error) {
			res.writeHead(200, { "Content-Type": "application/json" })
			res.end(JSON.stringify({ error: error.message }))
		}
	}

	serveSSE(req, res) {
		res.writeHead(200, {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
		})

		this.sseClients.add(res)
		req.on("close", () => this.sseClients.delete(res))
	}
}
