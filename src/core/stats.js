export class RepoStats {
	constructor({ stars = 0, commits = 0, forks = 0 } = {}) {
		this.stars = stars
		this.commits = commits
		this.forks = forks
	}

	static mock() {
		return new RepoStats({
			stars: 1234,
			commits: 5678,
			forks: 890,
		})
	}
}

export class ContributionStats {
	constructor({ issues = 0, prs = 0, contributedTo = 0 } = {}) {
		this.issues = issues
		this.prs = prs
		this.contributedTo = contributedTo
	}

	static mock() {
		return new ContributionStats({
			issues: 123,
			prs: 456,
			contributedTo: 78,
		})
	}
}

export class Stats {
	constructor({ repos, contributions } = {}) {
		this.repos = repos instanceof RepoStats ? repos : new RepoStats(repos)
		this.contributions =
			contributions instanceof ContributionStats
				? contributions
				: new ContributionStats(contributions)
	}

	static mock() {
		return new Stats({
			repos: RepoStats.mock(),
			contributions: ContributionStats.mock(),
		})
	}
}
