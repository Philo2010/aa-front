<script lang="ts">
	import FormWithLoading from '$lib/FormWithLoading.svelte';
	import { insertScout, getAllSnowgrave, bypassCheck } from '$lib/schema/sdk.gen';
	import type {
		Game,
		GameTeamDataScouter,
		MatchData,
		ScouterInsertFront,
		AllianceFront,
	} from '$lib/schema/types.gen';
	import QuickAssignPanel from './QuickAssignPanel.svelte';
	import RoundRobinPanel from './RoundRobinPanel.svelte';
	import GameCard from './GameCard.svelte';
	import { stationLabels, type RangeEntry, type BypassStatus } from './types';

	let all_games = $state<string | Array<Game>>('loading');
	let scouters = $state(new Map<number, string[]>());
	let redMvps = $state(new Map<number, string>());
	let blueMvps = $state(new Map<number, string>());

	let originalScouters = new Map<number, string[]>();
	let originalRedMvps = new Map<number, string>();
	let originalBlueMvps = new Map<number, string>();

	let masterStations = $state<RangeEntry[][]>(stationLabels.map(() => [{ user: '', begin: 1, end: 1 }]));
	let masterRedMvp = $state<RangeEntry[]>([{ user: '', begin: 1, end: 1 }]);
	let masterBlueMvp = $state<RangeEntry[]>([{ user: '', begin: 1, end: 1 }]);

	let activeTab = $state<'quick' | 'roundrobin'>('quick');

	// "Not a redo": no team on the game has any scouting data submitted yet.
	let assignableGames = $derived(typeof all_games !== 'string' ? all_games.filter(g => g.teams.every(t => !t.is_inserted)) : []);
	let maxGame = $derived(assignableGames.length || 1);
	let stop = $derived(validateForm());
	let hideDone = $state(false);

	// bypass check: maps game.id → { red: message|null, blue: message|null }
	let bypassStatus = $state(new Map<number, BypassStatus>());
	let bypassPending = $state(new Set<string>()); // "gameId-alliance"

	async function doBypass(game_id: number, alliance: AllianceFront) {
		const key = `${game_id}-${alliance}`;
		bypassPending = new Set(bypassPending).add(key);
		const res = await bypassCheck({ body: { game_id, alliance } });
		const prev = bypassStatus.get(game_id) ?? { red: null, blue: null };
		const msg = res.error
			? `Error ${res.response.status}`
			: res.data.message;
		bypassStatus = new Map(bypassStatus).set(game_id, { ...prev, [alliance]: msg });
		const next = new Set(bypassPending);
		next.delete(key);
		bypassPending = next;
	}

	function isGameDone(game: Game): boolean {
		return game.teams.every((t) => t.done);
	}

	function scoutersEqual(a: string[], b: string[]): boolean {
		if (a.length !== b.length) return false;
		return a.every((v, i) => v === b[i]);
	}

	function validateForm(): boolean {
		if (typeof all_games === 'string') return false;

		for (const game of all_games) {
			if (isGameDone(game)) continue;
			for (const team of game.teams) {
				if (team.done) continue;
				const teamScouters = scouters.get(team.id);
				if (!teamScouters || teamScouters.length === 0) return false;
				for (const s of teamScouters) {
					if (!s || s.trim() === '') return false;
				}
			}
			if (!isGameDone(game)) {
				const redMvp = redMvps.get(game.id);
				const blueMvp = blueMvps.get(game.id);
				if (!redMvp || redMvp.trim() === '') return false;
				if (!blueMvp || blueMvp.trim() === '') return false;
			}
		}
		return true;
	}

	function convertToHashMap(
		scoutersSubset: Map<number, string[]>,
		redMvpsSubset: Map<number, string>,
		blueMvpsSubset: Map<number, string>,
	): Map<string, number> {
		const result = new Map<string, number>();
		let currentId = 0;
		for (const arr of scoutersSubset.values())
			for (const s of arr)
				if (s && !result.has(s)) result.set(s, currentId++);
		for (const mvp of redMvpsSubset.values())
			if (mvp && !result.has(mvp)) result.set(mvp, currentId++);
		for (const mvp of blueMvpsSubset.values())
			if (mvp && !result.has(mvp)) result.set(mvp, currentId++);
		return result;
	}

	function format_scout_pick_data(): ScouterInsertFront {
		if (typeof all_games === 'string') throw new Error('Games not loaded');

		const changedScouters = new Map<number, string[]>();
		const changedRedMvps = new Map<number, string>();
		const changedBlueMvps = new Map<number, string>();

		for (const game of all_games) {
			if (isGameDone(game)) continue;
			const currentRed = redMvps.get(game.id) ?? '';
			const currentBlue = blueMvps.get(game.id) ?? '';
			if (currentRed !== (originalRedMvps.get(game.id) ?? '')) changedRedMvps.set(game.id, currentRed);
			if (currentBlue !== (originalBlueMvps.get(game.id) ?? '')) changedBlueMvps.set(game.id, currentBlue);
			for (const team of game.teams) {
				if (team.done) continue;
				const current = scouters.get(team.id) ?? [];
				const original = originalScouters.get(team.id) ?? [];
				if (!scoutersEqual(current, original)) changedScouters.set(team.id, current);
			}
		}

		const player_indexs = convertToHashMap(changedScouters, changedRedMvps, changedBlueMvps);
		const matches: MatchData[] = [];

		for (const game of all_games) {
			const hasScouterChange = game.teams.some((t) => changedScouters.has(t.id));
			const hasRedMvpChange = changedRedMvps.has(game.id);
			const hasBlueVpChange = changedBlueMvps.has(game.id);
			if (!hasScouterChange && !hasRedMvpChange && !hasBlueVpChange) continue;

			const mvpForGame = {
				red: changedRedMvps.get(game.id) ?? redMvps.get(game.id) ?? '',
				blue: changedBlueMvps.get(game.id) ?? blueMvps.get(game.id) ?? '',
			};

			// Only include teams whose scouters actually changed.
			// Each entry carries the game's current MVP so the backend can update it.
			let emittedMvp = false;
			for (const team of game.teams) {
				if (!changedScouters.has(team.id)) continue;
				const teamScouters = changedScouters.get(team.id)!;
				const player_team_index: GameTeamDataScouter[] = teamScouters
					.map((p) => { const idx = player_indexs.get(p); return idx !== undefined ? { index: idx } : null; })
					.filter((x): x is GameTeamDataScouter => x !== null);
				matches.push({ upcoming_team_id: team.id, game_scouters: player_team_index, mvp: mvpForGame });
				emittedMvp = true;
			}

			// MVP-only change: send one entry with empty game_scouters so the backend
			// updates the MVP without touching any game_scouts rows.
			if (!emittedMvp && (hasRedMvpChange || hasBlueVpChange)) {
				const anyTeam = game.teams.find((t) => !t.done);
				if (anyTeam) {
					matches.push({ upcoming_team_id: anyTeam.id, game_scouters: [], mvp: mvpForGame });
				}
			}
		}

		const final_player_indexs = Array.from(player_indexs.entries())
			.sort((a, b) => a[1] - b[1])
			.map(([name]) => name);

		return { player_indexs: final_player_indexs, matches };
	}

	function resetAllAssignments() {
		if (typeof all_games === 'string') return;
		const newScouters = new Map<number, string[]>();
		const newRedMvps = new Map<number, string>();
		const newBlueMvps = new Map<number, string>();
		all_games.forEach((game) => {
			game.teams.forEach((team) => newScouters.set(team.id, []));
			newRedMvps.set(game.id, '');
			newBlueMvps.set(game.id, '');
		});
		scouters = newScouters;
		redMvps = newRedMvps;
		blueMvps = newBlueMvps;
		originalScouters = new Map(Array.from(newScouters.entries()).map(([k, v]) => [k, [...v]]));
		originalRedMvps = new Map(newRedMvps);
		originalBlueMvps = new Map(newBlueMvps);
		masterStations = stationLabels.map(() => [{ user: '', begin: 1, end: 1 }]);
		masterRedMvp = [{ user: '', begin: 1, end: 1 }];
		masterBlueMvp = [{ user: '', begin: 1, end: 1 }];
	}

	$effect(() => {
		(async () => {
			let res = await getAllSnowgrave();
			if (res.error) {
				all_games = 'Failed with code: ' + String(res.response.status);
			} else if (res.data.status === 'Error') {
				all_games = 'Error from server: ' + res.data.message;
			} else {
				all_games = res.data.message;
				all_games.sort((a, b) => {
					if (a.tournament_level === b.tournament_level) return a.match_id - b.match_id;
					if (a.tournament_level === 'QualificationMatch') return 1;
					if (b.tournament_level === 'QualificationMatch') return -1;
					return a.tournament_level.localeCompare(b.tournament_level);
				});

				const newScouters = new Map<number, string[]>();
				const newRedMvps = new Map<number, string>();
				const newBlueMvps = new Map<number, string>();
				all_games.forEach((game) => {
					game.teams.forEach((team) => {
						newScouters.set(team.id, team.scouters?.length ? [...team.scouters] : []);
					});
					newRedMvps.set(game.id, game.mvp_red || '');
					newBlueMvps.set(game.id, game.mvp_blue || '');
				});
				scouters = newScouters;
				redMvps = newRedMvps;
				blueMvps = newBlueMvps;
				originalScouters = new Map(Array.from(newScouters.entries()).map(([k, v]) => [k, [...v]]));
				originalRedMvps = new Map(newRedMvps);
				originalBlueMvps = new Map(newBlueMvps);
			}
		})();
	});

	function updateScouter(teamId: number, index: number, value: string) {
		const t = scouters.get(teamId);
		if (t) { t[index] = value; scouters = new Map(scouters); }
	}

	function addScouter(teamId: number) {
		if (!scouters.has(teamId)) scouters.set(teamId, []);
		scouters.get(teamId)!.push('');
		scouters = new Map(scouters);
	}

	function removeScouter(teamId: number, index: number) {
		const t = scouters.get(teamId);
		if (t) { t.splice(index, 1); scouters = new Map(scouters); }
	}

	function updateRedMvp(gameId: number, value: string) {
		redMvps.set(gameId, value); redMvps = new Map(redMvps);
	}

	function updateBlueMvp(gameId: number, value: string) {
		blueMvps.set(gameId, value); blueMvps = new Map(blueMvps);
	}

	function applyMasterToAllGames() {
		if (typeof all_games === 'string') return;
		const newScouters = new Map<number, string[]>();
		const newRedMvps = new Map<number, string>();
		const newBlueMvps = new Map<number, string>();

		let undoneIndex = 0;
		all_games.forEach((game) => {
			if (game.teams.some(t => t.is_inserted)) {
				game.teams.forEach((team) => newScouters.set(team.id, scouters.get(team.id) ?? []));
				newRedMvps.set(game.id, redMvps.get(game.id) ?? '');
				newBlueMvps.set(game.id, blueMvps.get(game.id) ?? '');
				return;
			}
			const gameNum = ++undoneIndex;
			newRedMvps.set(game.id, '');
			newBlueMvps.set(game.id, '');
			game.teams.forEach((team, teamIndex) => {
				if (team.done) { newScouters.set(team.id, scouters.get(team.id) ?? []); return; }
				newScouters.set(team.id, []);
				if (teamIndex < 6) {
					for (const entry of masterStations[teamIndex]) {
						if (entry.user && gameNum >= entry.begin && gameNum <= entry.end) {
							newScouters.get(team.id)!.push(entry.user);
						}
					}
				}
			});
			for (const entry of masterRedMvp)
				if (entry.user && gameNum >= entry.begin && gameNum <= entry.end)
					newRedMvps.set(game.id, entry.user);
			for (const entry of masterBlueMvp)
				if (entry.user && gameNum >= entry.begin && gameNum <= entry.end)
					newBlueMvps.set(game.id, entry.user);
		});

		scouters = newScouters;
		redMvps = newRedMvps;
		blueMvps = newBlueMvps;
	}

	// Round robin: rotate a 6-wide window of stations across the given scouter
	// list, advancing by 6 each game. Since the window slides at a fixed step
	// over a circular list, every scouter's number of appearances (and breaks)
	// stays within one of another across the whole run, regardless of list size.
	function applyRoundRobin(scouterList: string[]) {
		if (typeof all_games === 'string') return;
		if (scouterList.length < 7) return;

		const newScouters = new Map(scouters);
		assignableGames.forEach((game, gameIndex) => {
			game.teams.forEach((team, teamIndex) => {
				if (team.done || teamIndex >= 6) return;
				const scouter = scouterList[(gameIndex * 6 + teamIndex) % scouterList.length];
				newScouters.set(team.id, [scouter]);
			});
		});
		scouters = newScouters;
	}

	async function dispatch(): Promise<{ message: string; worked: boolean }> {
		let data = format_scout_pick_data();
		let res = await insertScout({ body: data });
		if (res.error) return { message: 'Error: ' + String(res.response.status), worked: false };
		if (res.data.status === 'Error') return { message: res.data.message, worked: false };
		return { message: res.data.message, worked: true };
	}

	function shortLevel(level: string): string {
		switch (level) {
			case 'QualificationMatch': return 'QUAL';
			case 'Semifinal': return 'SF';
			case 'Final': return 'F';
			case 'Quarterfinal': return 'QF';
			default: return level.slice(0, 4).toUpperCase();
		}
	}
