<script lang="ts">
	import { goto } from '$app/navigation';
	import { checkadmin } from '$lib/checkadminship';
	import { onMount } from 'svelte';

	import { get_event } from '$lib/GetCurrEvent';
	import { FlattenDataAvg, type RebuiltAvgFlatten } from '$lib/ParseTimeRunTimeBumAssTime';
	import { averages } from '$lib/schema/sdk.gen';
	import Table from '$lib/Table.svelte';

	let data = $state<string | RebuiltAvgFlatten[]>('Loading');
	let includeMidway = $state(false);

	async function dispatch() {
		data = 'Loading';
		let event = await get_event();
		let res = await averages({ path: { event }, query: { include_midway: includeMidway || null } });
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

	<div class="midway-row">
		<label class="midway-label">
			<input type="checkbox" bind:checked={includeMidway} class="midway-check" onchange={dispatch} />
			<span>INCLUDE MIDWAY DATA</span>
		</label>
	</div>

	{#if typeof data === 'string'}
		<p class="state-message">{data}</p>
	{:else}
		<Table ptData={data} />
	{/if}
</div>

<style>
	.page-header { margin-bottom: 1.25rem; }

	.midway-row {
		margin-bottom: 1.25rem;
	}

	.midway-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		color: rgba(255, 255, 255, 0.40);
		transition: color 0.15s;
	}

	.midway-label:hover {
		color: rgba(255, 255, 255, 0.65);
	}

	.midway-check {
		width: 16px;
		height: 16px;
		accent-color: #3cb371;
		cursor: pointer;
	}
</style>
