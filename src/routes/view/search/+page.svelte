<script lang="ts">
	import { goto } from '$app/navigation';
	import { checkadmin } from '$lib/checkadminship';
	import { onMount } from 'svelte';

	onMount(() => {
		if (!checkadmin()) {
			goto('/notallowed');
		}
	});

	import NiceErrorTextBox from '$lib/NiceErrorTextBox.svelte';
	import { parse_team } from '$lib/ParseTeam.svelte';
	import type { GamesFull, Team } from '$lib/schema/types.gen';
	import type { SearchParamData, TournamentLevels, Stations } from '$lib/schema/types.gen';
	import { get_event } from '$lib/GetCurrEvent';
	import SelectTeam from '$lib/SelectTeam.svelte';
	import { search } from '$lib/schema/sdk.gen';
	import Table from '$lib/Table.svelte';
	import { FlattenData, type RebuiltGameFlatten } from '$lib/ParseTimeRunTimeBumAssTime';

	let team_string = $state<string>('');
	let team_error: string | null = $state<null>(null);
	let data = $state<RebuiltGameFlatten[] | null>(null);
	let team = $state<Team | null>(null);
	let submitting = $state(false);
	let submitError = $state<string | null>(null);
	let activeKeys = $state<string[]>([]);
	let includeMidway = $state(false);
	let params: SearchParamData = $state({
		user: null,
		team: null,
		is_ab_team: null,
		match_id: null,
		set: null,
		total_score: null,
		event_code: null,
		tournament_level: null,
		station: null,
		is_mvp: null,
		include_midway: null,
	});

	$effect(() => {
		if (!team_string) return;
		const res = parse_team(team_string);
		if (typeof res === 'string') {
			team_error = res;
		} else {
			if (!team || team.number !== res.team_number || team.is_ab_team !== res.is_ab_team) {
				team = { number: res.team_number, is_ab_team: res.is_ab_team };
			}
			team_error = null;
		}
	});
	$inspect(team_string, team);

	function formatKey(key: string) {
		return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}

	const availableKeys = $derived([
		...Object.keys(params).filter(k => !activeKeys.includes(k) && k !== 'team' && k !== 'is_ab_team' && k !== 'include_midway'),
		...(team === null ? ['team'] : [])
	]);

	function addKey(key: string) {
		const k = key as keyof SearchParamData;
		if (k === 'team') {
			team = { number: 0, is_ab_team: false };
			return;
		}
		if (k === 'is_ab_team' || k === 'is_mvp') {
			(params[k] as boolean | null) = false;
		} else if (k === 'total_score' || k === 'match_id' || k === 'set') {
			(params[k] as number | null) = 0;
		} else if (k === 'station') {
			params.station = stations[0];
		} else if (k === 'tournament_level') {
			params.tournament_level = tournamentLevels[0];
		} else {
			(params[k] as string | null) = '';
		}
		activeKeys = [...activeKeys, k];
	}

	async function dispatch() {
		submitting = true;
		submitError = null;
		if (team !== null) {
			params.team = team.number;
			params.is_ab_team = team.is_ab_team;
		}
		if (params.event_code === null) {
			let event = await get_event();
			params.event_code = event;
		}
		params.include_midway = includeMidway || null;
		let res = await search({ body: params });
		submitting = false;
		if (res.error) {
			submitError = 'Error ' + res.response.status;
		} else if (res.data.status === 'Error') {
			submitError = res.data.message;
		} else {
			data = res.data.message.map((x: any) => FlattenData(x));
		}
	}

	function remove(key: keyof SearchParamData) {
		(params[key] as any) = null;
		activeKeys = activeKeys.filter(k => k !== key);
	}

	function isBooleanKey(key: string): key is 'is_ab_team' | 'is_mvp' {
		return key === 'is_ab_team' || key === 'is_mvp';
	}

	function isNumberKey(key: string): key is 'total_score' | 'match_id' | 'set' {
		return key === 'total_score' || key === 'match_id' || key === 'set';
	}

	const tournamentLevels: TournamentLevels[] = ['QualificationMatch', 'Quarterfinal', 'Semifinal', 'Final'];
	const stations: Stations[] = ['Red1', 'Red2', 'Red3', 'Blue1', 'Blue2', 'Blue3'];

	const hasParams = $derived(team !== null || activeKeys.length > 0);
</script>

