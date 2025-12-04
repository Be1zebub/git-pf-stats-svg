import { mount } from "svelte"
import "./app/index.css"
import App from "./app/index.svelte"

mount(App, {
	target: document.getElementById("app"),
})
