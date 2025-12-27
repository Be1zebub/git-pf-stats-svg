import chokidar from "chokidar"
import { fork } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { HttpServer } from "./http-server.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const GENERATOR_PATH = path.join(__dirname, "../generator/index.js")

export class Server {
	constructor(options = {}) {
		this.options = options
		this.port = options.port || 3000
		this.generator = null
		this.httpServer = null
		this.watcher = null
		this.pendingRequests = new Map()
		this.requestId = 0
		this.isRestarting = false
		this.spawnTime = null
	}

	start() {
		this.spawnGenerator()
		this.startWatcher()
		this.startHttpServer()
	}

	spawnGenerator() {
		if (this.generator) {
			this.isRestarting = true
			this.generator.kill()
			this.rejectPendingRequests("restarting")
		}

		this.spawnTime = performance.now()
		this.generator = fork(GENERATOR_PATH)

		this.generator.on("message", (msg) => {
			if (msg.type === "ready") {
				this.isRestarting = false
				const time = (performance.now() - this.spawnTime).toFixed(0)
				this.log(`Generator ready in ${time}ms`)
				this.httpServer?.broadcast("reload", {})
			} else if (msg.type === "svg") {
				const pending = this.pendingRequests.get(msg.id)
				if (pending) {
					pending.resolve({ svg: msg.svg, time: msg.time })
					this.pendingRequests.delete(msg.id)
				}
			} else if (msg.type === "error") {
				const pending = this.pendingRequests.get(msg.id)
				if (pending) {
					pending.reject(new Error(msg.message))
					this.pendingRequests.delete(msg.id)
				}
				this.log(`Error: ${msg.message}`, "error")
			}
		})

		this.generator.on("exit", (code) => {
			if (code !== 0 && !this.isRestarting) {
				this.log(`Generator crashed (code ${code})`, "error")
				this.rejectPendingRequests("crashed")
			}
		})
	}

	rejectPendingRequests(reason) {
		for (const [id, pending] of this.pendingRequests) {
			pending.reject(new Error(reason))
		}
		this.pendingRequests.clear()
	}

	log(message, level = "info") {
		const timestamp = new Date().toLocaleTimeString()
		console.log(`[${timestamp}] ${message}`)
		this.httpServer?.broadcast("log", { message, level, timestamp })
	}

	requestGenerate(lightTheme = false) {
		return new Promise((resolve, reject) => {
			if (!this.generator || this.isRestarting) {
				reject(new Error("restarting"))
				return
			}

			const id = ++this.requestId
			this.pendingRequests.set(id, { resolve, reject })

			this.generator.send({
				type: "generate",
				id,
				options: {
					mock: this.options.mock,
					light: lightTheme,
				},
			})
		})
	}

	startWatcher() {
		const watchPath = path.join(__dirname, "..")

		this.watcher = chokidar.watch(watchPath, {
			ignored: [/node_modules/, /output/, /\.git/],
			persistent: true,
			ignoreInitial: true,
		})

		this.watcher.on("change", (filePath) => {
			const relative = path.relative(watchPath, filePath)
			this.log(`File changed: ${relative}`)
			this.spawnGenerator()
		})

		this.log("Watching for changes")
	}

	startHttpServer() {
		this.httpServer = new HttpServer(this.port, (lightTheme) =>
			this.requestGenerate(lightTheme)
		)
		this.httpServer.start()
		this.log(`Dev server started on http://localhost:${this.port}`)
	}

	stop() {
		this.isRestarting = true
		this.generator?.kill()
		this.watcher?.close()
		this.httpServer?.stop()
	}
}
