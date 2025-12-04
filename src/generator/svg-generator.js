import * as d3 from "d3"
import { JSDOM } from "jsdom"
import { Theme } from "../core/theme.js"

const FONT_FAMILY = `-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, Ubuntu, sans-serif`

export class SVGGenerator {
	constructor(stats, theme = Theme.dark()) {
		this.stats = stats
		this.theme = theme
		this.columnWidth = 200
		this.padding = 16
		this.gap = 48
		this.rowHeight = 24
		this.titleHeight = 32
		this.cornerRadius = 6
		this.strokeWidth = 1
	}

	get width() {
		return this.columnWidth * 2 + this.padding * 2 + this.gap
	}

	get height() {
		return this.padding + this.titleHeight + this.rowHeight * 3
	}

	generate() {
		const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>")
		const document = dom.window.document

		const svg = d3
			.select(document.body)
			.append("svg")
			.attr("width", this.width)
			.attr("height", this.height)
			.attr("viewBox", `0 0 ${this.width} ${this.height}`)
			.attr("xmlns", "http://www.w3.org/2000/svg")
			.attr("role", "img")
			.attr("aria-label", "GitHub profile stats")

		this.renderStyles(svg)
		this.renderBackground(svg)

		const { stars, commits, forks } = this.stats.repos
		const { issues, prs, contributedTo } = this.stats.contributions

		this.renderColumn(svg, this.padding, "Repositories", [
			{ icon: "⭐", label: "Stars", value: stars },
			{ icon: "📝", label: "Commits", value: commits },
			{ icon: "🍴", label: "Forks", value: forks },
		])

		this.renderColumn(
			svg,
			this.padding + this.columnWidth + this.gap,
			"Contributions",
			[
				{ icon: "🐛", label: "Issues", value: issues },
				{ icon: "🔀", label: "PRs", value: prs },
				{ icon: "📦", label: "Contributed to", value: contributedTo },
			]
		)

		return svg.node().outerHTML
	}

	renderStyles(svg) {
		svg.append("style").text(`
			.section-title { font: 600 11px ${FONT_FAMILY}; fill: ${this.theme.accent}; text-transform: uppercase; letter-spacing: 0.5px; }
			.stat-label { font: 500 13px ${FONT_FAMILY}; fill: ${this.theme.textSecondary}; }
			.stat-value { font: 700 13px ${FONT_FAMILY}; fill: ${this.theme.text}; }
		`)
	}

	renderBackground(svg) {
		svg.append("rect")
			.attr("width", "100%")
			.attr("height", "100%")
			.attr("rx", this.cornerRadius)
			.attr("fill", this.theme.background)
			.attr("stroke", this.theme.border)
			.attr("stroke-width", this.strokeWidth)
	}

	renderColumn(svg, x, title, rows) {
		const g = svg
			.append("g")
			.attr("transform", `translate(${x}, ${this.padding})`)

		g.append("text")
			.attr("y", 10)
			.attr("class", "section-title")
			.text(title)

		const rowsG = g
			.append("g")
			.attr("transform", `translate(0, ${this.titleHeight})`)

		rows.forEach((row, i) => {
			const y = i * this.rowHeight

			rowsG
				.append("text")
				.attr("x", 0)
				.attr("y", y)
				.attr("dominant-baseline", "middle")
				.attr("class", "stat-label")
				.text(`${row.icon} ${row.label}`)

			rowsG
				.append("text")
				.attr("x", this.columnWidth)
				.attr("y", y)
				.attr("dominant-baseline", "middle")
				.attr("text-anchor", "end")
				.attr("class", "stat-value")
				.text(this.formatNumber(row.value))
		})
	}

	formatNumber(num) {
		if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, "") + "M"
		if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, "") + "K"
		return String(num)
	}
}
