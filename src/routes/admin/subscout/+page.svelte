<script lang="ts">
	import { goto } from '$app/navigation';
	import FormWithLoading from '$lib/FormWithLoading.svelte';
	import { checkadmin } from '$lib/checkadminship';
	import { subScout, getAllSnowgrave } from '$lib/schema/sdk.gen';
	import type { Game } from '$lib/schema/types.gen';
	import UserSelector from '$lib/UserSelector.svelte';
	import { format_team } from '$lib/ParseTeam.svelte';

	if (!checkadmin()) {
		goto('/notallowed');
	}

	let og = $state<string>('');
	let replacement = $state<string>('');
	let all_games = $state<string | Array<Game>>('loading');
	let currentIndex = $state<number>(0);

	let filteredGames = $derived.by(() => {
		if (typeof all_games === 'string' || !og) return [];
		return all_games.filter((game) =>
			game.teams.some((team) =>
				team.scouters.some((s) => s === og)
			)
		);
	});

	let currentGame = $derived(filteredGames.length > 0 ? filteredGames[currentIndex] : null);

	$effect(() => {
		// Reset index when og changes
		og;
		currentIndex = 0;
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

	function prev() {
		if (currentIndex > 0) currentIndex--;
	}

	function next() {
		if (currentIndex < filteredGames.length - 1) currentIndex++;
	}

	async function handleEvent(): Promise<{
		message: string;
		worked: boolean;
	}> {
		let res = await subScout({
			body: {
				og: og,
				replacement: replacement,
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
			<div class="slider-header">
				<h3>Assignments ({filteredGames.length} games)</h3>
				<div class="slider-controls">
					<button type="button" onclick={prev} disabled={currentIndex === 0}>&lt;</button>
					<span>{currentIndex + 1} / {filteredGames.length}</span>
					<button type="button" onclick={next} disabled={currentIndex >= filteredGames.length - 1}>&gt;</button>
				</div>
			</div>

			<input
				type="range"
				min="0"
				max={filteredGames.length - 1}
				bind:value={currentIndex}
				class="slider"
			/>

			{#if currentGame}
				<div class="game-box">
					<p><strong>Match {currentGame.match_id}</strong> (Set {currentGame.set})</p>
					<p>{currentGame.tournament_level} - {currentGame.event_code}</p>
					{#each currentGame.teams as team}
						{#if team.scouters.includes(og)}
							<div class="team-highlight">
								<span>{format_team(team.team, team.is_ab_team)} ({team.station})</span>
								<span class="assigned">Assigned: {og}</span>
							</div>
						{/if}
					{/each}
				</div>
			{/if}
		{/if}
	</div>
{/if}

<div class="section">
	<h2>Replacement</h2>
	<UserSelector bind:value={replacement} />
</div>

<FormWithLoading dispatch={handleEvent}>
	<p class="warn">This will replace <strong>all</strong> pending assignments for {og || '...'} with {replacement || '...'}.</p>
</FormWithLoading>

<style>
	.section {
		margin: 15px 0;
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
