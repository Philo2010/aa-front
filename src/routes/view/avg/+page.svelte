<script lang="ts">
	import { goto } from '$app/navigation';
	import { checkadmin } from '$lib/checkadminship';
	import { onMount } from 'svelte';

	import { get_event } from '$lib/GetCurrEvent';
	import NiceErrorTextBox from '$lib/NiceErrorTextBox.svelte';
	import { parse_team } from '$lib/ParseTeam.svelte';
	import { FlattenDataAvg, type RebuiltAvgFlatten } from '$lib/ParseTimeRunTimeBumAssTime';
	import { averages } from '$lib/schema/sdk.gen';
	import Table from '$lib/Table.svelte';

	let data = $state<string | RebuiltAvgFlatten[]>('Loading');
	let includeMidway = $state(false);
	let team_strings = $state<string[]>([]);

	const teamErrors = $derived(
		team_strings.map((value) => {
			const res = parse_team(value);
			return typeof res === 'string' ? res : null;
		})
	);

	const filteredData = $derived(
		typeof data === 'string' || team_strings.length === 0
			? data
			: data.filter((row) =>
					team_strings.some((s) => {
						const res = parse_team(s);
						return typeof res !== 'string' && res.team_number === row._team_number && res.is_ab_team === row._is_ab_team;
					})
				)
	);

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

	function add() {
		team_strings = [...team_strings, ''];
	}

	function removeTeam(i: number) {
		team_strings = team_strings.filter((_, idx) => idx !== i);
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

	<div class="filter-card">
		<span class="section-label">FILTER TEAMS</span>
		{#if team_strings.length === 0}
			<p class="state-message">no teams filtered</p>
		{/if}
		<div class="teams-list">
			{#each team_strings as team, i}
				<div class="team-row">
					<div class="team-input-wrap">
						<NiceErrorTextBox bind:input={team_strings[i]} error={teamErrors[i]} />
					</div>
					<button class="btn-remove" onclick={() => removeTeam(i)}>✕</button>
				</div>
			{/each}
		</div>
		<button class="btn-add" onclick={add}>+ ADD TEAM</button>
	</div>

	{#if typeof filteredData === 'string'}
		<p class="state-message">{filteredData}</p>
	{:else}
		<Table ptData={filteredData} />
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

	.filter-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1.25rem;
	}

	.section-label {
		font-size: 0.60rem;
		color: rgba(255, 255, 255, 0.30);
	}

	.teams-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.team-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.team-input-wrap {
		flex: 1;
	}

	.btn-add {
		width: 100%;
		padding: 0.75rem;
		background: transparent;
		border: 1px dashed rgba(255, 255, 255, 0.12);
		border-radius: 8px;
		color: rgba(255, 255, 255, 0.35);
		font-family: inherit;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		cursor: pointer;
		transition: color 0.15s, border-color 0.15s;
	}

	.btn-add:hover {
		color: #fff;
		border-color: rgba(255, 255, 255, 0.35);
	}

	.btn-remove {
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 4px;
		color: rgba(255, 255, 255, 0.40);
		font-size: 0.65rem;
		padding: 2px 5px;
		cursor: pointer;
		transition: color 0.15s, border-color 0.15s;
	}

	.btn-remove:hover {
		color: #e05555;
		border-color: #e05555;
	}

	.state-message { margin: 0 0 1.25rem; }
</style>
