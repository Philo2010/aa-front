<script>
	import { goto } from '$app/navigation';
	import { checkadmin } from '$lib/checkadminship';
	import LinkButton from '$lib/LinkButton.svelte';

	if (!checkadmin()) {
		goto('/notallowed');
	}
</script>

<main>
	<h1>Stats</h1>
	<LinkButton to="/view/search">Search</LinkButton>
	<LinkButton to="/view/graph">Graph</LinkButton>
	<LinkButton to="/view/avg">Averages</LinkButton>
</main>
