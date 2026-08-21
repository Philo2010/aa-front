<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { checkadmin } from '$lib/checkadminship';
	import { get_event } from '$lib/GetCurrEvent';
	import { format_team } from '$lib/ParseTeam.svelte';
	import { getPickList, setPickList } from '$lib/schema/sdk.gen';
	import type { PickEntry, PickLists } from '$lib/schema/types.gen';

	type Tab = 'defence' | 'offence' | 'general';
	const TABS: { key: Tab; label: string }[] = [
		{ key: 'defence', label: 'DEFENCE' },
		{ key: 'offence', label: 'OFFENCE' },
		{ key: 'general', label: 'GENERAL' }
	];

	let data = $state<PickLists | string>('Loading');
	let includeMidway = $state(false);
	let activeTab = $state<Tab>('general');
	let currentEvent = $state('');
	let toggleError = $state('');

	const selectedKey = (tab: Tab) =>
		tab === 'defence'
			? 'is_selected_defence'
			: tab === 'offence'
				? 'is_selected_offence'
				: 'is_selected_general';

	const scoreFor = (tab: Tab, entry: PickEntry) =>
		tab === 'defence'
			? entry.team_avg.defence_score
			: tab === 'offence'
				? entry.team_avg.auto_score + entry.team_avg.teleop_score
				: entry.team_avg.total_score;

	const sorted = $derived(
		typeof data === 'string'
			? data
			: [...data.results].sort((a, b) => scoreFor(activeTab, b) - scoreFor(activeTab, a))
	);

	async function dispatch() {
		data = 'Loading';
		toggleError = '';
		try {
			currentEvent = await get_event();
			const res = await getPickList({ body: { include_midway: includeMidway } });
			if (res.error) {
				data = 'Error code: ' + res.response.status;
			} else if (res.data.status === 'Error') {
				data = 'Error from server: ' + res.data.message;
			} else {
				data = res.data.message;
			}
		} catch (e) {
			data = 'Failed to reach server';
		}
	}

	async function toggle(entry: PickEntry) {
		if (typeof data === 'string') return;
		const key = selectedKey(activeTab);
		const previous = entry[key];
		entry[key] = !previous;
		toggleError = '';

		try {
			const body: Record<string, unknown> = {
				team: entry.team,
				event_code: currentEvent
			};
			body[key] = entry[key];
			const res = await setPickList({ body: body as any });
			if (res.error) {
				entry[key] = previous;
				toggleError = 'Error code: ' + res.response.status;
			} else if (res.data.status === 'Error') {
				entry[key] = previous;
				toggleError = 'Error from server: ' + res.data.message;
			}
		} catch (e) {
			entry[key] = previous;
			toggleError = 'Failed to reach server';
		}
	}

	onMount(() => {
		if (!checkadmin()) {
			goto('/notallowed');
			return;
		}
		(async () => {
			await dispatch();
		})();
	});
</script>

<div class="page">
	<header class="page-header">
		<div class="header-accent"></div>
		<h1>PICK LIST</h1>
		<p class="subtitle">defence / offence / general picks</p>
	</header>

	<div class="tab-row">
		{#each TABS as tab}
			<button
				class="option-btn"
				class:selected={activeTab === tab.key}
				onclick={() => (activeTab = tab.key)}
			>
				{tab.label}
			</button>
		{/each}
	</div>

	<div class="controls-row">
		<label class="midway-label">
			<input type="checkbox" bind:checked={includeMidway} class="midway-check" onchange={dispatch} />
			<span>INCLUDE MIDWAY DATA</span>
		</label>
		<button class="btn-refresh" onclick={dispatch}>REFRESH</button>
	</div>

	{#if toggleError}
		<p class="toggle-error">{toggleError}</p>
	{/if}

	{#if typeof sorted === 'string'}
		<p class="state-message">{sorted}</p>
	{:else if sorted.length === 0}
		<p class="state-message">no teams</p>
	{:else}
		<div class="card-list">
			{#each sorted as entry, i (entry.team.number + '-' + entry.team.is_ab_team)}
				<div class="card" style="animation-delay: {i * 40}ms">
					<div class="card-header">
						<div class="card-left">
							<span class="rank">#{i + 1}</span>
							<span class="team-num">{format_team(entry.team.number, entry.team.is_ab_team)}</span>
						</div>
						<span class="score">{scoreFor(activeTab, entry).toFixed(1)}</span>
					</div>
					<label class="card-body toggle-row">
						<input
							type="checkbox"
							class="midway-check"
							checked={entry[selectedKey(activeTab)]}
							onchange={() => toggle(entry)}
						/>
						<span>SELECTED</span>
					</label>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.tab-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
		margin-bottom: 1.25rem;
	}

	.controls-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
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
		color: rgba(255, 255, 255, 0.4);
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

	.btn-refresh {
		flex-shrink: 0;
		padding: 0.5rem 0.9rem;
		background: #1a1a1a;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		color: rgba(255, 255, 255, 0.7);
		font-family: inherit;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s;
	}

	.btn-refresh:hover {
		background: #222;
		border-color: rgba(60, 179, 113, 0.35);
	}

	.toggle-error {
		text-align: center;
		font-size: 0.75rem;
		color: #e05555;
		margin: 0 0 1rem;
	}

	.card-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.card {
		background: #191919;
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 10px;
		overflow: hidden;
		animation: slideIn 0.3s ease both;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0.9rem;
		background: rgba(255, 255, 255, 0.03);
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	.card-left {
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
	}

	.rank {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.3);
	}

	.team-num {
		font-size: 1rem;
		font-weight: 700;
		color: #fff;
	}

	.score {
		font-size: 0.8rem;
		color: #5dde8a;
	}

	.card-body {
		padding: 0.65rem 0.9rem;
	}

	.toggle-row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		cursor: pointer;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		color: rgba(255, 255, 255, 0.55);
	}
</style>
