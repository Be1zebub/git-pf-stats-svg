import { svelte } from "@sveltejs/vite-plugin-svelte"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

export default defineConfig({
	plugins: [svelte(), tailwindcss()],
	root: "src/client",
	build: {
		outDir: "dist",
		emptyOutDir: true,
	},
	server: {
		proxy: {
			"/api": "http://localhost:3000",
			"/events": "http://localhost:3000",
		},
	},
})
