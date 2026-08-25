<script lang="ts">
	import UserSelector from '$lib/UserSelector.svelte';
	import { fetchUsers, getUsers, subscribe } from '$lib/store/users.svelte';

	const MIN_SCOUTERS = 1;

	let {
		redoTeams,
		onGenerate,
	}: {
		redoTeams: Array<{ id: number; label: string }>;
		onGenerate: (scouterList: string[]) => void;
	} = $props();

	let allUsers = $state(getUsers());
	$effect(() => {
		fetchUsers();
		return subscribe(() => { allUsers = getUsers(); });
	});

	let rows = $state<string[]>(['']);

	let validNames = $derived(rows.map((r) => r.trim()).filter((r) => r !== ''));
	let canGenerate = $derived(validNames.length >= MIN_SCOUTERS && redoTeams.length > 0);

	function addRow() {
		rows.push('');
		rows = [...rows];
	}

	function removeRow(index: number) {
		if (rows.length <= 1) return;
		rows.splice(index, 1);
		rows = [...rows];
	}

	function addAllUsers() {
		if (!allUsers) return;
		const existing = new Set(rows.map((r) => r.trim()).filter((r) => r !== ''));
		const missing = allUsers.filter((u) => !existing.has(u));
		rows = [...rows.filter((r) => r.trim() !== ''), ...missing];
		if (rows.length === 0) rows = [''];
	}

	function clearAll() {
		rows = [''];
	}

	function generate() {
		if (!canGenerate) return;
		onGenerate(validNames);
	}
</script>

<div class="rr-body">
	<p class="rr-blurb">
		Pick who should pick up redo work. Every team currently flagged for a redo gets a
		<strong>new</strong> scouter, rotating through this list — kept completely separate from the
		normal Round Robin above, so the two rotations never share a list or overlap.
	</p>

	<div class="rr-rows">
		{#each rows as name, i}
			<div class="range-row">
				<UserSelector bind:value={rows[i]} />
				<button
					type="button"
					class="icon-btn remove"
					disabled={rows.length <= 1}
					onclick={() => removeRow(i)}
				>✕</button>
			</div>
		{/each}
	</div>

	<div class="rr-row-actions">
		<button type="button" class="add-row-btn" onclick={addRow}>+ scouter</button>
		<button type="button" class="add-row-btn" onclick={addAllUsers}>+ add everyone</button>
		<button type="button" class="add-row-btn" onclick={clearAll}>clear</button>
	</div>

	{#if redoTeams.length > 0}
		<div class="redo-list">
			{#each redoTeams as t (t.id)}
				<span class="redo-chip">{t.label}</span>
			{/each}
		</div>
	{/if}

	<div class="rr-status">
		<span class:short={validNames.length < MIN_SCOUTERS}>
			{validNames.length} selected (need {MIN_SCOUTERS}+)
		</span>
		<span class="rr-game-count">{redoTeams.length} team(s) flagged for redo</span>
	</div>

	<div class="quick-actions">
		<button type="button" class="btn-apply" disabled={!canGenerate} onclick={generate}>
			Generate redo round robin
		</button>
	</div>
</div>

<style>
	.rr-body {
		padding: 1rem 1.1rem 1.2rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.rr-blurb {
		font-size: 0.72rem;
		line-height: 1.4;
		color: rgba(255,255,255,0.4);
		margin: 0;
	}

	.rr-rows {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.range-row {
		display: flex;
		gap: 5px;
		align-items: center;
	}

	.range-row :global(.user-selector) {
		flex: 1;
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
		flex-shrink: 0;
	}

	.icon-btn.remove:hover:not(:disabled) { color: #e05555; border-color: #e05555; }
	.icon-btn:disabled { opacity: 0.3; cursor: not-allowed; }

	.rr-row-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

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
	}

	.add-row-btn:hover { color: #fff; border-color: rgba(255,255,255,0.35); }

	.redo-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.redo-chip {
		background: rgba(224,165,85,0.12);
		border: 1px solid rgba(224,165,85,0.35);
		border-radius: 4px;
		color: #e0a555;
		font-size: 0.65rem;
		padding: 2px 6px;
		letter-spacing: 0.03em;
	}

	.rr-status {
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.4rem;
		font-size: 0.65rem;
		color: rgba(255,255,255,0.4);
		letter-spacing: 0.04em;
	}

	.rr-status .short { color: #e0a555; }

	.rr-game-count {
		color: rgba(255,255,255,0.25);
	}

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

	.btn-apply:hover:not(:disabled) { background: rgba(60,179,113,0.25); }
	.btn-apply:disabled { opacity: 0.35; cursor: not-allowed; }
</style>
