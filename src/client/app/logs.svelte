<script>
	import { afterUpdate } from "svelte"

	export let logs = []

	let logsEl

	afterUpdate(() => {
		if (logsEl) {
			logsEl.scrollTop = logsEl.scrollHeight
		}
	})
</script>

<div class="logs-container">
	<div class="logs" bind:this={logsEl}>
		{#each logs as log}
			<div class="log-entry {log.level}">
				<span class="ts">{log.timestamp}</span>
				<span class="msg">{log.message}</span>
			</div>
		{/each}
	</div>
</div>

<style>
	.logs-container {
		padding: 16px;
		padding-right: 8px;
		border-top: 1px solid #30363d;
		background: #0d1117;
	}

	.logs {
		height: 120px;
		font-family: "SF Mono", Monaco, Consolas, monospace;
		font-size: 12px;
		overflow-y: auto;
		scroll-behavior: smooth;
		scrollbar-gutter: stable;
	}

	.log-entry {
		margin: 2px 0;
		line-height: 1.4;
	}

	.ts {
		color: #6e7681;
		margin-right: 8px;
	}

	.log-entry.info .msg {
		color: #8b949e;
	}

	.log-entry.error .msg {
		color: #f85149;
	}
</style>
