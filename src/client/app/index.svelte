<script>
	import { onMount } from "svelte"
	import Logs from "./logs.svelte"

	let svgSrc = ""
	let time = ""
	let loading = true
	let error = ""

	let logs = []

	function addLog(message, level) {
		logs = [
			...logs,
			{ message, level, timestamp: new Date().toLocaleTimeString() },
		]
	}

	function svgToDataUri(svg) {
		return "data:image/svg+xml," + encodeURIComponent(svg)
	}

	async function refreshSvg() {
		addLog("Refreshing SVG...", "info")
		loading = true
		error = ""

		try {
			const res = await fetch("/api/svg")
			const data = await res.json()

			if (data.error) {
				addLog(data.error, "error")
				error = data.error
				time = ""
			} else {
				addLog(`SVG Generated in ${data.time}ms`, "info")
				svgSrc = svgToDataUri(data.svg)
				time = `Generated in ${data.time}ms`
			}
		} catch (e) {
			addLog(`Fetch error: ${e.message}`, "error")
			error = e.message
		} finally {
			loading = false
		}
	}

	onMount(() => {
		refreshSvg()

		const events = new EventSource("/events")

		events.addEventListener("log", (e) => {
			const data = JSON.parse(e.data)
			addLog(data.message, data.level)

			if (data.message.startsWith("File changed")) {
				loading = true
			}
		})

		events.addEventListener("reload", () => {
			refreshSvg()
		})

		return () => events.close()
	})
</script>

<div class="container">
	<div class="svg-container">
		{#if error}
			<div class="placeholder error">Error: {error}</div>
		{:else if svgSrc}
			<img src={svgSrc} alt="GitHub Stats" />
		{:else}
			<div class="placeholder">Loading...</div>
		{/if}
	</div>

	<div class="status">
		{#if time}
			<p class="time">{time}</p>
		{/if}
		{#if loading}
			<div class="loader"></div>
		{/if}
	</div>
</div>

<Logs {logs} />

<style>
	.container {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
	}

	.status {
		display: flex;
		align-items: center;
		gap: 8px;
		height: 20px;
	}

	.time {
		color: #8b949e;
		font-size: 14px;
	}

	.loader {
		width: 14px;
		height: 14px;
		border: 2px solid #30363d;
		border-top-color: #58a6ff;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.placeholder {
		color: #8b949e;
		font-size: 14px;
		padding: 20px;
	}

	.placeholder.error {
		color: #f85149;
	}
</style>
