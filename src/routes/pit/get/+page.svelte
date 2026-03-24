<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { checkadmin } from '$lib/checkadminship';
	import { get } from '$lib/schema/sdk.gen';
	import type { PitGetSend } from '$lib/schema/types.gen';
	import { format_team } from '$lib/ParseTeam.svelte';
	import RobotPathView from '$lib/RobotPathView.svelte';

	if (!checkadmin()) {
		goto('/notallowed');
	}

	let data = $state<PitGetSend | string>('loading');

	async function load_data_from_server(
		team: number,
		is_ab_team: boolean,
		event_code: string,
	) {
		let res = await get({
			body: {
				team: team,
				is_ab_team: is_ab_team,
				event_code: event_code,
			},
		});

		if (res.error) {
			data = 'failed to get data! Code: ' + res.response.status;
			return;
		} else {
			if (res.data.status === 'Error') {
				data = 'Error back from server: ' + res.data.message;
			} else {
				data = res.data.message;
			}
		}
	}

	onMount(() => {
		(async () => {
			const params = $page.url.searchParams;
			let team: number = null;
			let is_ab_team: boolean = null;
			let event_code: string = null;

			if (
				params.has('team') &&
				params.has('is_ab_team') &&
				params.has('event_code')
			) {
				let team_temp = Number(params.get('team'));
				let is_ab_team_temp = params.get('is_ab_team');
				event_code = params.get('event_code');
				if (is_ab_team_temp === 'true') {
					is_ab_team = true;
				} else if (is_ab_team_temp === 'false') {
					is_ab_team = false;
				} else {
					goto('/notallowed');
					return;
				}

				if (isNaN(team_temp)) {
					goto('/notallowed');
					return;
				} else {
					team = team_temp;
				}
				await load_data_from_server(team, is_ab_team, event_code);
			} else {
				goto('/notallowed');
			}
		})();
	});
</script>

{#if typeof data === 'string'}
	{data}
{:else}
	<h3>Metadata</h3>
	<p>Id: {data.header.id}</p>
	<p>User: {data.header.user}</p>
	<p>Team: {format_team(data.header.team, data.header.is_ab_team)}</p>
	<p>Event Code: {data.header.event_code}</p>
	<p>Created At: {data.header.created_at}</p>

	<h3>Data</h3>
	<p>Drivebase: {data.pit.RebuiltPit.is_swerve ? 'Swerve' : data.pit.RebuiltPit.gear_or_drivebase} {data.pit.RebuiltPit.is_swerve ? `(Gear: ${data.pit.RebuiltPit.gear_or_drivebase})` : ''}</p>
	<p>Years of Driver Experience: {data.pit.RebuiltPit.years_of_driver_experience}</p>
	<p>Tournament Goals: {data.pit.RebuiltPit.what_they_are_looking_from_the_tournament}</p>
	<p>Has a Scouter: {data.pit.RebuiltPit.do_they_have_a_scouter}</p>
	<p>Batteries on Hand: {data.pit.RebuiltPit.how_many_batteries_do_they_have_on_hand}</p>
	<p>Willing to Play Defence: {data.pit.RebuiltPit.willing_to_play_defence}</p>
	<p>Strategy: {data.pit.RebuiltPit.strategy}</p>
	<p>Can Pass: {data.pit.RebuiltPit.can_pass}</p>
	<p>Can Shoot: {data.pit.RebuiltPit.can_shoot}</p>
	<p>Climb: {data.pit.RebuiltPit.climb}</p>

	<h3>Auto Paths</h3>
	{#each data.pit.RebuiltPit.auto_paths as path, i}
		<h4>Path {i + 1}</h4>
		<RobotPathView strokes={path as any} />
	{/each}
{/if}
