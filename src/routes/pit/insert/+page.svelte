<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import FormWithLoading from '$lib/FormWithLoading.svelte';
	import { insert } from '$lib/schema/sdk.gen';
	import type { ClimbState, Drivebase } from '$lib/schema/types.gen';
	import type { AutoPath } from '$lib/types/robotpath';
	import RobotPath from '$lib/RobotPath.svelte';

	let is_swerve = $state<boolean>(false);
	let gear_or_drivetype = $state<string>('');
	let auto_paths = $state<AutoPath[]>([]);
	let current_path = $state<AutoPath>([]);
	let years_of_driver_experience = $state<number>(0);
	let what_they_are_looking_from_the_tournament = $state<string>('');
	let do_they_have_a_scouter = $state<boolean>(false);
	let how_many_batteries_do_they_have_on_hand = $state<number>(0);
	let willing_to_play_defence = $state<boolean>(false);
	let strategy = $state<string>('');
	let can_pass = $state<boolean>(false);
	let can_shoot = $state<boolean>(false);
	let climb = $state<ClimbState>('Nothing');

	let team = $state<string>('');
	let insert_id: number;

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

	function addPath() {
		if (current_path.length > 0) {
			auto_paths = [...auto_paths, current_path];
			current_path = [];
		}
	}

	function removePath(i: number) {
		auto_paths = auto_paths.filter((_, idx) => idx !== i);
	}

	async function handleInsert(): Promise<{
		message: string;
		worked: boolean;
	}> {
		// Add current path if not empty
		if (current_path.length > 0) {
			auto_paths = [...auto_paths, current_path];
			current_path = [];
		}

		let drivebase: Drivebase = is_swerve
			? { Swerve: gear_or_drivetype }
			: { Other: gear_or_drivetype };

		let res = await insert({
			body: {
				pit_insert_id: insert_id,
				pit: {
					RebuiltPit: {
						drivebase,
						auto_paths,
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
			},
		});
		if (res.error) {
			return {
				message: String(res.response.status),
				worked: false,
			};
		} else {
			if ((res.data.status = 'Error')) {
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
	<h1>Currently getting data for team: {team}</h1>

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

	<h2>Auto Paths ({auto_paths.length}/3)</h2>
	{#each auto_paths as path, i}
		<div>
			<h4>Path {i + 1} ({path.length} strokes)</h4>
			<button type="button" onclick={() => removePath(i)}>Remove</button>
		</div>
	{/each}
	{#if auto_paths.length < 3}
		<h3>Draw Path:</h3>
		<RobotPath bind:pathData={current_path} />
		<button type="button" onclick={addPath} disabled={current_path.length === 0}>
			Add Path
		</button>
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
		<option value="Nothing">Nothing</option>
		<option value="Stage1">Stage 1</option>
		<option value="Stage2">Stage 2</option>
		<option value="Stage3">Stage 3</option>
	</select>
</FormWithLoading>
