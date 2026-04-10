<script lang="ts">
	import { goto } from '$app/navigation';
	import { checkadmin } from '$lib/checkadminship';
	import { onMount } from 'svelte';

	onMount(() => {
		if (!checkadmin()) {
			goto('/notallowed');
		}
	});

	import FormWithLoading from '$lib/FormWithLoading.svelte';
	import { get_event } from '$lib/GetCurrEvent';
	import NiceErrorTextBox from '$lib/NiceErrorTextBox.svelte';
	import { parse_team } from '$lib/ParseTeam.svelte';
	import { graph } from '$lib/schema/sdk.gen';
	import type { Team } from '$lib/schema/types.gen';
	import LineGraph from '$lib/LineGraph.svelte';
	import { generateGraphData } from '$lib/ChudMasterGoonSoft';
	import type { GraphDataF } from '$lib/ChudMasterGoonSoft';

	let teams_string = $state<string[]>([]);
	const teamErrors = $derived(
		teams_string.map((value) => {
			const res = parse_team(value);
			return typeof res === 'string' ? res : null;
		})
	);
	let done = $state<boolean>(false);
	let final_data = $state<GraphDataF | null>(null);

	$effect(() => {
		done = teams_string.length === 0 || teamErrors.some((e) => e !== null);
	});

	async function dispatch(): Promise<{ message: string; worked: boolean }> {
		let event = await get_event();
		let all_teams: Team[] = [];
		for (const element of teams_string) {
			const type = parse_team(element);
			if (typeof type === 'string') {
				return { message: 'SHOULD NOT REACH THIS POINT', worked: false };
			}
			all_teams.push({ is_ab_team: type.is_ab_team, number: type.team_number });
		}
		let res = await graph({ body: { event, teams: all_teams } });
		if (res.error) {
			return { message: String(res.response.status), worked: false };
		} else if (res.data.status === 'Error') {
			return { message: res.data.message, worked: false };
		} else {
			final_data = generateGraphData(res.data.message);
			return { message: 'Got data!', worked: true };
		}
	}

	function add() {
		teams_string.push('');
	}

	function removeTeam(i: number) {
		teams_string = teams_string.filter((_, idx) => idx !== i);
	}
</script>

{#if final_data === null}
<div class="page">
	<header class="page-header">
		<div class="header-accent"></div>
		<h1>GRAPH</h1>
		<p class="subtitle">team performance over time</p>
	</header>

	<FormWithLoading stop={done} dispatch={dispatch} submitLabel="GENERATE">
		<div class="teams-list">
			{#if teams_string.length === 0}
				<p class="state-message">no teams added</p>
			{/if}
			{#each teams_string as team, i}
				<div class="team-row">
					<div class="team-input-wrap">
						<NiceErrorTextBox bind:input={teams_string[i]} error={teamErrors[i]} />
					</div>
					<button type="button" class="btn-remove" onclick={() => removeTeam(i)}>✕</button>
				</div>
			{/each}
		</div>
		<button type="button" class="btn-add" onclick={add}>+ ADD TEAM</button>
	</FormWithLoading>
</div>
{:else}
<div class="page">
	<header class="page-header">
		<div class="header-accent"></div>
		<h1>GRAPH</h1>
		<p class="subtitle">team performance over time</p>
	</header>
	<button class="btn-ghost" onclick={() => { final_data = null; }}>← BACK</button>
	<div style="margin-top: 1.25rem;">
		<LineGraph data={final_data} />
	</div>
</div>
{/if}

<style>
	.page-header { margin-bottom: 2rem; }

	.teams-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 0.75rem;
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
		margin-bottom: 1rem;
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
	}

	.btn-ghost:hover {
		border-color: rgba(255, 255, 255, 0.25);
	}

	.state-message { padding: 2rem; }

	:global(.form-message) {
		font-size: 0.80rem;
		letter-spacing: 0.06em;
		margin-top: 0.75rem;
	}

	:global(fieldset button[type='submit']) {
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

	:global(fieldset button[type='submit']:hover:not(:disabled)) {
		background: rgba(60, 179, 113, 0.25);
	}

	:global(fieldset button[type='submit']:disabled) {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
