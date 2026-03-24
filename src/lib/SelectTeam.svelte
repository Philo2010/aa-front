<script lang="ts">
	import NiceErrorTextBox from './NiceErrorTextBox.svelte';
	import { format_team, parse_team } from './ParseTeam.svelte';
	import type { Team } from './schema/types.gen';
	import { getTeamsFromGame } from './schema/sdk.gen';

	let {
		game_id,
		value = $bindable(),
		is_blue,
	} = $props<{ game_id: number; value?: Team; is_blue: boolean }>();

	let teams: Array<Team> | undefined = $state();

	$effect(() => {
		if (!Number.isInteger(game_id) || game_id <= 0) return;

		(async () => {
			const res = await getTeamsFromGame({
				path: { id_upcoming_game: game_id },
			});

			if (res.error || res.data.status === 'Error') {
				teams = undefined;
			} else {
				teams = [];
				for (const team of res.data.message) {
					if (team.is_blue === is_blue) {
						teams.push(team.team);
					}
				}
			}
		})();
	});

	//code for if we could not find teams
	let error = $state<string>('');
	let team_string = $state<string>('');

	$effect(() => {
		if (team_string === '') {
			error = 'Please input a value!';
			return;
		}
		let res = parse_team(team_string);
		if (typeof res === 'string') {
			error = res;
		} else {
			error = null;
			value = { number: res.team_number, is_ab_team: res.is_ab_team };
		}
	});
</script>

{#if typeof teams === 'undefined'}
	<NiceErrorTextBox {error} bind:input={team_string}></NiceErrorTextBox>
{:else}
	<select bind:value>
		{#each teams as team}
			<option value={team}
				>{format_team(team.number, team.is_ab_team)}</option
			>
		{/each}
	</select>
{/if}
