<script lang="ts">
	import { goto } from '$app/navigation';
	import { checkadmin } from '$lib/checkadminship';
	import { onMount } from 'svelte';

	import { get_event } from '$lib/GetCurrEvent';
	import { FlattenDataAvg, type RebuiltAvgFlatten } from '$lib/ParseTimeRunTimeBumAssTime';
	import { averages } from '$lib/schema/sdk.gen';
	import Table from '$lib/Table.svelte';

	let data = $state<string | RebuiltAvgFlatten[]>('Loading');

	async function dispatch() {
		let event = await get_event();
		let res = await averages({ path: { event } });
		if (res.error) {
			data = 'Error code: ' + res.response.status;
		} else if (res.data.status === 'Error') {
			data = 'Error from server: ' + res.data.message;
		} else {
			data = res.data.message.map((d: any) => FlattenDataAvg(d, event));
		}
	}

	onMount(() => {
		if (!checkadmin()) {
			goto('/notallowed');
			return;
		}
		(async () => { await dispatch(); })();
	});
</script>

<div class="page">
	<header class="page-header">
		<div class="header-accent"></div>
		<h1>AVERAGES</h1>
		<p class="subtitle">per-team stat summaries</p>
	</header>

	{#if typeof data === 'string'}
		<p class="state-message">{data}</p>
	{:else}
		<Table ptData={data} />
	{/if}
</div>

<style>
	.page-header { margin-bottom: 2rem; }
</style>
