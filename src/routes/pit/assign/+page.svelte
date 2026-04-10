<script lang="ts">
	import { pitGetAll } from '$lib/schema/sdk.gen';
	import type { PitAssigment, PitEvent } from '$lib/schema/types.gen';
	import { format_team } from '$lib/ParseTeam.svelte';
	import UserSelector from '$lib/UserSelector.svelte';
	import FormWithLoading from '$lib/FormWithLoading.svelte';
	import type { AssignPitData } from '$lib/schema/types.gen';
	import { assignPit } from '$lib/schema/sdk.gen';
	let games = $state<string | Array<PitEvent>>('loading');
	let stop = $state<boolean>(true);

	let players: Map<number, string> = $state(new Map<number, string>());

	let autoFillScouters = $state<string[]>(['']);

	function addAutoFillScouter() {
		autoFillScouters = [...autoFillScouters, ''];
	}

	function removeAutoFillScouter(index: number) {
		autoFillScouters = autoFillScouters.filter((_, i) => i !== index);
	}

	function autoFill() {
		if (typeof games === 'string') return;
		const valid = autoFillScouters.filter(s => s.trim() !== '');
		if (valid.length === 0) return;

		const newPlayers = new Map(players);
		let idx = 0;
		for (const game of games) {
			newPlayers.set(game.id, valid[idx % valid.length]);
			idx++;
		}
		players = newPlayers;
	}

	function format_data(player_data: Map<number, string>): {
		players: Array<string>;
		games: PitAssigment[];
	} {
		let games_by_id: Array<PitAssigment> = new Array<PitAssigment>();
		let player_by_id: Array<string> = new Array<string>();
		player_data.forEach((value, key) => {
			let player_index: number;
			let find_index: number = player_by_id.findIndex((v) => v === value);
			if (find_index != -1) {
				player_index = find_index;
			} else {
				let new_index = player_by_id.push(value) - 1;
				player_index = new_index;
			}
			games_by_id.push({
				index: player_index,
				upcomingid: key,
			});
		});
		return {
			players: player_by_id,
			games: games_by_id,
		};
	}

	$effect(() => {
		if (games.length == players.size) {
			stop = false;
		}
	});

	$effect(() => {
		(async () => {
			let res = await pitGetAll();
			if (res.error) {
				games = 'Error code: ' + res.response.status;
			} else if (res.data.status === 'Error') {
				games = 'Error from server: ' + res.data.message;
			} else {
				games = res.data.message;
				const loaded = new Map<number, string>();
				for (const game of games) {
					if (game.user) {
						loaded.set(game.id, game.user);
					}
				}
				players = loaded;
			}
		})();
	});

	async function handleInsert(): Promise<{
		message: string;
		worked: boolean;
	}> {
		let data = format_data(players);
		let res = await assignPit({
			body: {
				scouts: data.players,
				asignment: data.games,
			},
		});
		if (res.error) {
			return {
				worked: false,
				message: String(res.response.status),
			};
		} else {
			if (res.data.status === 'Error') {
				return {
					worked: false,
					message: 'Error from server: ' + String(res.data.message),
				};
			} else {
				return {
					worked: true,
					message: String(res.data.message),
				};
			}
		}
	}
</script>

{#if typeof games === 'string'}
	<p>{games}</p>
{:else}
	<div class="auto-fill-section">
		<h4>Auto Fill Evenly</h4>
		{#each autoFillScouters as scouter, i}
			<div class="auto-fill-row">
				<UserSelector bind:value={autoFillScouters[i]} />
				{#if autoFillScouters.length > 1}
					<button type="button" class="btn-sm" onclick={() => removeAutoFillScouter(i)}>-</button>
				{/if}
			</div>
		{/each}
		<div style="display: flex; gap: 8px; margin-top: 8px;">
			<button type="button" class="btn-sm" onclick={addAutoFillScouter}>+ Add scouter</button>
			<button type="button" onclick={autoFill}>Auto Fill</button>
		</div>
	</div>

	<FormWithLoading dispatch={handleInsert} bind:stop>
		{#each games as game}
			<div class="pit-game-box">
				<p>Team: {format_team(game.team, game.is_ab_team)}</p>
				<p>Event Code: {game.event_code}</p>
				<UserSelector
					value={players.get(game.id) ?? ''}
					onchange={(v) => {
						players.set(game.id, v);
						players = new Map(players);
					}}
				></UserSelector>
			</div>
		{/each}
	</FormWithLoading>
{/if}

<style>
	.auto-fill-section {
		background-color: #2e8b57;
		padding: 15px;
		margin: 10px;
		border-radius: 10px;
	}

	.auto-fill-row {
		display: flex;
		gap: 8px;
		align-items: center;
		margin: 6px 0;
	}

	.btn-sm {
		padding: 2px 8px;
		font-size: 0.85em;
	}

	.pit-game-box {
		background-color: #3cb371;
		padding: 10px;
		border-radius: 10px;
		margin: 10px;
	}
</style>
