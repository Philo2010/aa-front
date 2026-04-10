<script lang="ts">
	import { format_team } from '$lib/ParseTeam.svelte';
	import { getForScout } from '$lib/schema/sdk.gen';
	import type { PitScouterInstance } from '$lib/schema/types.gen';
	let data: Array<PitScouterInstance> | string = $state('loading');

	$effect(() => {
		(async () => {
			let res = await getForScout();
			if (res.error) {
				data = 'Error code: ' + res.response.status;
			} else if (res.data.status === 'Error') {
				data = 'Error from server: ' + res.data.message;
			} else {
				data = res.data.message;
			}
		})();
	});
</script>

<div class="page">
	<header class="page-header">
		<div class="header-accent"></div>
		<h1>PIT</h1>
		<p class="subtitle">your assignments</p>
	</header>

	{#if typeof data === 'string'}
		<p class="state-message">{data}</p>
	{:else if data.length === 0}
		<p class="state-message">no assignments</p>
	{:else}
		<div class="card-list">
			{#each data as game, i}
				<div class="card" style="animation-delay: {i * 40}ms">
					<div class="card-header">
						<div class="card-left">
							<span class="team-num">{format_team(game.team, game.is_ab_team)}</span>
							<span class="event-code">{game.event}</span>
						</div>
						<span class="status-tag" class:redo={game.is_sum} class:fresh={!game.is_sum}>
							{game.is_sum ? 'REDO' : 'NEW'}
						</span>
					</div>
					<div class="card-body">
						<a
							href={game.is_sum
								? `/pit/edit?id=${game.id}&team=${format_team(game.team, game.is_ab_team)}&team_num=${game.team}&is_ab_team=${game.is_ab_team}&event_code=${game.event}`
								: `/pit/insert?id=${game.id}&team=${format_team(game.team, game.is_ab_team)}`}
							class="action-btn"
							class:btn-amber={game.is_sum}
							class:btn-green={!game.is_sum}
						>
							{game.is_sum ? 'Redo Pit' : 'Start Pit'}
						</a>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 480px;
		margin: 0 auto;
		padding: 1.5rem 1rem 4rem;
	}

	/* ── Header ─────────────────────────── */
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
		border-radius: 2px;
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

	/* ── Empty / loading ─────────────────── */
	.state-message {
		text-align: center;
		padding: 3rem;
		color: rgba(255, 255, 255, 0.30);
		letter-spacing: 0.10em;
		font-size: 0.85rem;
	}

	/* ── Card list ───────────────────────── */
	.card-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	@keyframes slideIn {
		from { opacity: 0; transform: translateY(8px); }
		to   { opacity: 1; transform: translateY(0); }
	}

	.card {
		background: #191919;
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 10px;
		overflow: hidden;
		animation: slideIn 0.3s ease both;
	}

	/* ── Card header strip ───────────────── */
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

	.team-num {
		font-size: 1rem;
		font-weight: 700;
		color: #fff;
	}

	.event-code {
		font-size: 0.72rem;
		letter-spacing: 0.08em;
		color: rgba(255, 255, 255, 0.35);
	}

	/* ── Status tag ──────────────────────── */
	.status-tag {
		font-size: 0.58rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		padding: 2px 7px;
		border-radius: 3px;
	}

	.status-tag.redo {
		background: rgba(255, 160, 0, 0.20);
		color: #ffa000;
		border: 1px solid rgba(255, 160, 0, 0.35);
	}

	.status-tag.fresh {
		background: rgba(60, 179, 113, 0.15);
		color: #3cb371;
		border: 1px solid rgba(60, 179, 113, 0.30);
	}

	/* ── Card body ───────────────────────── */
	.card-body {
		padding: 0.65rem 0.9rem;
	}

	/* ── Action button ───────────────────── */
	.action-btn {
		display: block;
		width: 100%;
		padding: 0.6rem 1rem;
		border-radius: 7px;
		font-family: inherit;
		font-size: 0.82rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-align: center;
		text-decoration: none;
		cursor: pointer;
		transition: background 0.15s;
		touch-action: manipulation;
	}

	.action-btn:active {
		transform: scale(0.97);
	}

	.btn-green {
		background: rgba(60, 179, 113, 0.15);
		border: 1px solid rgba(60, 179, 113, 0.35);
		color: #5dde8a;
	}

	.btn-green:hover {
		background: rgba(60, 179, 113, 0.25);
	}

	.btn-amber {
		background: rgba(255, 160, 0, 0.12);
		border: 1px solid rgba(255, 160, 0, 0.30);
		color: #ffa000;
	}

	.btn-amber:hover {
		background: rgba(255, 160, 0, 0.22);
	}
</style>
