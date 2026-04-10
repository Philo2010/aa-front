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

