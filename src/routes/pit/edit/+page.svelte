<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import FormWithLoading from '$lib/FormWithLoading.svelte';
	import { editPit } from '$lib/schema/sdk.gen';
	import type { ClimbState, Drivebase } from '$lib/schema/types.gen';
	import type { PathPoint } from '$lib/schema/types.gen';
	import RobotPath from '$lib/RobotPath.svelte';

	let is_swerve = $state<boolean>(false);
	let gear_or_drivetype = $state<string>('');
	let auto_paths = $state<PathPoint[][][]>([]);
	let years_of_driver_experience = $state<number | null>(null);
	let what_they_are_looking_from_the_tournament = $state<string | null>(null);
	let do_they_have_a_scouter = $state<boolean | null>(null);
	let how_many_batteries_do_they_have_on_hand = $state<number | null>(null);
	let willing_to_play_defence = $state<boolean | null>(null);
	let strategy = $state<string | null>(null);
	let can_pass = $state<boolean | null>(null);
	let can_shoot = $state<boolean | null>(null);
	let climb = $state<ClimbState | null>(null);

	let team = $state<string>('');
	let insert_id: number;

	onMount(() => {
		const params = $page.url.searchParams;
		if (params.has('id') && params.has('team')) {
			insert_id = Number(params.get('id'));
			team = params.get('team') ?? '';
			if (isNaN(insert_id)) {
				goto('/notallowed');
			}
		} else {
			goto('/notallowed');
		}
	});

	async function handleInsert(): Promise<{
		message: string;
		worked: boolean;
	}> {
		let drivebase: Drivebase | null = null;
		if (gear_or_drivetype) {
			drivebase = is_swerve
				? { Swerve: gear_or_drivetype }
				: { Other: gear_or_drivetype };
		}

		let res = await editPit({
			body: {
				RebuiltPit: {
					drivebase,
					auto_paths: auto_paths.length > 0 ? auto_paths : null,
					years_of_driver_experience,
					what_they_are_looking_from_the_tournament,
					do_they_have_a_scouter,
					how_many_batteries_do_they_have_on_hand,
					willing_to_play_defence,
					strategy,
					can_pass,
					can_shoot,
					climb,
				},
			},
			path: {
				id: insert_id,
			},
		});
		if (res.error) {
			return {
				message: String(res.response.status),
				worked: false,
			};
		} else {
			if (res.data.status === 'Error') {
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

<FormWithLoading dispatch={handleInsert}>
	<h1>Currently Editing data for team: {team}</h1>

	<h2>Drivebase:</h2>
	<h3>Is swerve:</h3>
	<button
		type="button"
		onclick={() => (is_swerve = !is_swerve)}
		class:active={is_swerve}
	>
		{is_swerve ? 'True' : 'False'}
	</button>
	{#if is_swerve}
		<h3>Gear:</h3>
		<input type="text" bind:value={gear_or_drivetype} />
	{:else}
		<h3>Drivebase type:</h3>
		<input type="text" bind:value={gear_or_drivetype} />
	{/if}

	<h2>Years of Driver Experience:</h2>
	<input type="number" bind:value={years_of_driver_experience} />

	<h2>What are they looking for from the tournament:</h2>
	<input type="text" bind:value={what_they_are_looking_from_the_tournament} />

	<h2>Do they have a scouter:</h2>
	<button
		type="button"
		onclick={() => (do_they_have_a_scouter = !do_they_have_a_scouter)}
		class:active={do_they_have_a_scouter}
	>
		{do_they_have_a_scouter ? 'True' : 'False'}
	</button>

	<h2>How many batteries on hand:</h2>
	<input type="number" bind:value={how_many_batteries_do_they_have_on_hand} />

	<h2>Willing to play defence:</h2>
	<button
		type="button"
		onclick={() => (willing_to_play_defence = !willing_to_play_defence)}
		class:active={willing_to_play_defence}
	>
		{willing_to_play_defence ? 'True' : 'False'}
	</button>

	<h2>Strategy:</h2>
	<input type="text" bind:value={strategy} />

	<h2>Can pass:</h2>
	<button
		type="button"
		onclick={() => (can_pass = !can_pass)}
		class:active={can_pass}
	>
		{can_pass ? 'True' : 'False'}
	</button>

	<h2>Can shoot:</h2>
	<button
		type="button"
		onclick={() => (can_shoot = !can_shoot)}
		class:active={can_shoot}
	>
		{can_shoot ? 'True' : 'False'}
	</button>

	<h2>Climb:</h2>
	<select bind:value={climb}>
		<option value={null}>--</option>
		<option value="Nothing">Nothing</option>
		<option value="Stage1">Stage 1</option>
		<option value="Stage2">Stage 2</option>
		<option value="Stage3">Stage 3</option>
	</select>
</FormWithLoading>
