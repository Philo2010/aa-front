<script lang="ts">
	import FormWithLoading from '$lib/FormWithLoading.svelte';
	import { format_team } from '$lib/ParseTeam.svelte';
	import { insertScout, mvpInsert } from '$lib/schema/sdk.gen';
	import { getAllSnowgrave } from '$lib/schema/sdk.gen';
	import type {
		Game,
		GameTeamDataScouter,
		MatchData,
		ScouterInsertFront,
	} from '$lib/schema/types.gen';
	import UserSelector from '$lib/UserSelector.svelte';

	let all_games = $state<string | Array<Game>>('loading');
	let scouters = $state(new Map<number, string[]>());
	let redMvps = $state(new Map<number, string>());
	let blueMvps = $state(new Map<number, string>());

	let originalScouters = new Map<number, string[]>();
	let originalRedMvps = new Map<number, string>();
	let originalBlueMvps = new Map<number, string>();

	let masterScouters = $state<string[]>(['', '', '', '', '', '']);
	let masterRedMvp = $state('');
	let masterBlueMvp = $state('');
	let stop = $derived(validateForm());
	let sliderIndex = $state<number>(0);
	let sliderGame = $derived(typeof all_games !== 'string' && all_games.length > 0 ? all_games[sliderIndex] : null);

	function scoutersEqual(a: string[], b: string[]): boolean {
		if (a.length !== b.length) return false;
		return a.every((v, i) => v === b[i]);
	}

	function validateForm(): boolean {
		if (typeof all_games === 'string') {
			return false;
		}

		for (const game of all_games) {
			for (const team of game.teams) {
				const teamScouters = scouters.get(team.id);

				if (!teamScouters || teamScouters.length === 0) {
					return false;
				}

				for (const scouter of teamScouters) {
					if (!scouter || scouter.trim() === '') {
						return false;
					}
				}
			}

			const redMvp = redMvps.get(game.id);
			const blueMvp = blueMvps.get(game.id);

			if (!redMvp || redMvp.trim() === '') {
				return false;
			}

			if (!blueMvp || blueMvp.trim() === '') {
				return false;
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

		for (const scouterArray of scoutersSubset.values()) {
			for (const scouter of scouterArray) {
				if (scouter && !result.has(scouter)) {
					result.set(scouter, currentId++);
				}
			}
		}

		for (const mvp of redMvpsSubset.values()) {
			if (mvp && !result.has(mvp)) {
				result.set(mvp, currentId++);
			}
		}

		for (const mvp of blueMvpsSubset.values()) {
			if (mvp && !result.has(mvp)) {
				result.set(mvp, currentId++);
			}
		}

		return result;
	}

	function format_scout_pick_data(): ScouterInsertFront {
		if (typeof all_games === 'string') {
			throw new Error('Games not loaded');
		}

		const changedScouters = new Map<number, string[]>();
		const changedRedMvps = new Map<number, string>();
		const changedBlueMvps = new Map<number, string>();

		for (const game of all_games) {
			const currentRed = redMvps.get(game.id) ?? '';
			const currentBlue = blueMvps.get(game.id) ?? '';

			if (currentRed !== (originalRedMvps.get(game.id) ?? '')) {
				changedRedMvps.set(game.id, currentRed);
			}
			if (currentBlue !== (originalBlueMvps.get(game.id) ?? '')) {
				changedBlueMvps.set(game.id, currentBlue);
			}

			for (const team of game.teams) {
				const current = scouters.get(team.id) ?? [];
				const original = originalScouters.get(team.id) ?? [];

				if (!scoutersEqual(current, original)) {
					changedScouters.set(team.id, current);
				}
			}
		}

		const player_indexs = convertToHashMap(changedScouters, changedRedMvps, changedBlueMvps);
		const matches: MatchData[] = [];

		for (const game of all_games) {
			const hasScouterChange = game.teams.some((team) => changedScouters.has(team.id));
			const hasRedMvpChange = changedRedMvps.has(game.id);
			const hasBlueVpChange = changedBlueMvps.has(game.id);

			if (!hasScouterChange && !hasRedMvpChange && !hasBlueVpChange) {
				continue;
			}

			for (const team of game.teams) {
				if (!changedScouters.has(team.id) && !hasRedMvpChange && !hasBlueVpChange) {
					continue;
				}

				const teamScouters = changedScouters.get(team.id) ?? scouters.get(team.id) ?? [];
				const player_team_index: GameTeamDataScouter[] = teamScouters
					.map((player) => {
						const index = player_indexs.get(player);
						return index !== undefined ? { index } : null;
					})
					.filter((x): x is GameTeamDataScouter => x !== null);

				matches.push({
					upcoming_team_id: team.id,
					game_scouters: player_team_index,
					mvp: {
						red: changedRedMvps.get(game.id) ?? redMvps.get(game.id) ?? '',
						blue: changedBlueMvps.get(game.id) ?? blueMvps.get(game.id) ?? '',
					},
				});
			}
		}

		const final_player_indexs = Array.from(player_indexs.entries())
			.sort((a, b) => a[1] - b[1])
			.map(([name]) => name);

		return {
			player_indexs: final_player_indexs,
			matches,
		};
	}

	function resetAllAssignments() {
		if (typeof all_games === 'string') return;

		const newScouters = new Map<number, string[]>();
		const newRedMvps = new Map<number, string>();
		const newBlueMvps = new Map<number, string>();

		all_games.forEach((game) => {
			game.teams.forEach((team) => {
				newScouters.set(team.id, []);
			});
			newRedMvps.set(game.id, '');
			newBlueMvps.set(game.id, '');
		});

		scouters = newScouters;
		redMvps = newRedMvps;
		blueMvps = newBlueMvps;

		originalScouters = new Map(
			Array.from(newScouters.entries()).map(([k, v]) => [k, [...v]]),
		);
		originalRedMvps = new Map(newRedMvps);
		originalBlueMvps = new Map(newBlueMvps);

		masterScouters = ['', '', '', '', '', ''];
		masterRedMvp = '';
		masterBlueMvp = '';
	}

	$effect(() => {
		(async () => {
			let res = await getAllSnowgrave();
			if (res.error) {
				all_games = 'Failed with code: ' + String(res.response.status);
			} else {
				if (res.data.status === 'Error') {
					all_games = 'Error from server: ' + res.data.message;
				} else {
					all_games = res.data.message;
					all_games.sort((a, b) => {
						if (a.tournament_level === b.tournament_level) {
							return a.match_id - b.match_id;
						} else {
							if (a.tournament_level === 'QualificationMatch') {
								return 1;
							} else if (b.tournament_level === 'QualificationMatch') {
								return -1;
							} else {
								return a.tournament_level.localeCompare(b.tournament_level);
							}
						}
					});

					const newScouters = new Map<number, string[]>();
					const newRedMvps = new Map<number, string>();
					const newBlueMvps = new Map<number, string>();

					all_games.forEach((game) => {
						game.teams.forEach((team) => {
							newScouters.set(
								team.id,
								team.scouters && team.scouters.length > 0
									? [...team.scouters]
									: [],
							);
						});
						newRedMvps.set(game.id, game.mvp_red || '');
						newBlueMvps.set(game.id, game.mvp_blue || '');
					});

					scouters = newScouters;
					redMvps = newRedMvps;
					blueMvps = newBlueMvps;

					originalScouters = new Map(
						Array.from(newScouters.entries()).map(([k, v]) => [k, [...v]]),
					);
					originalRedMvps = new Map(newRedMvps);
					originalBlueMvps = new Map(newBlueMvps);
				}
			}
		})();
	});

	function updateScouter(teamId: number, index: number, value: string) {
		const teamScouters = scouters.get(teamId);
		if (teamScouters) {
			teamScouters[index] = value;
			scouters = new Map(scouters);
		}
	}

	function addScouter(teamId: number) {
		if (!scouters.has(teamId)) {
			scouters.set(teamId, []);
		}

		const teamScouters = scouters.get(teamId)!;
		teamScouters.push('');
		scouters = new Map(scouters);
	}

	function updateMasterScouter(index: number, value: string) {
		masterScouters[index] = value;
		masterScouters = [...masterScouters];
	}

	function updateRedMvp(gameId: number, value: string) {
		redMvps.set(gameId, value);
		redMvps = new Map(redMvps);
	}

	function updateBlueMvp(gameId: number, value: string) {
		blueMvps.set(gameId, value);
		blueMvps = new Map(blueMvps);
	}

	function applyMasterToAllGames() {
		if (typeof all_games === 'string') return;

		const newScouters = new Map(scouters);
		const newRedMvps = new Map(redMvps);
		const newBlueMvps = new Map(blueMvps);

		all_games.forEach((game) => {
			game.teams.forEach((team, teamIndex) => {
				if (teamIndex < 6 && masterScouters[teamIndex]) {
					const teamScouters = newScouters.get(team.id) || [];
					teamScouters.push(masterScouters[teamIndex]);
					newScouters.set(team.id, teamScouters);
				}
			});

			if (masterRedMvp) {
				newRedMvps.set(game.id, masterRedMvp);
			}
			if (masterBlueMvp) {
				newBlueMvps.set(game.id, masterBlueMvp);
			}
		});

		scouters = newScouters;
		redMvps = newRedMvps;
		blueMvps = newBlueMvps;
	}

	async function dispatch(): Promise<{ message: string; worked: boolean }> {
		let data = format_scout_pick_data();
		console.log(data);

		let res = await insertScout({
			body: data,
		});

		if (res.error) {
			return {
				message: 'Error while sending data: ' + String(res.response.status),
				worked: false,
			};
		} else {
			if (res.data.status === 'Error') {
				return {
					message: 'Error from server: ' + res.data.message,
					worked: false,
				};
			} else {
				return {
					message: res.data.message,
					worked: true,
				};
			}
		}
	}
</script>

{#if typeof all_games === 'string'}
	{all_games}
{:else}
	<div class="slider-section">
		<div class="slider-header">
			<h3>Assign Scouters ({all_games.length} games)</h3>
			<div class="slider-controls">
				<button type="button" onclick={() => sliderIndex = Math.max(0, sliderIndex - 1)} disabled={sliderIndex === 0}>&lt;</button>
				<span>{sliderIndex + 1} / {all_games.length}</span>
				<button type="button" onclick={() => sliderIndex = Math.min(all_games.length - 1, sliderIndex + 1)} disabled={sliderIndex >= all_games.length - 1}>&gt;</button>
			</div>
		</div>

		<input
			type="range"
			min="0"
			max={all_games.length - 1}
			bind:value={sliderIndex}
			class="slider"
		/>

		<div class="master-section">
			<h4>Quick Assign (applies to all games)</h4>
			{#each masterScouters as scouter, i}
				<div class="row">
					<span class="label">Team {i + 1}:</span>
					<UserSelector
						value={scouter}
						onchange={(value) => updateMasterScouter(i, value)}
					/>
				</div>
			{/each}
			<div class="row" style="margin-top: 10px;">
				<span class="label">Red MVP:</span>
				<UserSelector bind:value={masterRedMvp} />
			</div>
			<div class="row">
				<span class="label">Blue MVP:</span>
				<UserSelector bind:value={masterBlueMvp} />
			</div>
			<div style="display: flex; gap: 10px; margin-top: 10px;">
				<button type="button" onclick={applyMasterToAllGames}>Apply to All</button>
				<button type="button" onclick={resetAllAssignments} style="background-color: #dc3545;">Reset All</button>
			</div>
		</div>
	</div>

	{#if sliderGame}
		<FormWithLoading stop={!stop} {dispatch}>
			<div class="game-box">
				<p><strong>Match {sliderGame.match_id}</strong> (Set {sliderGame.set})</p>
				<p>{sliderGame.tournament_level} - {sliderGame.event_code}</p>
				{#each sliderGame.teams as team, teamIndex}
					<div>
						<strong>Team {teamIndex + 1}:</strong>
						{format_team(team.team, team.is_ab_team)} - {team.station}
						{#each scouters.get(team.id) ?? [] as scouter, i}
							<UserSelector
								value={scouter}
								onchange={(value) =>
									updateScouter(team.id, i, value)}
							/>
						{/each}
						<button
							type="button"
							onclick={() => addScouter(team.id)}>+</button
						>
					</div>
				{/each}

				<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #fff;">
					<div class="row">
						<span style="min-width: 80px;">Red MVP:</span>
						<UserSelector
							value={redMvps.get(sliderGame.id) ?? ''}
							onchange={(value) => updateRedMvp(sliderGame.id, value)}
						/>
					</div>
					<div class="row">
						<span style="min-width: 80px;">Blue MVP:</span>
						<UserSelector
							value={blueMvps.get(sliderGame.id) ?? ''}
							onchange={(value) => updateBlueMvp(sliderGame.id, value)}
						/>
					</div>
				</div>
			</div>
		</FormWithLoading>
	{/if}
{/if}

<style>
	.game-box {
		background-color: #3cb371;
		padding: 10px 30px;
		border-radius: 10px;
		margin: 10px;
	}

	.slider-section {
		background-color: #2e8b57;
		padding: 15px;
		margin: 10px;
		border-radius: 10px;
	}

	.slider-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.slider-controls {
		display: flex;
		gap: 10px;
		align-items: center;
	}

	.slider-controls button {
		min-width: 36px;
	}

	.slider {
		width: 100%;
		margin: 10px 0;
	}

	.master-section {
		margin-top: 15px;
		padding-top: 15px;
		border-top: 1px solid rgba(255, 255, 255, 0.3);
	}

	.row {
		display: flex;
		gap: 10px;
		align-items: center;
		margin-bottom: 8px;
	}

	.label {
		min-width: 100px;
	}
</style>
