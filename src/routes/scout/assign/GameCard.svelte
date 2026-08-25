<script lang="ts">
	import { format_team } from '$lib/ParseTeam.svelte';
	import UserSelector from '$lib/UserSelector.svelte';
	import type { AllianceFront, Game } from '$lib/schema/types.gen';
	import type { BypassStatus } from './types';

	let {
		game,
		done,
		scouters,
		redMvps,
		blueMvps,
		bypassStatus,
		bypassPending,
		onUpdateScouter,
		onAddScouter,
		onRemoveScouter,
		onUpdateRedMvp,
		onUpdateBlueMvp,
		onBypass,
		shortLevel,
	}: {
		game: Game;
		done: boolean;
		scouters: Map<number, string[]>;
		redMvps: Map<number, string>;
		blueMvps: Map<number, string>;
		bypassStatus: Map<number, BypassStatus>;
		bypassPending: Set<string>;
		onUpdateScouter: (teamId: number, index: number, value: string) => void;
		onAddScouter: (teamId: number) => void;
		onRemoveScouter: (teamId: number, index: number) => void;
		onUpdateRedMvp: (gameId: number, value: string) => void;
		onUpdateBlueMvp: (gameId: number, value: string) => void;
		onBypass: (gameId: number, alliance: AllianceFront) => void;
		shortLevel: (level: string) => string;
	} = $props();
</script>

