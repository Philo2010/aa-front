<script lang="ts">
	import { format_team } from '$lib/ParseTeam.svelte';
	import { getYears } from '$lib/schema/sdk.gen';
	import type { GamePart } from '$lib/schema/types.gen';

	let games = $state<string | GamePart[]>('Loading');

	$effect(() => {
		(async () => {
			let res = await getYears();
			if (res.error) {
				games = 'Error code: ' + res.response.status;
			} else if (res.data.status === 'Error') {
				games = 'Error from server: ' + res.data.message;
			} else {
				games = res.data.message;
				const levelOrder: Record<string, number> = {
						QualificationMatch: 0,
						Quarterfinal: 1,
						Semifinal: 2,
						Final: 3,
					};
					games.sort((a, b) => {
						const la = levelOrder[a.tournament_level] ?? 99;
						const lb = levelOrder[b.tournament_level] ?? 99;
						if (la !== lb) return la - lb;
						if (a.match_id !== b.match_id) return a.match_id - b.match_id;
						return a.set - b.set;
					});
			}
		})();
	});

	function shortLevel(level: string): string {
		switch (level) {
			case 'QualificationMatch': return 'QUAL';
			case 'Semifinal': return 'SF';
			case 'Final': return 'F';
			case 'Quarterfinal': return 'QF';
			default: return level.toUpperCase().slice(0, 4);
		}
	}

	function getScoutStatus(scout: { done: boolean; is_redo: boolean }): 'redo' | 'pending' | 'done' {
		if (scout.is_redo) return 'redo';
		if (scout.done) return 'done';
		return 'pending';
	}
</script>

