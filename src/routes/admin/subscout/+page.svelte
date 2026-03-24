<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import FormWithLoading from '$lib/FormWithLoading.svelte';
	import { checkadmin } from '$lib/checkadminship';
	import { subScout, getAllSnowgrave } from '$lib/schema/sdk.gen';
	import type { Game } from '$lib/schema/types.gen';
	import UserSelector from '$lib/UserSelector.svelte';
	import DualRangeSlider from '$lib/DualRangeSlider.svelte';
	import { format_team } from '$lib/ParseTeam.svelte';

	onMount(() => {
		if (!checkadmin()) {
			goto('/notallowed');
		}
	});

	let og = $state<string>('');
	let replacement = $state<string>('');
	let all_games = $state<string | Array<Game>>('loading');
	let beginValue = $state<number>(1);
	let endValue = $state<number>(1);

	let filteredGames = $derived.by(() => {
		if (typeof all_games === 'string' || !og) return [];
		return all_games.filter((game) =>
			game.teams.some((team) =>
				!team.done && team.scouters.some((s) => s === og)
			)
		);
	});

	let selectedGames = $derived(filteredGames.slice(beginValue - 1, endValue));

	// Reset range only when og changes
	let prevOg = $state<string>('');
	$effect(() => {
		if (og !== prevOg) {
			prevOg = og;
			beginValue = 1;
			endValue = filteredGames.length || 1;
		}
	});

	// Clamp endValue when filteredGames loads/changes length
	$effect(() => {
		if (filteredGames.length > 0 && endValue < 1) {
			endValue = filteredGames.length;
		}
		if (endValue > filteredGames.length) {
			endValue = filteredGames.length || 1;
		}
	});

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
					if (a.tournament_level === b.tournament_level) {
						return a.match_id - b.match_id;
					}
					if (a.tournament_level === 'QualificationMatch') return -1;
					if (b.tournament_level === 'QualificationMatch') return 1;
					return a.tournament_level.localeCompare(b.tournament_level);
				});
			}
		})();
	});

	async function doSub(gameIds: number[] | null): Promise<{
		message: string;
		worked: boolean;
	}> {
		let res = await subScout({
			body: {
				og: og,
				replacement: replacement,
				game_ids: gameIds,
			},
		});

		if (res.error) {
			return {
				message: String(res.response.status),
				worked: false,
			};
		} else {
			if (res.data.status == 'Error') {
				return {
					message: String(res.data.message),
					worked: false,
				};
			} else {
				return {
					message: String(res.data.message),
					worked: true,
				};
			}
		}
	}

	async function handleRange() {
		return doSub(selectedGames.map((g) => g.id));
	}

	async function handleAll() {
		return doSub(null);
	}
</script>

<h1>Sub Scout</h1>

<div class="section">
	<h2>Original Scouter</h2>
	<UserSelector bind:value={og} />
</div>

{#if og}
	<div class="section">
		{#if typeof all_games === 'string'}
			<p>{all_games}</p>
		{:else if filteredGames.length === 0}
			<p class="muted">No pending assignments for this scouter.</p>
		{:else}
			<h3>Select Game Range ({selectedGames.length} of {filteredGames.length} games)</h3>
			<DualRangeSlider
				min={1}
				max={filteredGames.length}
				bind:beginValue
				bind:endValue
				games={filteredGames}
			/>

			<div class="game-list">
				{#each selectedGames as game}
					<div class="game-box">
						<p><strong>Match {game.match_id}</strong> (Set {game.set})</p>
						<p>{game.tournament_level} - {game.event_code}</p>
						{#each game.teams as team}
							{#if team.scouters.includes(og)}
								<div class="team-highlight">
									<span>{format_team(team.team, team.is_ab_team)} ({team.station})</span>
									<span class="assigned">Assigned: {og}</span>
								</div>
							{/if}
						{/each}
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<div class="section">
	<h2>Replacement</h2>
	<UserSelector bind:value={replacement} />
</div>

<FormWithLoading dispatch={handleRange}>
	<p class="warn">This will replace {selectedGames.length} game(s) ({beginValue}–{endValue}) for {og || '...'} with {replacement || '...'}.</p>
</FormWithLoading>

<style>
	.section {
		margin: 15px 0;
	}

	.game-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
		max-height: 400px;
		overflow-y: auto;
		margin: 10px 0;
	}

	.game-box {
		background-color: #3cb371;
		padding: 15px 25px;
		border-radius: 10px;
		margin: 10px 0;
	}

	.team-highlight {
		background-color: rgba(0, 0, 0, 0.2);
		padding: 8px 12px;
		border-radius: 6px;
		margin: 5px 0;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.assigned {
		color: #ffd700;
		font-weight: 600;
	}

	.muted {
		color: #888;
	}

	.warn {
		color: #ffcc00;
		font-size: 0.9em;
	}
</style>