</script>

{#if typeof all_games === 'string'}
	<div class="state">{all_games}</div>
{:else}
	<!-- ── Assign tools: Quick Assign / Round Robin ──── -->
	<div class="tools-panel">
		<div class="tabs-header">
			<button
				type="button"
				class="tab-btn"
				class:active={activeTab === 'quick'}
				onclick={() => activeTab = 'quick'}
			>Quick Assign</button>
			<button
				type="button"
				class="tab-btn"
				class:active={activeTab === 'roundrobin'}
				onclick={() => activeTab = 'roundrobin'}
			>Round Robin</button>
		</div>

		{#if activeTab === 'quick'}
			<QuickAssignPanel
				bind:masterStations
				bind:masterRedMvp
				bind:masterBlueMvp
				{maxGame}
				{assignableGames}
				onApply={applyMasterToAllGames}
				onReset={resetAllAssignments}
			/>
		{:else}
			<RoundRobinPanel {assignableGames} onGenerate={applyRoundRobin} />
		{/if}
	</div>

	<!-- ── Per-game list ──────────────────────────────── -->
	<FormWithLoading stop={!stop} {dispatch} submitLabel="Save assignments">
		<div class="list-controls">
			<button type="button" class="btn-hide-done" onclick={() => hideDone = !hideDone}>
				{hideDone ? 'Show done' : 'Hide done'}
			</button>
		</div>
		<div class="game-list">
			{#each (hideDone ? all_games.filter(g => !isGameDone(g)) : all_games) as game}
				<GameCard
					{game}
					done={isGameDone(game)}
					{scouters}
					{redMvps}
					{blueMvps}
					{bypassStatus}
					{bypassPending}
					onUpdateScouter={updateScouter}
					onAddScouter={addScouter}
					onRemoveScouter={removeScouter}
					onUpdateRedMvp={updateRedMvp}
					onUpdateBlueMvp={updateBlueMvp}
					onBypass={doBypass}
					{shortLevel}
				/>
			{/each}
		</div>
	</FormWithLoading>
{/if}

<style>
	/* ── Page state ──────────────────────── */
	.state {
		padding: 3rem;
		text-align: center;
		color: rgba(255,255,255,0.35);
		letter-spacing: 0.08em;
	}

	/* ── Tools panel (Quick Assign / Round Robin) ──── */
	.tools-panel {
		background: #181818;
		border: 1px solid rgba(255,255,255,0.08);
		border-radius: 10px;
		margin-bottom: 1.25rem;
		overflow: hidden;
	}

	.tabs-header {
		display: flex;
		border-bottom: 1px solid rgba(255,255,255,0.07);
	}

	.tab-btn {
		flex: 1;
		background: transparent;
		border: none;
		border-bottom: 2px solid transparent;
		color: rgba(255,255,255,0.35);
		cursor: pointer;
		font-family: inherit;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		padding: 0.75rem 1.1rem;
		transition: color 0.15s, border-color 0.15s;
	}

	.tab-btn:hover { color: rgba(255,255,255,0.6); }

	.tab-btn.active {
		color: #fff;
		border-bottom-color: #3cb371;
	}

	/* ── Game list ───────────────────────── */
	.list-controls {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 0.5rem;
	}

	.btn-hide-done {
		background: rgba(255,255,255,0.05);
		border: 1px solid rgba(255,255,255,0.12);
		border-radius: 6px;
		color: rgba(255,255,255,0.5);
		cursor: pointer;
		font-size: 0.7rem;
		letter-spacing: 0.08em;
		padding: 0.3rem 0.8rem;
		transition: color 0.15s, border-color 0.15s;
	}

	.btn-hide-done:hover { color: #fff; border-color: rgba(255,255,255,0.3); }

	.game-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 1rem;
	}
</style>
