<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { flip } from 'svelte/animate';
	import { checkadmin } from '$lib/checkadminship';
	import { get_event } from '$lib/GetCurrEvent';
	import { format_team } from '$lib/ParseTeam.svelte';
	import { getPickList, reorderPickList, setPickList } from '$lib/schema/sdk.gen';
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

	let listEl = $state<HTMLDivElement | null>(null);
	let dragging = $state(false);
	let syncing = $state(false);
	let dragIndex = $state(0);
	let dragOrigin = 0;
	let dragEntry: PickEntry | null = null;
	let slotCenters: number[] = [];

	const selectedKey = (tab: Tab) =>
		tab === 'defence'
			? 'is_selected_defence'
			: tab === 'offence'
				? 'is_selected_offence'
				: 'is_selected_general';

	const orderKey = (tab: Tab) =>
		tab === 'defence'
			? 'order_defence'
			: tab === 'offence'
				? 'order_offence'
				: 'order_general';

	const scoreFor = (tab: Tab, entry: PickEntry) =>
		tab === 'defence'
			? entry.team_avg.defence_score
			: tab === 'offence'
				? entry.team_avg.auto_score + entry.team_avg.teleop_score
				: entry.team_avg.total_score;

	const sorted = $derived(
		typeof data === 'string'
			? data
			: [...data.results].sort((a, b) => a[orderKey(activeTab)] - b[orderKey(activeTab)])
	);

	async function dispatch(silent = false) {
		if (!silent) data = 'Loading';
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

	const categoryName = (tab: Tab): 'Defence' | 'Offence' | 'General' =>
		tab === 'defence' ? 'Defence' : tab === 'offence' ? 'Offence' : 'General';

	async function moveOrder(entry: PickEntry, direction: 'Up' | 'Down') {
		if (typeof sorted === 'string') return;
		if (typeof data === 'string') return;
		toggleError = '';
		try {
			const res = await reorderPickList({
				body: {
					team: entry.team,
					event_code: currentEvent,
					category: categoryName(activeTab),
					direction,
					count: 1
				}
			});
			if (res.error) {
				toggleError = 'Error code: ' + res.response.status;
			} else if (res.data.status === 'Error') {
				toggleError = 'Error from server: ' + res.data.message;
			} else {
				await dispatch(true);
			}
		} catch (e) {
			toggleError = 'Failed to reach server';
		}
	}

	// Reorder the local list only (no server calls) so the cards can animate
	// smoothly while dragging. The server is synced once the motion is done.
	function moveLocal(from: number, to: number) {
		if (typeof data === 'string') return;
		const key = orderKey(activeTab);
		const list = [...data.results].sort((a, b) => a[key] - b[key]);
		const [moved] = list.splice(from, 1);
		list.splice(to, 0, moved);
		const values = data.results
			.map((e) => e[key])
			.slice()
			.sort((a, b) => a - b);
		list.forEach((entry, idx) => {
			entry[key] = values[idx];
		});
	}

	function startDrag(e: PointerEvent, i: number) {
		if (dragging || syncing || typeof sorted === 'string') return;
		e.preventDefault();
		dragging = true;
		dragOrigin = i;
		dragIndex = i;
		dragEntry = sorted[i];
		slotCenters = [];
		if (listEl) {
			Array.from(listEl.querySelectorAll<HTMLElement>('.card')).forEach((card, idx) => {
				if (idx === i) return;
				const rect = card.getBoundingClientRect();
				slotCenters.push(rect.top + rect.height / 2);
			});
		}
		window.addEventListener('pointermove', onDragMove);
		window.addEventListener('pointerup', endDrag);
		window.addEventListener('pointercancel', endDrag);
	}

	function onDragMove(e: PointerEvent) {
		if (!dragging) return;
		let target = 0;
		for (const center of slotCenters) {
			if (center < e.clientY) target++;
		}
		if (target !== dragIndex) {
			moveLocal(dragIndex, target);
			dragIndex = target;
		}
	}

	function endDrag() {
		window.removeEventListener('pointermove', onDragMove);
		window.removeEventListener('pointerup', endDrag);
		window.removeEventListener('pointercancel', endDrag);
		if (!dragging) return;
		dragging = false;
		commitDrag();
	}

	async function commitDrag() {
		if (!dragEntry || typeof data === 'string') return;
		const delta = dragIndex - dragOrigin;
		if (delta === 0) return;
		const direction: 'Up' | 'Down' = delta > 0 ? 'Down' : 'Up';
		const steps = Math.abs(delta);
		toggleError = '';
		syncing = true;
		try {
			const res = await reorderPickList({
				body: {
					team: dragEntry.team,
					event_code: currentEvent,
					category: categoryName(activeTab),
					direction,
					count: steps
				}
			});
			if (res.error) {
				toggleError = 'Error code: ' + res.response.status;
			} else if (res.data.status === 'Error') {
				toggleError = 'Error from server: ' + res.data.message;
			}
			await dispatch(true);
		} catch (e) {
			toggleError = 'Failed to reach server';
		} finally {
			syncing = false;
		}
	}

	function onHandleKeydown(e: KeyboardEvent, i: number) {
		if (typeof sorted === 'string') return;
		if (e.key === 'ArrowUp' && i > 0) {
			e.preventDefault();
			moveOrder(sorted[i], 'Up');
		} else if (e.key === 'ArrowDown' && i < sorted.length - 1) {
			e.preventDefault();
			moveOrder(sorted[i], 'Down');
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
		<div class="card-list" bind:this={listEl}>
			{#each sorted as entry, i (entry.team.number + '-' + entry.team.is_ab_team)}
				<div
					class="card"
					class:dragging={dragging && dragIndex === i}
					animate:flip={{ duration: 200 }}
				>
					<div class="card-header">
						<div class="card-left">
							<span class="rank">#{i + 1}</span>
							<span class="team-num">{format_team(entry.team.number, entry.team.is_ab_team)}</span>
						</div>
						<span class="score">{scoreFor(activeTab, entry).toFixed(1)}</span>
					</div>
					<div class="stats-row">
						{#if activeTab === 'offence'}
							<div class="stat-item">
								<span class="stat-label">AUTO</span>
								<span class="stat-value">{entry.team_avg.auto_score.toFixed(1)}</span>
							</div>
							<div class="stat-item">
								<span class="stat-label">TELEOP</span>
								<span class="stat-value">{entry.team_avg.teleop_score.toFixed(1)}</span>
							</div>
						{/if}
						{#if activeTab === 'defence'}
							<div class="stat-item">
								<span class="stat-label">DEFENCE</span>
								<span class="stat-value">{entry.team_avg.defence_score.toFixed(1)}</span>
							</div>
						{/if}
						{#if entry.team_avg.dpdg_team != null}
							<div class="stat-item">
								<span class="stat-label">TEAM DPDG %</span>
								<span class="stat-value">{entry.team_avg.dpdg_team.toFixed(1)}%</span>
							</div>
						{/if}
						{#if entry.team_avg.dpdg_team_raw != null}
							<div class="stat-item">
								<span class="stat-label">TEAM DPDG PTS</span>
								<span class="stat-value">{entry.team_avg.dpdg_team_raw.toFixed(1)}</span>
							</div>
						{/if}
						{#if entry.team_avg.dpdg_alliance != null}
							<div class="stat-item">
								<span class="stat-label">ALLY DPDG %</span>
								<span class="stat-value">{entry.team_avg.dpdg_alliance.toFixed(1)}%</span>
							</div>
						{/if}
						{#if entry.team_avg.dpdg_alliance_raw != null}
							<div class="stat-item">
								<span class="stat-label">ALLY DPDG PTS</span>
								<span class="stat-value">{entry.team_avg.dpdg_alliance_raw.toFixed(1)}</span>
							</div>
						{/if}
					</div>
					<div class="card-body order-row">
						<span class="order-label">ORDER</span>
						<span class="order-val">{entry[orderKey(activeTab)]}</span>
						<button
							type="button"
							class="drag-handle"
							aria-label="Drag to reorder"
							title="Drag to reorder"
							onpointerdown={(e) => startDrag(e, i)}
							onkeydown={(e) => onHandleKeydown(e, i)}
						>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
								<circle cx="9" cy="6" r="1.6" />
								<circle cx="15" cy="6" r="1.6" />
								<circle cx="9" cy="12" r="1.6" />
								<circle cx="15" cy="12" r="1.6" />
								<circle cx="9" cy="18" r="1.6" />
								<circle cx="15" cy="18" r="1.6" />
							</svg>
							<span>DRAG</span>
						</button>
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
		animation: slideIn 0.3s ease backwards;
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

	.stats-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 1rem;
		padding: 0.5rem 0.9rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	.stat-item {
		display: flex;
		align-items: baseline;
		gap: 0.35rem;
	}

	.stat-label {
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		color: rgba(255, 255, 255, 0.35);
	}

	.stat-value {
		font-size: 0.75rem;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.7);
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

	.order-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.order-label {
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		color: rgba(255, 255, 255, 0.35);
	}

	.order-val {
		min-width: 1.5rem;
		text-align: center;
		color: #5dde8a;
		font-family: 'DM Mono', monospace;
		font-size: 0.7rem;
	}

	.drag-handle {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		margin-left: auto;
		padding: 0.25rem 0.5rem;
		background: #1a1a1a;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		color: rgba(255, 255, 255, 0.4);
		font-family: inherit;
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		line-height: 1;
		cursor: grab;
		touch-action: none;
		user-select: none;
		transition: color 0.15s, border-color 0.15s, background 0.15s;
	}

	.drag-handle:hover,
	.drag-handle:focus-visible {
		color: #5dde8a;
		border-color: rgba(60, 179, 113, 0.4);
		outline: none;
	}

	.card.dragging {
		z-index: 2;
		position: relative;
		border-color: rgba(60, 179, 113, 0.55);
		box-shadow: 0 10px 24px rgba(0, 0, 0, 0.5);
		opacity: 0.92;
	}

	.card.dragging .drag-handle {
		cursor: grabbing;
		color: #5dde8a;
		border-color: rgba(60, 179, 113, 0.5);
	}
</style>
