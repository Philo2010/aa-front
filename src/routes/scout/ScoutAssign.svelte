<script lang="ts">
	import { derived } from 'svelte/store';
	import FormWithLoading from '../../lib/FormWithLoading.svelte';
	import { format_team } from '../../lib/ParseTeam.svelte';
	import { insertScout, mvpInsert } from '../../lib/schema/sdk.gen';
	import { getAllSnowgrave } from '../../lib/schema/sdk.gen';
	import type {
		Game,
		GameTeamDataScouter,
		MatchData,
		ScouterInsertFront,
	} from '../../lib/schema/types.gen';
	import UserSelector from '../../lib/UserSelector.svelte';

	let all_games = $state<string | Array<Game>>('loading');
	let scouters = $state(new Map<number, string[]>());
	let redMvps = $state(new Map<number, string>());
	let blueMvps = $state(new Map<number, string>());
	let masterScouters = $state<string[]>(['', '', '', '', '', '']);
	let masterRedMvp = $state('');
	let masterBlueMvp = $state('');
	let stop = $derived(validateForm());

	function validateForm(): boolean {
		if (typeof all_games === 'string') {
			// Games haven't loaded yet
			return false;
		}

		// Check each game
		for (const game of all_games) {
			// Check each team has at least one scouter
			for (const team of game.teams) {
				const teamScouters = scouters.get(team.id);

				// Team must have at least one scouter
				if (!teamScouters || teamScouters.length === 0) {
					return false;
				}

				// All scouter slots must be filled (no empty strings)
				for (const scouter of teamScouters) {
					if (!scouter || scouter.trim() === '') {
						return false;
					}
				}
			}

			// Check MVPs are filled
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

	function convertToHashMap(): Map<string, number> {
		const result = new Map<string, number>();
		let currentId = 0;

		// Add all scouters
		for (const scouterArray of scouters.values()) {
			for (const scouter of scouterArray) {
				if (scouter && !result.has(scouter)) {
					result.set(scouter, currentId);
					currentId++;
				}
			}
		}

		// Add all red MVPs
		for (const mvp of redMvps.values()) {
			if (mvp && !result.has(mvp)) {
				result.set(mvp, currentId);
				currentId++;
			}
		}

		// Add all blue MVPs
		for (const mvp of blueMvps.values()) {
			if (mvp && !result.has(mvp)) {
				result.set(mvp, currentId);
				currentId++;
			}
		}

		return result;
	}

	function format_scout_pick_data(): ScouterInsertFront {
		// Build global player index
		const player_indexs = convertToHashMap();
		const matches: MatchData[] = [];

		if (typeof all_games === 'string') {
			throw new Error('Games not loaded');
		}

		for (const game of all_games) {
			for (const team of game.teams) {
				const teamScouters = scouters.get(team.id) ?? [];
				const player_team_index: GameTeamDataScouter[] = [];

				for (const player of teamScouters) {
					const index = player_indexs.get(player);
					if (index !== undefined) {
						player_team_index.push({ index });
					}
				}

				matches.push({
					upcoming_team_id: team.id,
					game_scouters: player_team_index,
					mvp: {
						red: redMvps.get(game.id) ?? '',
						blue: blueMvps.get(game.id) ?? '',
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

		// Also reset master assignments
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
							} else if (
								b.tournament_level === 'QualificationMatch'
							) {
								return -1;
							} else {
								return a.tournament_level.localeCompare(
									b.tournament_level,
								);
							}
						}
					});

					// Initialize scouters, red mvps, and blue mvps for each game
					const newScouters = new Map<number, string[]>();
					const newRedMvps = new Map<number, string>();
					const newBlueMvps = new Map<number, string>();

					all_games.forEach((game) => {
						// Auto-fill scouters from existing data
						game.teams.forEach((team) => {
							newScouters.set(
								team.id,
								team.scouters && team.scouters.length > 0
									? [...team.scouters]
									: [],
							);
						});

						// Auto-fill MVPs from existing data
						newRedMvps.set(game.id, game.mvp_red || '');
						newBlueMvps.set(game.id, game.mvp_blue || '');
					});

					scouters = newScouters;
					redMvps = newRedMvps;
					blueMvps = newBlueMvps;
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
			// Apply master scouters to each team based on their index in the game
			game.teams.forEach((team, teamIndex) => {
				if (teamIndex < 6 && masterScouters[teamIndex]) {
					const teamScouters = newScouters.get(team.id) || [];
					teamScouters.push(masterScouters[teamIndex]);
					newScouters.set(team.id, teamScouters);
				}
			});

			// Apply master MVPs
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
				message:
					'Error while sending data: ' + String(res.response.status),
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

<div
	style="background-color: #2e8b57; padding: 15px; margin: 10px; border-radius: 10px;"
>
	<h3>Quick Assign by Team Position</h3>
	<p style="font-size: 0.9em; margin-bottom: 10px;">
		Assign scouters to team positions (1st team, 2nd team, etc.) across all
		games
	</p>
	{#each masterScouters as scouter, i}
		<div
			style="display: flex; gap: 10px; align-items: center; margin-bottom: 8px;"
		>
			<span style="min-width: 100px;">Team {i + 1}:</span>
			<UserSelector
				value={scouter}
				onchange={(value) => updateMasterScouter(i, value)}
			/>
		</div>
	{/each}

	<div
		style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #fff;"
	>
		<div
			style="display: flex; gap: 10px; align-items: center; margin-bottom: 8px;"
		>
			<span style="min-width: 100px;">Red MVP:</span>
			<UserSelector bind:value={masterRedMvp} />
		</div>
		<div
			style="display: flex; gap: 10px; align-items: center; margin-bottom: 8px;"
		>
			<span style="min-width: 100px;">Blue MVP:</span>
			<UserSelector bind:value={masterBlueMvp} />
		</div>
	</div>

	<div style="display: flex; gap: 10px; margin-top: 10px;">
		<button type="button" onclick={applyMasterToAllGames}>
			Apply to All Games
		</button>
		<button
			type="button"
			onclick={resetAllAssignments}
			style="background-color: #dc3545;"
		>
			Reset All Assignments
		</button>
	</div>
</div>

{#if typeof all_games === 'string'}
	{all_games}
{:else}
	<FormWithLoading stop={!stop} {dispatch}>
		{#each all_games as game}
			<div class="game-box">
				<p>Match: {game.match_id}</p>
				<p>Set: {game.set}</p>
				<p>Level: {game.tournament_level}</p>
				<p>Event {game.event_code}</p>
				{#each game.teams as team, teamIndex}
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

				<div
					style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #fff;"
				>
					<div
						style="display: flex; gap: 10px; align-items: center; margin-bottom: 5px;"
					>
						<span style="min-width: 80px;">Red MVP:</span>
						<UserSelector
							value={redMvps.get(game.id) ?? ''}
							onchange={(value) => updateRedMvp(game.id, value)}
						/>
					</div>
					<div style="display: flex; gap: 10px; align-items: center;">
						<span style="min-width: 80px;">Blue MVP:</span>
						<UserSelector
							value={blueMvps.get(game.id) ?? ''}
							onchange={(value) => updateBlueMvp(game.id, value)}
						/>
					</div>
				</div>
			</div>
		{/each}
	</FormWithLoading>
{/if}

<style>
	.game-box {
		background-color: #3cb371;
		padding: 10px;
		padding-left: 30px;
		padding-right: 30px;
		border-radius: 10px;
		margin: 10px;
	}
</style>
