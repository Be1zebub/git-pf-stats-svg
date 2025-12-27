<script>
	import { onMount } from "svelte"
	import Logs from "./logs.svelte"
	import ThemeSwitch from "./theme-switch.svelte"

	let svgSrc = ""
	let time = ""
	let loading = true
	let error = ""
	let lightTheme = false

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
			const res = await fetch(`/api/svg/${lightTheme ? "light" : "dark"}`)
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

	let mounted = false

	onMount(() => {
		mounted = true
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

	let lastTheme = lightTheme
	$: if (mounted && lastTheme !== lightTheme) {
		lastTheme = lightTheme
		refreshSvg()
	}
</script>

<div class="theme-switcher">
	<ThemeSwitch bind:lightTheme />
</div>

<div class="app-container">
	<div class="svg-container">
		{#if error}
			<div class="svg-placeholder error">Error: {error}</div>
		{:else if svgSrc}
			<img src={svgSrc} alt="GitHub Stats" />
		{:else}
			<div class="svg-placeholder">Loading...</div>
		{/if}
	</div>

	<div class="svg-status">
		{#if loading}
			<div class="svg-loader"></div>
		{:else if time}
			<p class="svg-time">{time}</p>
		{/if}
	</div>
</div>

<Logs {logs} />

<style>
	.theme-switcher {
		margin-inline: auto;
		margin-block: 16px;
	}
	.app-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
	}

	.svg-status {
		display: flex;
		justify-content: center;
		align-items: center;
		background: transparent;
		gap: 8px;
		height: 20px;
	}

	.svg-time {
		color: #8b949e;
		font-size: 14px;
		white-space: nowrap;
	}

	.svg-loader {
		width: 14px;
		height: 14px;
		border: 2px solid #30363d;
		border-top-color: #58a6ff;
		border-radius: 50%;
		animation: svg-loader-spin 0.8s linear infinite;
	}

	@keyframes svg-loader-spin {
		to {
			transform: rotate(360deg);
		}
	}

	.svg-placeholder {
		color: #8b949e;
		font-size: 14px;
		padding: 20px;
	}

	.svg-placeholder.error {
		color: #f85149;
	}
</style>