<div class="page">
	<header class="page-header">
		<div class="header-accent"></div>
		<h1>ASSIGNMENTS</h1>
		<p class="subtitle">your scouting queue</p>
	</header>

	{#if typeof games === 'string'}
		<div class="state-message">{games}</div>
	{:else if games.length === 0}
		<div class="state-message">no assignments yet</div>
	{:else}
		<div class="game-list">
			{#each games as game, i}
				{@const allScouts = [
					game.scout.red_1,
					game.scout.red_2,
					game.scout.red_3,
					game.scout.blue_1,
					game.scout.blue_2,
					game.scout.blue_3
				].flat()}
				{@const activeScouts = allScouts.filter(s => s.is_redo || !s.done)}
				{@const hasMvp = game.mvp.blue || game.mvp.red}

				<article class="match-card" style="animation-delay: {i * 40}ms">
					<div class="match-meta">
						<div class="match-id">
							<span class="level-tag">{shortLevel(game.tournament_level)}</span>
							{#if game.tournament_level === 'QualificationMatch'}
								<span class="match-num">#{game.match_id}</span>
							{:else}
								<span class="match-num">set {game.set}</span>
								<span class="set-tag">m{game.match_id}</span>
							{/if}
						</div>
						<div class="event-code">{game.event_code}</div>
					</div>

					<div class="card-body">
						{#if activeScouts.length > 0}
							<div class="section-label">scout</div>
							<div class="scout-list">
								{#each activeScouts as scout}
									{@const status = getScoutStatus(scout)}
									<a
										href="/scout/page?id={scout.id}&team={format_team(scout.team.number, scout.team.is_ab_team)}{status === 'redo' ? '&edit=true' : ''}"
										class="scout-btn status-{status}"
									>
										{#if status === 'redo'}
											<span class="btn-tag">REDO</span>
										{:else}
											<span class="btn-tag">SCOUT</span>
										{/if}
										<span class="btn-team">Team {format_team(scout.team.number, scout.team.is_ab_team)}</span>
									</a>
								{/each}
							</div>
						{/if}

						{#if hasMvp}
							<div class="section-label">mvp</div>
							<div class="mvp-list">
								{#if game.mvp.blue}
									<a
										href="/scout/mvp?id={game.mvp.blue.id}&is_blue=true&game_id={game.id}"
										class="scout-btn status-mvp-blue"
									>
										<span class="btn-tag">MVP</span>
										<span class="btn-team">Blue Alliance</span>
									</a>
								{/if}
								{#if game.mvp.red}
									<a
										href="/scout/mvp?id={game.mvp.red.id}&is_blue=false&game_id={game.id}"
										class="scout-btn status-mvp-red"
									>
										<span class="btn-tag">MVP</span>
										<span class="btn-team">Red Alliance</span>
									</a>
								{/if}
							</div>
						{/if}

						{#if activeScouts.length === 0 && !hasMvp}
							<div class="all-done">all submitted</div>
						{/if}
					</div>
				</article>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 560px;
		margin: 0 auto;
		padding: 1.5rem 1rem 4rem;
	}

	.page-header {
		position: relative;
		margin-bottom: 2.5rem;
		padding-left: 1rem;
	}

	.header-accent {
		position: absolute;
		left: 0;
		top: 0.15em;
		bottom: 0.15em;
		width: 3px;
		background: #3cb371;
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
		color: rgba(255,255,255,0.35);
		text-transform: lowercase;
	}

	.state-message {
		text-align: center;
		padding: 3rem;
		color: rgba(255,255,255,0.3);
		letter-spacing: 0.1em;
		font-size: 0.85rem;
	}

	.game-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	/* ── Match card ─────────────────────────────── */
	.match-card {
		background: #1c1c1c;
		border: 1px solid rgba(255,255,255,0.07);
		border-radius: 10px;
		overflow: hidden;
		animation: slideIn 0.3s ease both;
	}

	@keyframes slideIn {
		from { opacity: 0; transform: translateY(8px); }
		to   { opacity: 1; transform: translateY(0); }
	}

	.match-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.6rem 1rem;
		background: rgba(60, 179, 113, 0.08);
		border-bottom: 1px solid rgba(60, 179, 113, 0.15);
	}

	.match-id {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.level-tag {
		font-size: 0.62rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		color: #3cb371;
		background: rgba(60, 179, 113, 0.15);
		padding: 2px 7px;
		border-radius: 3px;
	}

	.match-num {
		font-size: 1rem;
		font-weight: 700;
		color: #fff;
	}

	.set-tag {
		font-size: 0.65rem;
		color: rgba(255,255,255,0.35);
		letter-spacing: 0.05em;
	}

	.event-code {
		font-size: 0.65rem;
		letter-spacing: 0.1em;
		color: rgba(255,255,255,0.3);
		text-transform: uppercase;
	}

	/* ── Card body ──────────────────────────────── */
	.card-body {
		padding: 0.75rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.section-label {
		font-size: 0.6rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: rgba(255,255,255,0.25);
		margin-bottom: -0.2rem;
	}

	.scout-list,
	.mvp-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	/* ── Scout / MVP buttons ────────────────────── */
	.scout-btn {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		text-decoration: none;
		transition: filter 0.15s, transform 0.1s;
		border: 1px solid transparent;
	}

	.scout-btn:hover {
		filter: brightness(1.12);
		transform: translateX(3px);
	}

	.status-pending {
		background: rgba(60, 179, 113, 0.1);
		border-color: rgba(60, 179, 113, 0.25);
		color: #fff;
	}

	.status-redo {
		background: rgba(255, 160, 0, 0.1);
		border-color: rgba(255, 160, 0, 0.35);
		color: #fff;
	}

	.status-mvp-blue {
		background: rgba(80, 140, 255, 0.1);
		border-color: rgba(80, 140, 255, 0.3);
		color: #fff;
	}

	.status-mvp-red {
		background: rgba(255, 70, 70, 0.1);
		border-color: rgba(255, 70, 70, 0.3);
		color: #fff;
	}

	.btn-tag {
		font-size: 0.58rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		padding: 2px 6px;
		border-radius: 3px;
		white-space: nowrap;
	}

	.status-pending .btn-tag {
		background: rgba(60, 179, 113, 0.25);
		color: #3cb371;
	}

	.status-redo .btn-tag {
		background: rgba(255, 160, 0, 0.25);
		color: #ffa000;
	}

	.status-mvp-blue .btn-tag {
		background: rgba(80, 140, 255, 0.2);
		color: #7fb3ff;
	}

	.status-mvp-red .btn-tag {
		background: rgba(255, 70, 70, 0.2);
		color: #ff8080;
	}

	.btn-team {
		font-size: 0.85rem;
		font-weight: 600;
		color: rgba(255,255,255,0.85);
	}

	.all-done {
		font-size: 0.72rem;
		letter-spacing: 0.1em;
		color: rgba(255,255,255,0.2);
		padding: 0.25rem 0;
	}
</style>
