<script lang="ts">
	import FormWithLoading from '$lib/FormWithLoading.svelte';
	import { format_team } from '$lib/ParseTeam.svelte';
	import { insertScout, getAllSnowgrave, bypassCheck } from '$lib/schema/sdk.gen';
	import type {
		Game,
		GameTeamDataScouter,
		MatchData,
		ScouterInsertFront,
		AllianceFront,
	} from '$lib/schema/types.gen';
	import DualRangeSlider from '$lib/DualRangeSlider.svelte';
	import UserSelector from '$lib/UserSelector.svelte';

	let all_games = $state<string | Array<Game>>('loading');
	let scouters = $state(new Map<number, string[]>());
	let redMvps = $state(new Map<number, string>());
	let blueMvps = $state(new Map<number, string>());

	let originalScouters = new Map<number, string[]>();
	let originalRedMvps = new Map<number, string>();
	let originalBlueMvps = new Map<number, string>();

	const stationLabels = ['Red 1', 'Red 2', 'Red 3', 'Blue 1', 'Blue 2', 'Blue 3'];

	type RangeEntry = { user: string; begin: number; end: number };
	let masterStations = $state<RangeEntry[][]>(stationLabels.map(() => [{ user: '', begin: 1, end: 1 }]));
	let masterRedMvp = $state<RangeEntry[]>([{ user: '', begin: 1, end: 1 }]);
	let masterBlueMvp = $state<RangeEntry[]>([{ user: '', begin: 1, end: 1 }]);

	let undoneGames = $derived(typeof all_games !== 'string' ? all_games.filter(g => !isGameDone(g)) : []);
	let assignableGames = $derived(typeof all_games !== 'string' ? all_games.filter(g => g.teams.every(t => !t.is_inserted)) : []);
	let maxGame = $derived(assignableGames.length || 1);
	let stop = $derived(validateForm());
	let hideDone = $state(false);

	// bypass check: maps game.id → { red: message|null, blue: message|null }
	type BypassStatus = { red: string | null; blue: string | null };
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

	function addRangeEntry(list: RangeEntry[]) {
		list.push({ user: '', begin: 1, end: maxGame });
	}

	function removeRangeEntry(list: RangeEntry[], index: number) {
		list.splice(index, 1);
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
	<!-- ── Quick Assign panel ─────────────────────────── -->
	<details class="quick-panel" open>
		<summary class="quick-header">
			<span class="quick-title">Quick Assign</span>
			<span class="quick-sub">bulk-assign by game range</span>
		</summary>

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
				<button type="button" class="btn-apply" onclick={applyMasterToAllGames}>Apply to all games</button>
				<button type="button" class="btn-reset" onclick={resetAllAssignments}>Reset all</button>
			</div>
		</div>
	</details>

	<!-- ── Per-game list ──────────────────────────────── -->
	<FormWithLoading stop={!stop} {dispatch} submitLabel="Save assignments">
		<div class="list-controls">
			<button type="button" class="btn-hide-done" onclick={() => hideDone = !hideDone}>
				{hideDone ? 'Show done' : 'Hide done'}
			</button>
		</div>
		<div class="game-list">
			{#each (hideDone ? all_games.filter(g => !isGameDone(g)) : all_games) as game}
				{@const done = isGameDone(game)}
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
															onchange={(v) => updateScouter(team.id, i, v)}
														/>
														<button
															type="button"
															class="icon-btn remove inline"
															onclick={() => removeScouter(team.id, i)}
														>✕</button>
													</div>
												{/each}
												<button
													type="button"
													class="add-scout-btn"
													onclick={() => addScouter(team.id)}
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
															onchange={(v) => updateScouter(team.id, i, v)}
														/>
														<button
															type="button"
															class="icon-btn remove inline"
															onclick={() => removeScouter(team.id, i)}
														>✕</button>
													</div>
												{/each}
												<button
													type="button"
													class="add-scout-btn"
													onclick={() => addScouter(team.id)}
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
									onchange={(v) => updateRedMvp(game.id, v)}
								/>
							</div>
							<div class="mvp-field">
								<span class="mvp-label blue-label">Blue MVP</span>
								<UserSelector
									value={blueMvps.get(game.id) ?? ''}
									onchange={(v) => updateBlueMvp(game.id, v)}
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
									onclick={() => doBypass(game.id, 'red')}
								>BYPASS RED</button>
								{#if bp?.red}<span class="bypass-msg">{bp.red}</span>{/if}
							</div>
							<div class="bypass-field">
								<button
									type="button"
									class="bypass-btn blue-bypass"
									disabled={bypassPending.has(`${game.id}-blue`)}
									onclick={() => doBypass(game.id, 'blue')}
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

	/* ── Quick Assign panel ──────────────── */
	.quick-panel {
		background: #181818;
		border: 1px solid rgba(255,255,255,0.08);
		border-radius: 10px;
		margin-bottom: 1.25rem;
		overflow: hidden;
	}

	.quick-header {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		padding: 0.75rem 1.1rem;
		cursor: pointer;
		user-select: none;
		list-style: none;
		border-bottom: 1px solid transparent;
	}

	.quick-panel[open] .quick-header {
		border-bottom-color: rgba(255,255,255,0.07);
	}

	.quick-header::-webkit-details-marker { display: none; }

	.quick-title {
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #fff;
	}

	.quick-sub {
		font-size: 0.65rem;
		letter-spacing: 0.08em;
		color: rgba(255,255,255,0.3);
	}

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
	.icon-btn.inline { padding: 1px 4px; }

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

	/* Bypass bar */
	.bypass-bar {
		display: flex;
		gap: 0;
		padding: 0.4rem 0.8rem 0.5rem;
		border-top: 1px solid rgba(255,255,255,0.05);
		flex-wrap: wrap;
		gap: 0.4rem;
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