<div class="match-card" class:is-done={done}>
	<!-- Header -->
	<div class="match-header">
		<div class="match-id">
			<span class="level-tag">{shortLevel(game.tournament_level)}</span>
			<span class="match-num">#{game.match_id}</span>
			{#if game.set > 1}<span class="set-tag">set {game.set}</span>{/if}
		</div>
		<div class="match-right">
			<span class="event-tag">{game.event_code}</span>
			{#if done}<span class="done-pill">DONE</span>{/if}
		</div>
	</div>

	<!-- Stations: red | blue -->
	{#if !done}
		<div class="alliances">
			<!-- Red stations -->
			<div class="alliance red-alliance">
				{#each game.teams.filter(t => t.station.startsWith('Red')) as team}
					<div class="team-row" class:team-locked={team.done}>
						<span class="station-pip red-pip">{team.station.replace('Red','R')}</span>
						<span class="team-num">{format_team(team.team, team.is_ab_team)}</span>
						{#if team.done}
							{#each scouters.get(team.id) ?? [] as s}
								<span class="locked-name">{s}</span>
							{/each}
						{:else}
							<div class="scouter-inputs">
								{#each scouters.get(team.id) ?? [] as scouter, i}
									<div class="scouter-chip">
										<UserSelector
											value={scouter}
											onchange={(v) => onUpdateScouter(team.id, i, v)}
										/>
										<button
											type="button"
											class="icon-btn remove inline"
											onclick={() => onRemoveScouter(team.id, i)}
										>✕</button>
									</div>
								{/each}
								<button
									type="button"
									class="add-scout-btn"
									onclick={() => onAddScouter(team.id)}
								>+</button>
							</div>
						{/if}
					</div>
				{/each}
			</div>

			<!-- Blue stations -->
			<div class="alliance blue-alliance">
				{#each game.teams.filter(t => t.station.startsWith('Blue')) as team}
					<div class="team-row" class:team-locked={team.done}>
						<span class="station-pip blue-pip">{team.station.replace('Blue','B')}</span>
						<span class="team-num">{format_team(team.team, team.is_ab_team)}</span>
						{#if team.done}
							{#each scouters.get(team.id) ?? [] as s}
								<span class="locked-name">{s}</span>
							{/each}
						{:else}
							<div class="scouter-inputs">
								{#each scouters.get(team.id) ?? [] as scouter, i}
									<div class="scouter-chip">
										<UserSelector
											value={scouter}
											onchange={(v) => onUpdateScouter(team.id, i, v)}
										/>
										<button
											type="button"
											class="icon-btn remove inline"
											onclick={() => onRemoveScouter(team.id, i)}
										>✕</button>
									</div>
								{/each}
								<button
									type="button"
									class="add-scout-btn"
									onclick={() => onAddScouter(team.id)}
								>+</button>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- MVP bar -->
		<div class="mvp-bar">
			<div class="mvp-field">
				<span class="mvp-label red-label">Red MVP</span>
				<UserSelector
					value={redMvps.get(game.id) ?? ''}
					onchange={(v) => onUpdateRedMvp(game.id, v)}
				/>
			</div>
			<div class="mvp-field">
				<span class="mvp-label blue-label">Blue MVP</span>
				<UserSelector
					value={blueMvps.get(game.id) ?? ''}
					onchange={(v) => onUpdateBlueMvp(game.id, v)}
				/>
			</div>
		</div>

		<!-- Bypass bar -->
		{@const bp = bypassStatus.get(game.id)}
		<div class="bypass-bar">
			<div class="bypass-field">
				<button
					type="button"
					class="bypass-btn red-bypass"
					disabled={bypassPending.has(`${game.id}-red`)}
					onclick={() => onBypass(game.id, 'red')}
				>BYPASS RED</button>
				{#if bp?.red}<span class="bypass-msg">{bp.red}</span>{/if}
			</div>
			<div class="bypass-field">
				<button
					type="button"
					class="bypass-btn blue-bypass"
					disabled={bypassPending.has(`${game.id}-blue`)}
					onclick={() => onBypass(game.id, 'blue')}
				>BYPASS BLUE</button>
				{#if bp?.blue}<span class="bypass-msg">{bp.blue}</span>{/if}
			</div>
		</div>
	{:else}
		<!-- Compact done view -->
		<div class="done-summary">
			{#each game.teams as team}
				<span class="done-team" class:red-team={team.station.startsWith('Red')} class:blue-team={team.station.startsWith('Blue')}>
					{format_team(team.team, team.is_ab_team)}
				</span>
			{/each}
		</div>
	{/if}
</div>

<style>
	.match-card {
		background: #191919;
		border: 1px solid rgba(255,255,255,0.07);
		border-radius: 10px;
		overflow: hidden;
	}

	.match-card.is-done {
		opacity: 0.4;
		pointer-events: none;
	}

	/* Match header */
	.match-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0.9rem;
		background: rgba(255,255,255,0.03);
		border-bottom: 1px solid rgba(255,255,255,0.06);
	}

	.match-id {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.level-tag {
		font-size: 0.58rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		padding: 2px 6px;
		border-radius: 3px;
		background: rgba(60,179,113,0.15);
		color: #3cb371;
	}

	.match-num {
		font-size: 0.9rem;
		font-weight: 700;
		color: #fff;
	}

	.set-tag {
		font-size: 0.6rem;
		color: rgba(255,255,255,0.3);
	}

	.match-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.event-tag {
		font-size: 0.6rem;
		letter-spacing: 0.1em;
		color: rgba(255,255,255,0.25);
		text-transform: uppercase;
	}

	.done-pill {
		font-size: 0.58rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		background: rgba(255,215,0,0.15);
		color: #ffd700;
		padding: 2px 7px;
		border-radius: 3px;
	}

	/* Alliances */
	.alliances {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0;
		border-bottom: 1px solid rgba(255,255,255,0.06);
	}

	.alliance {
		padding: 0.6rem 0.8rem;
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}

	.red-alliance  { border-right: 1px solid rgba(255,255,255,0.06); }

	@media (max-width: 520px) {
		.alliances {
			grid-template-columns: 1fr;
		}
		.red-alliance {
			border-right: none;
			border-bottom: 1px solid rgba(255,255,255,0.06);
		}
	}

	.team-row {
		display: flex;
		align-items: flex-start;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	.team-row.team-locked { opacity: 0.5; }

	.station-pip {
		font-size: 0.6rem;
		font-weight: 700;
		padding: 2px 5px;
		border-radius: 3px;
		letter-spacing: 0.05em;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.red-pip  { background: rgba(220,60,60,0.2); color: #e06060; }
	.blue-pip { background: rgba(60,110,220,0.2); color: #6699ee; }

	.team-num {
		font-size: 0.8rem;
		font-weight: 600;
		color: rgba(255,255,255,0.75);
		flex-shrink: 0;
		margin-top: 3px;
	}

	.scouter-inputs {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		align-items: center;
	}

	.scouter-chip {
		display: flex;
		align-items: center;
		gap: 2px;
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
	.icon-btn.inline { padding: 1px 4px; }

	.add-scout-btn {
		background: transparent;
		border: 1px dashed rgba(255,255,255,0.15);
		border-radius: 4px;
		color: rgba(255,255,255,0.3);
		cursor: pointer;
		font-size: 0.75rem;
		padding: 1px 8px;
		line-height: 1.5;
		transition: color 0.15s, border-color 0.15s;
	}

	.add-scout-btn:hover { color: #fff; border-color: rgba(255,255,255,0.4); }

	.locked-name {
		font-size: 0.75rem;
		color: rgba(255,255,255,0.5);
		font-style: italic;
	}

	/* MVP bar */
	.mvp-bar {
		display: flex;
		gap: 0;
		padding: 0.5rem 0.8rem;
		flex-wrap: wrap;
	}

	.mvp-field {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		min-width: 140px;
	}

	.mvp-field:first-child {
		padding-right: 1rem;
		border-right: 1px solid rgba(255,255,255,0.06);
		margin-right: 1rem;
	}

	@media (max-width: 420px) {
		.mvp-bar { flex-direction: column; gap: 0.5rem; }
		.mvp-field:first-child {
			padding-right: 0;
			border-right: none;
			margin-right: 0;
			padding-bottom: 0.5rem;
			border-bottom: 1px solid rgba(255,255,255,0.06);
		}
	}

	.mvp-label {
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		white-space: nowrap;
	}

	.red-label  { color: #e05555; }
	.blue-label { color: #5588ee; }

	/* Bypass bar */
	.bypass-bar {
		display: flex;
		gap: 0.4rem;
		padding: 0.4rem 0.8rem 0.5rem;
		border-top: 1px solid rgba(255,255,255,0.05);
		flex-wrap: wrap;
	}

	.bypass-field {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		min-width: 120px;
	}

	.bypass-btn {
		font-size: 0.58rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		padding: 3px 8px;
		border-radius: 4px;
		cursor: pointer;
		font-family: inherit;
		transition: background 0.12s;
		white-space: nowrap;
	}

	.bypass-btn:disabled { opacity: 0.4; cursor: not-allowed; }

	.red-bypass {
		background: rgba(220, 60, 60, 0.1);
		border: 1px solid rgba(220, 60, 60, 0.3);
		color: #e06060;
	}

	.red-bypass:hover:not(:disabled) { background: rgba(220, 60, 60, 0.2); }

	.blue-bypass {
		background: rgba(60, 110, 220, 0.1);
		border: 1px solid rgba(60, 110, 220, 0.3);
		color: #6699ee;
	}

	.blue-bypass:hover:not(:disabled) { background: rgba(60, 110, 220, 0.2); }

	.bypass-msg {
		font-size: 0.65rem;
		color: rgba(255,255,255,0.45);
		letter-spacing: 0.04em;
	}

	/* Done summary */
	.done-summary {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		padding: 0.5rem 0.9rem;
	}

	.done-team {
		font-size: 0.7rem;
		padding: 2px 7px;
		border-radius: 4px;
	}

	.red-team  { background: rgba(220,60,60,0.1);  color: rgba(220,100,100,0.7); }
	.blue-team { background: rgba(60,110,220,0.1); color: rgba(100,140,220,0.7); }
</style>
