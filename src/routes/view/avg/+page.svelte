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
	.page {
		max-width: 560px;
		margin: 0 auto;
		padding: 1.5rem 1rem 4rem;
	}

	.page-header {
		position: relative;
		padding-left: 1rem;
		margin-bottom: 2rem;
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
	}

	.state-message {
		text-align: center;
		padding: 3rem;
		color: rgba(255, 255, 255, 0.30);
		letter-spacing: 0.10em;
		font-size: 0.85rem;
	}
</style>