{#if data === null}
<div class="page">
	<header class="page-header">
		<div class="header-accent"></div>
		<h1>SEARCH</h1>
		<p class="subtitle">filter scouting records</p>
	</header>

	{#if availableKeys.length > 0}
	<div class="filter-chips">
		<span class="section-label">ADD FILTER</span>
		<div class="chips-row">
			{#each availableKeys as key}
				<button class="chip" onclick={() => addKey(key)}>{formatKey(key).toUpperCase()}</button>
			{/each}
		</div>
	</div>
	{/if}

	{#if hasParams}
	<div class="params-card">
		<div class="params-header">
			<span class="section-label">ACTIVE FILTERS</span>
		</div>
		<ul class="params-list">
			{#if team !== null}
				<li class="param-item">
					<span class="param-key">TEAM</span>
					<div class="param-value">
						<NiceErrorTextBox error={team_error} bind:input={team_string} />
					</div>
					<button class="btn-remove" onclick={() => { team = null; team_string = ''; }}>✕</button>
				</li>
			{/if}
			{#each Object.entries(params) as [key, value]}
				{#if activeKeys.includes(key)}
					<li class="param-item">
						<span class="param-key">{formatKey(key).toUpperCase()}</span>
						<div class="param-value">
							{#if isBooleanKey(key)}
								<input type="checkbox" bind:checked={params[key]} class="param-checkbox" />
							{:else if isNumberKey(key)}
								<input type="number" bind:value={params[key]} class="param-input" />
							{:else if key === 'tournament_level'}
								<select bind:value={params.tournament_level} class="param-enum-select">
									{#each tournamentLevels as lvl}
										<option value={lvl}>{lvl}</option>
									{/each}
								</select>
							{:else if key === 'station'}
								<select bind:value={params.station} class="param-enum-select">
									{#each stations as s}
										<option value={s}>{s}</option>
									{/each}
								</select>
							{:else}
								<input type="text" bind:value={params[key]} class="param-input" />
							{/if}
						</div>
						<button class="btn-remove" onclick={() => remove(key as keyof SearchParamData)}>✕</button>
					</li>
				{/if}
			{/each}
		</ul>
	</div>
	{:else}
	<p class="state-message">no filters added yet</p>
	{/if}

	<div class="midway-row">
		<label class="midway-label">
			<input type="checkbox" bind:checked={includeMidway} class="midway-check" />
			<span>INCLUDE MIDWAY DATA</span>
		</label>
	</div>

	{#if submitError}
		<p class="error-msg">{submitError}</p>
	{/if}

	<button class="btn-primary" onclick={dispatch} disabled={submitting}>
		{submitting ? 'SEARCHING…' : 'SEARCH'}
	</button>
</div>
{:else}
<div class="page">
	<header class="page-header">
		<div class="header-accent"></div>
		<h1>RESULTS</h1>
		<p class="subtitle">search results</p>
	</header>
	<button class="btn-ghost" onclick={() => { data = null; }}>← BACK</button>
	<div style="margin-top: 1rem;">
		<Table ptData={data} />
	</div>
</div>
{/if}

<style>
	.page-header { margin-bottom: 2rem; }

	.filter-chips {
		margin-bottom: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.chips-row {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.chip {
		background: transparent;
		border: 1px dashed rgba(255, 255, 255, 0.18);
		border-radius: 6px;
		color: rgba(255, 255, 255, 0.50);
		font-family: inherit;
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		padding: 0.4rem 0.7rem;
		min-height: 36px;
		cursor: pointer;
		transition: color 0.15s, border-color 0.15s, background 0.15s;
	}

	.chip:hover {
		color: #5dde8a;
		border-color: rgba(60, 179, 113, 0.50);
		background: rgba(60, 179, 113, 0.08);
	}

	.params-card {
		background: #191919;
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 10px;
		overflow: hidden;
		margin-bottom: 1.25rem;
	}

	.params-header {
		padding: 0.5rem 1rem;
		background: rgba(255, 255, 255, 0.03);
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	.section-label {
		font-size: 0.60rem;
		color: rgba(255, 255, 255, 0.30);
	}

	.params-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.param-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.6rem 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.param-item:last-child {
		border-bottom: none;
	}

	.param-key {
		font-size: 0.60rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		color: rgba(255, 255, 255, 0.40);
		min-width: 100px;
	}

	.param-value {
		flex: 1;
	}

	.param-input {
		width: 100%;
		background: #111;
		border: 1.5px solid rgba(255, 255, 255, 0.10);
		border-radius: 6px;
		color: #fff;
		font-family: inherit;
		font-size: 0.85rem;
		padding: 0.35rem 0.6rem;
		outline: none;
	}

	.param-input:focus {
		border-color: rgba(60, 179, 113, 0.50);
	}

	.param-enum-select {
		width: 100%;
		background: #111;
		border: 1.5px solid rgba(255, 255, 255, 0.10);
		border-radius: 6px;
		color: #fff;
		font-family: inherit;
		font-size: 0.85rem;
		padding: 0.35rem 0.6rem;
		outline: none;
	}

	.param-enum-select:focus {
		border-color: rgba(60, 179, 113, 0.50);
	}

	.param-checkbox {
		width: 18px;
		height: 18px;
		accent-color: #3cb371;
	}

	.btn-primary {
		width: 100%;
		min-height: 48px;
		background: rgba(60, 179, 113, 0.15);
		border: 1px solid rgba(60, 179, 113, 0.35);
		border-radius: 8px;
		color: #5dde8a;
		font-family: inherit;
		font-size: 0.85rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		cursor: pointer;
		transition: background 0.15s;
	}

	.btn-primary:hover:not(:disabled) {
		background: rgba(60, 179, 113, 0.25);
	}

	.btn-primary:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.btn-ghost {
		background: #1a1a1a;
		border: 1px solid rgba(255, 255, 255, 0.10);
		border-radius: 6px;
		color: rgba(255, 255, 255, 0.70);
		font-family: inherit;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.10em;
		padding: 0.5rem 0.9rem;
		cursor: pointer;
		transition: border-color 0.15s;
		white-space: nowrap;
	}

	.btn-ghost:hover {
		border-color: rgba(255, 255, 255, 0.25);
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

	.midway-row {
		margin-bottom: 1rem;
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

	.state-message { margin: 0 0 1.25rem; }

	.error-msg {
		font-size: 0.80rem;
		color: #e05555;
		margin: 0 0 1rem;
		letter-spacing: 0.06em;
	}
</style>
