<script lang="ts">
	import { goto } from '$app/navigation';
	import { checkadmin } from '$lib/checkadminship';
	import { getLeaderboard } from '$lib/schema/sdk.gen';
	import type { SnowScouterDataLeaderBoard } from '$lib/schema/types.gen';

	if (!checkadmin()) {
		goto('/notallowed');
	}

	let data = $state<SnowScouterDataLeaderBoard[]>();
	let loading = $state(true);
	let failed = $state<string | null>();
	$effect(() => {
		(async () => {
			let res = await getLeaderboard();
			if (res.error) {
				loading = false;
				failed = 'Error connecting to db: ' + res.response.status;
			} else {
				if (res.data.status === 'Error') {
					loading = false;
					failed = 'Error from db: ' + res.data.message;
				} else {
					loading = false;
					data = res.data.message;
					data.sort((a, b) => b.amount_of_warning - a.amount_of_warning);
				}
			}
		})();
	});
</script>

<div class="page">
	<h1>Leaderboard</h1>

	{#if loading}
		<p class="status">Loading...</p>
	{:else if failed}
		<p class="status error">{failed}</p>
	{:else if data && data.length > 0}
		<div class="board">
			{#each data as scouter, i}
				<div class="row" class:gold={i === 0} class:silver={i === 1} class:bronze={i === 2}>
					<span class="rank">{i + 1}</span>
					<span class="name">{scouter.username}</span>
					<span class="warnings">
						{scouter.amount_of_warning}
						<span class="label">warning{scouter.amount_of_warning === 1 ? '' : 's'}</span>
					</span>
				</div>
			{/each}
		</div>
	{:else}
		<p class="status">No scouters found</p>
	{/if}
</div>

<style>
	.page {
		max-width: 500px;
		margin: 0 auto;
	}

	h1 {
		font-size: 1.6rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		margin-bottom: 1.2rem;
	}

	.status {
		color: #888;
		font-size: 0.9rem;
	}

	.status.error {
		color: #ff6b6b;
	}

	.board {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 16px;
		background: #1e1e1e;
		border: 1px solid #2a2a2a;
		border-radius: 8px;
		transition: background 0.12s;
	}

	.row:hover {
		background: #252525;
	}

	.row.gold {
		border-color: #b8860b;
		background: linear-gradient(135deg, #2a2200 0%, #1e1e1e 60%);
	}

	.row.silver {
		border-color: #6b6b6b;
		background: linear-gradient(135deg, #222222 0%, #1e1e1e 60%);
	}

	.row.bronze {
		border-color: #8b4513;
		background: linear-gradient(135deg, #261a0e 0%, #1e1e1e 60%);
	}

	.rank {
		font-size: 1.1rem;
		min-width: 32px;
		text-align: center;
		color: #666;
		font-weight: 700;
	}


	.name {
		flex: 1;
		font-weight: 600;
		font-size: 0.95rem;
		color: #e0e0e0;
	}

	.warnings {
		font-size: 1.1rem;
		font-weight: 700;
		color: #ff6b6b;
		font-variant-numeric: tabular-nums;
	}

	.warnings .label {
		font-size: 0.7rem;
		font-weight: 400;
		color: #666;
		margin-left: 4px;
	}
</style>
