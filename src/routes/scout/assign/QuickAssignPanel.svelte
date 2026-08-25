<script lang="ts">
	import type { Game } from '$lib/schema/types.gen';
	import DualRangeSlider from '$lib/DualRangeSlider.svelte';
	import UserSelector from '$lib/UserSelector.svelte';
	import { stationLabels, type RangeEntry } from './types';

	let {
		masterStations = $bindable(),
		masterRedMvp = $bindable(),
		masterBlueMvp = $bindable(),
		maxGame,
		assignableGames,
		onApply,
		onReset,
	}: {
		masterStations: RangeEntry[][];
		masterRedMvp: RangeEntry[];
		masterBlueMvp: RangeEntry[];
		maxGame: number;
		assignableGames: Game[];
		onApply: () => void;
		onReset: () => void;
	} = $props();

	function addRangeEntry(list: RangeEntry[]) {
		list.push({ user: '', begin: 1, end: maxGame });
	}

	function removeRangeEntry(list: RangeEntry[], index: number) {
		list.splice(index, 1);
	}
</script>

<div class="quick-body">
	<div class="station-grid">
		{#each masterStations as entries, stationIdx}
			{@const isRed = stationIdx < 3}
			<div class="station-col" class:red-col={isRed} class:blue-col={!isRed}>
				<div class="station-label" class:red-label={isRed} class:blue-label={!isRed}>
					{stationLabels[stationIdx]}
				</div>
				{#each entries as entry, entryIdx}
					<div class="range-row">
						<UserSelector bind:value={entry.user} />
						<DualRangeSlider
							min={1}
							max={maxGame}
							bind:beginValue={entry.begin}
							bind:endValue={entry.end}
							games={assignableGames}
						/>
						{#if entries.length > 1}
							<button
								type="button"
								class="icon-btn remove"
								onclick={() => { removeRangeEntry(entries, entryIdx); masterStations = [...masterStations]; }}
							>✕</button>
						{/if}
					</div>
				{/each}
				<button
					type="button"
					class="add-row-btn"
					onclick={() => { addRangeEntry(entries); masterStations = [...masterStations]; }}
				>+ scouter</button>
			</div>
		{/each}
	</div>

	<!-- MVP row -->
	<div class="mvp-row">
		<div class="station-col red-col">
			<div class="station-label red-label">Red MVP</div>
			{#each masterRedMvp as entry, entryIdx}
				<div class="range-row">
					<UserSelector bind:value={entry.user} />
					<DualRangeSlider min={1} max={maxGame} bind:beginValue={entry.begin} bind:endValue={entry.end} games={assignableGames} />
					{#if masterRedMvp.length > 1}
						<button type="button" class="icon-btn remove" onclick={() => { removeRangeEntry(masterRedMvp, entryIdx); masterRedMvp = [...masterRedMvp]; }}>✕</button>
					{/if}
				</div>
			{/each}
			<button type="button" class="add-row-btn" onclick={() => { addRangeEntry(masterRedMvp); masterRedMvp = [...masterRedMvp]; }}>+ range</button>
		</div>
		<div class="station-col blue-col">
			<div class="station-label blue-label">Blue MVP</div>
			{#each masterBlueMvp as entry, entryIdx}
				<div class="range-row">
					<UserSelector bind:value={entry.user} />
					<DualRangeSlider min={1} max={maxGame} bind:beginValue={entry.begin} bind:endValue={entry.end} games={assignableGames} />
					{#if masterBlueMvp.length > 1}
						<button type="button" class="icon-btn remove" onclick={() => { removeRangeEntry(masterBlueMvp, entryIdx); masterBlueMvp = [...masterBlueMvp]; }}>✕</button>
					{/if}
				</div>
			{/each}
			<button type="button" class="add-row-btn" onclick={() => { addRangeEntry(masterBlueMvp); masterBlueMvp = [...masterBlueMvp]; }}>+ range</button>
		</div>
	</div>

	<div class="quick-actions">
		<button type="button" class="btn-apply" onclick={onApply}>Apply to all games</button>
		<button type="button" class="btn-reset" onclick={onReset}>Reset all</button>
	</div>
</div>

<style>
	.quick-body {
		padding: 1rem 1.1rem 1.2rem;
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}

	.station-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr) repeat(3, 1fr);
		gap: 0.5rem;
	}

	.mvp-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}

	@media (max-width: 700px) {
		.station-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (max-width: 480px) {
		.station-grid,
		.mvp-row {
			grid-template-columns: 1fr;
		}
	}

	.station-col {
		padding: 0.6rem 0.7rem;
		border-radius: 7px;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.red-col  { background: rgba(220, 60, 60, 0.06); border: 1px solid rgba(220,60,60,0.15); }
	.blue-col { background: rgba(60, 110, 220, 0.06); border: 1px solid rgba(60,110,220,0.15); }

	.station-label {
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		margin-bottom: 0.15rem;
	}

	.red-label  { color: #e05555; }
	.blue-label { color: #5588ee; }

	.range-row {
		display: flex;
		gap: 5px;
		align-items: center;
		flex-wrap: wrap;
	}

	.icon-btn {
		background: transparent;
		border: 1px solid rgba(255,255,255,0.12);
		border-radius: 4px;
		color: rgba(255,255,255,0.4);
		cursor: pointer;
		font-size: 0.65rem;
		padding: 2px 5px;
		line-height: 1;
		transition: color 0.15s, border-color 0.15s;
	}

	.icon-btn.remove:hover { color: #e05555; border-color: #e05555; }

	.add-row-btn {
		background: transparent;
		border: 1px dashed rgba(255,255,255,0.12);
		border-radius: 4px;
		color: rgba(255,255,255,0.35);
		cursor: pointer;
		font-size: 0.65rem;
		letter-spacing: 0.06em;
		padding: 3px 8px;
		transition: color 0.15s, border-color 0.15s;
		align-self: flex-start;
	}

	.add-row-btn:hover { color: #fff; border-color: rgba(255,255,255,0.35); }

	.quick-actions {
		display: flex;
		gap: 0.6rem;
		padding-top: 0.5rem;
		border-top: 1px solid rgba(255,255,255,0.06);
	}

	.btn-apply {
		background: rgba(60,179,113,0.15);
		border: 1px solid rgba(60,179,113,0.35);
		border-radius: 6px;
		color: #3cb371;
		cursor: pointer;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		padding: 0.4rem 1rem;
		transition: background 0.15s;
	}

	.btn-apply:hover { background: rgba(60,179,113,0.25); }

	.btn-reset {
		background: rgba(200,50,50,0.1);
		border: 1px solid rgba(200,50,50,0.25);
		border-radius: 6px;
		color: rgba(220,100,100,0.9);
		cursor: pointer;
		font-size: 0.75rem;
		letter-spacing: 0.06em;
		padding: 0.4rem 0.9rem;
		transition: background 0.15s;
	}

	.btn-reset:hover { background: rgba(200,50,50,0.2); }
</style>
