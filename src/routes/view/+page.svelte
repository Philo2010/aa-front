<script>
	import { goto } from '$app/navigation';
	import { checkadmin } from '$lib/checkadminship';
	import { onMount } from 'svelte';

	onMount(() => {
		if (!checkadmin()) {
			goto('/notallowed');
		}
	});
</script>

<div class="page">
	<header class="page-header">
		<div class="header-accent"></div>
		<h1>STATS</h1>
		<p class="subtitle">view & analyze scouting data</p>
	</header>

	<nav class="nav-grid">
		<a href="/view/search" class="nav-card">
			<span class="nav-label">SEARCH</span>
			<span class="nav-sub">filter & query records</span>
		</a>
		<a href="/view/graph" class="nav-card">
			<span class="nav-label">GRAPH</span>
			<span class="nav-sub">team performance over time</span>
		</a>
		<a href="/view/avg" class="nav-card">
			<span class="nav-label">AVERAGES</span>
			<span class="nav-sub">per-team stat summaries</span>
		</a>
	</nav>
</div>

<style>
	.page {
		max-width: 560px;
		margin: 0 auto;
		padding: 1.5rem 1rem 4rem;
	}

	.page-header {
		position: relative;
		padding-left: 1rem;
		margin-bottom: 2.5rem;
	}

	.header-accent {
		position: absolute;
		left: 0;
		top: 0.15em;
		bottom: 0.15em;
		width: 3px;
		background: #3cb371;
	}

	h1 {
		font-size: 1.75rem;
		font-weight: 700;
		letter-spacing: 0.18em;
		margin: 0;
		color: #fff;
	}

	.subtitle {
		margin: 0.2rem 0 0;
		font-size: 0.72rem;
		letter-spacing: 0.12em;
		color: rgba(255, 255, 255, 0.35);
		text-transform: lowercase;
	}

	.nav-grid {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.nav-card {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 1rem 1.1rem;
		background: #191919;
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 10px;
		text-decoration: none;
		transition: background 0.15s, border-color 0.15s;
	}

	.nav-card:hover {
		background: #1e1e1e;
		border-color: rgba(60, 179, 113, 0.35);
	}

	.nav-label {
		font-size: 0.85rem;
		font-weight: 700;
		letter-spacing: 0.16em;
		color: #fff;
	}

	.nav-sub {
		font-size: 0.65rem;
		letter-spacing: 0.08em;
		color: rgba(255, 255, 255, 0.30);
	}
</style>
