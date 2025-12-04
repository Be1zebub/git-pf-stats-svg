const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql"

const BASIC_STATS_QUERY = `
query($username: String!) {
  user(login: $username) {
    contributionsCollection {
      totalCommitContributions
      contributionYears
    }
    issues {
      totalCount
    }
    pullRequests {
      totalCount
    }
    repositoriesContributedTo {
      totalCount
    }
  }
}
`

const REPO_STATS_QUERY = `
query($username: String!, $cursor: String) {
  user(login: $username) {
    repositories(first: 100, after: $cursor, ownerAffiliations: OWNER, privacy: PUBLIC) {
      totalCount
      nodes {
        stargazerCount
        forkCount
        isFork
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}
`

const ALL_COMMITS_QUERY = `
query($username: String!) {
  user(login: $username) {
    contributionsCollection {
      contributionYears
    }
  }
}
`

const YEAR_COMMITS_FRAGMENT = (year) => `
  year${year}: contributionsCollection(from: "${year}-01-01T00:00:00Z", to: "${year}-12-31T23:59:59Z") {
    totalCommitContributions
  }
`

export class GitHubAPI {
	constructor(token, username) {
		this.token = token
		this.username = username
	}

	async fetchStats() {
		const [basicStats, repoStats, totalCommits] = await Promise.all([
			this.executeQuery(BASIC_STATS_QUERY),
			this.fetchAllRepoStats(),
			this.fetchTotalCommits(),
		])

		const user = basicStats.data.user

		let stars = 0
		let forks = 0
		for (const repo of repoStats) {
			if (!repo.isFork) {
				stars += repo.stargazerCount
				forks += repo.forkCount
			}
		}

		return {
			repos: {
				stars,
				commits: totalCommits,
				forks,
			},
			contributions: {
				issues: user.issues.totalCount,
				prs: user.pullRequests.totalCount,
				contributedTo: user.repositoriesContributedTo.totalCount,
			},
		}
	}

	async fetchAllRepoStats() {
		const repos = []
		let cursor = null
		let hasNextPage = true

		while (hasNextPage) {
			const result = await this.executeQuery(REPO_STATS_QUERY, { cursor })
			const data = result.data.user.repositories

			if (data.nodes) {
				repos.push(...data.nodes)
			}

			hasNextPage = data.pageInfo.hasNextPage
			cursor = data.pageInfo.endCursor
		}

		return repos
	}

	async fetchTotalCommits() {
		const yearsResult = await this.executeQuery(ALL_COMMITS_QUERY)
		const years =
			yearsResult.data.user.contributionsCollection.contributionYears

		if (years.length === 0) return 0

		const yearsQuery = years
			.map((year) => YEAR_COMMITS_FRAGMENT(year))
			.join("")
		const query = `
			query($username: String!) {
				user(login: $username) {
					${yearsQuery}
				}
			}
		`

		const result = await this.executeQuery(query)
		const userData = result.data.user

		let totalCommits = 0
		for (const key of Object.keys(userData)) {
			if (key.startsWith("year")) {
				totalCommits += userData[key].totalCommitContributions
			}
		}

		return totalCommits
	}

	async executeQuery(query, variables = {}) {
		let response

		try {
			response = await fetch(GITHUB_GRAPHQL_URL, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${this.token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					query,
					variables: { username: this.username, ...variables },
				}),
			})
		} catch (err) {
			throw new Error(`Network error: ${err.message}`)
		}

		if (!response.ok) {
			throw new Error(`GitHub API HTTP ${response.status}`)
		}

		const result = await response.json()

		if (result.errors) {
			const messages = result.errors.map((e) => e.message).join("; ")
			throw new Error(`GitHub GraphQL: ${messages}`)
		}

		return result
	}
}
