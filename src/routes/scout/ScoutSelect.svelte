<script lang="ts">
	//TODO: Make ui for pit scout!
	import LinkButton from '$lib/LinkButton.svelte';
	import { format_team } from '../../lib/ParseTeam.svelte';
	import { getYears } from '../../lib/schema/sdk.gen';
	import type { GameForArrayOfScoutingTeamForScouterWithoutIdAndMvpIds } from '../../lib/schema/types.gen';
	let games = $state<
		string | GameForArrayOfScoutingTeamForScouterWithoutIdAndMvpIds[]
	>('Loading');

	$effect(() => {
		(async () => {
			let res = await getYears();
			if (res.error) {
				games = 'Error code: ' + games;
			} else if (res.data.status === 'Error') {
				games = 'Error from server: ' + res.data.message;
			} else {
				games = res.data.message;
				console.log(games);
				games.sort((a, b) => {
					if (
						a.tournament_level === 'QualificationMatch' &&
						b.tournament_level != 'QualificationMatch'
					) {
						return -1;
					} else if (
						a.tournament_level != 'QualificationMatch' &&
						b.tournament_level === 'QualificationMatch'
					) {
						return 1;
					}
					return a.match_id - b.match_id;
				});
			}
		})();
	});
	// For hash-based routing like #/scout/mvp?id=2&is_blue=true&game_id=6767
</script>

{#if typeof games === 'string'}
	{games}
{:else}
	{#each games as game}
		<div class="game-box">
			<p>Match: {game.match_id}</p>
			<p>Set: {game.set}</p>
			<p>Tournament Level: {game.tournament_level}</p>
			<p>Event Code: {game.event_code}</p>

			{#if typeof game.mvp.blue === 'number'}
				<LinkButton
					to="/scout/mvp?id={game.mvp
						.blue}&is_blue=true&game_id={game.id}"
					>Blue MVP</LinkButton
				>
			{/if}

			{#if typeof game.mvp.red === 'number'}
				<LinkButton
					to="/scout/mvp?id={game.mvp
						.red}&is_blue=false&game_id={game.id}"
					>Red MVP</LinkButton
				>
			{/if}

			<h4>Your assigned to scout:</h4>
			{#each game.teams as team}
				{#if team.scouters[0].is_redo}
					<LinkButton
						to="/scout/page?id={team.scouters[0]
							.id}&team={format_team(
							team.team.team,
							team.team.is_ab_team,
						)}&edit=true"
						>Redo Team: {format_team(
							team.team.team,
							team.team.is_ab_team,
						)}</LinkButton
					>
				{:else}
					<LinkButton
						to="/scout/page?id={team.scouters[0]
							.id}&team={format_team(
							team.team.team,
							team.team.is_ab_team,
						)}"
						>Team: {format_team(
							team.team.team,
							team.team.is_ab_team,
						)}</LinkButton
					>
				{/if}
			{/each}
		</div>
	{/each}
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

	.game-box-bad {
		background-color: #840d0d;
		padding: 10px;
		padding-left: 30px;
		padding-right: 30px;
		border-radius: 10px;
		margin: 10px;
	}
</style>
