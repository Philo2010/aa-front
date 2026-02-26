<!--TODO MAKE THIS PRETTY SEQUOURA! (ps please use comments when denoting the state of a page)-->

<script lang="ts">
	import FormWithLoading from '$lib/FormWithLoading.svelte';
	import type { Insert2, ClimbState } from '$lib/schema/types.gen';
	import { scoutEdit, scoutInsert } from '$lib/schema/sdk.gen';
	import { onMount } from 'svelte';
	import StarRating from '$lib/StarRating.svelte';
	import FuelWidget from '$lib/FuelWidget.svelte';

	let team = $state<string>('');
	let stop = $state<boolean>(true);
	let snowgrave_insert_id: number;
	let edit = $state<boolean>(false);
	let defence = $state<number>(0);
	let comment = $state<string>('');
	let scout_form: Insert2 = $state<Insert2>({
		defence_main: false,
		fuel_shoot_teleop: 0,
		fuel_pass_teleop: 0,
		fuel_shoot_auto: 0,
		fuel_pass_auto: 0,
		climb_end: 'Stage1',
		climb_auto: 'Stage1',
		beach_on_bump: false
	});

	$effect(() => {
		if (comment === '') {
			stop = true;
		} else {
			stop = false;
		}
	});

	enum States {
		Auto = 0,
		Teleop = 1,
		Endgame = 2,
	}

	let form_state = $state<States>(States.Auto);

	onMount(() => {
		// For hash-based routing like #/pit/insert?id=2&team=5829
		const hash = window.location.hash;
		const searchPart = hash.split('?')[1];
		const params = new URLSearchParams(searchPart);

		if (params.has('edit')) {
			if (params.get('edit') === 'true') {
				edit = true;
			}
		}

		if (params.has('id') || params.has('team')) {
			snowgrave_insert_id = Number(params.get('id'));
			team = params.get('team');
			if (isNaN(snowgrave_insert_id)) {
				window.location.replace('/#/notallowed');
			}
		} else {
			window.location.replace('/#/notallowed');
		}
	});

	$inspect(edit);

	async function dispatch(): Promise<{ message: string; worked: boolean }> {
		let res = await scoutInsert({
			body: {
				snowgrave_scout_id: snowgrave_insert_id,
				defence: defence,
				game: {
					RebuiltGame: {
						defence_main: scout_form.defence_main,
						fuel_shoot_teleop: scout_form.fuel_shoot_teleop,
						fuel_pass_teleop: scout_form.fuel_pass_teleop,
						fuel_shoot_auto: scout_form.fuel_shoot_auto,
						fuel_pass_auto: scout_form.fuel_pass_auto,
						climb_end: scout_form.climb_end,
						climb_auto: scout_form.climb_auto,
						beach_on_bump: scout_form.beach_on_bump
					}
				},
				comment: comment
			}
		});

		if (res.error) {
			return {
				message: 'HTTP CODE: ' + res.response.status,
				worked: false,
			};
		} else {
			if (res.data.status === 'Error') {
				return {
					message: 'Message send from server: ' + res.data.message,
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

	async function handleEdit(): Promise<{ message: string; worked: boolean }> {
		let res = await scoutEdit({
			body: {
				snowgrave_scout_id: snowgrave_insert_id,
				defence: defence,
				comment: comment,
				game: {
					RebuiltGame: {
						defence_main: scout_form.defence_main, //
						fuel_shoot_teleop: scout_form.fuel_shoot_teleop, //
						fuel_pass_teleop: scout_form.fuel_pass_teleop, //
						fuel_shoot_auto: scout_form.fuel_shoot_auto, //
						fuel_pass_auto: scout_form.fuel_pass_auto, //
						climb_end: scout_form.climb_end, //
						climb_auto: scout_form.climb_auto, //
						beach_on_bump: scout_form.beach_on_bump
					}
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

<FormWithLoading
	dispatch={edit ? handleEdit : dispatch}
	hide_sub={form_state != 2}
	{stop}
>
	{#if form_state === States.Auto}
		<!--Auto-->
		<h1>Auto</h1>
		<h2>Shoot</h2>
		<FuelWidget bind:count={scout_form.fuel_shoot_auto}></FuelWidget>
		<h2>Pass</h2>
		<FuelWidget bind:count={scout_form.fuel_pass_auto}></FuelWidget>

		<h2>Climb Auto</h2>
		<select bind:value={scout_form.climb_auto}>
			<option value={'Nothing'}>Nothing</option>
			<option value={'Stage1'}>Stage 1</option>
			<option value={'Stage2'}>Stage 2</option>
			<option value={'Stage3'}>Stage 3</option>
		</select>
	{:else if form_state === States.Teleop}
		<!--Teleop-->
		<h1>Teleop</h1>
		<h2>Shoot</h2>
		<FuelWidget bind:count={scout_form.fuel_shoot_teleop}></FuelWidget>
		<h2>Pass</h2>
		<FuelWidget bind:count={scout_form.fuel_pass_teleop}></FuelWidget>
	{:else}
		<!--Endgame-->
		<h1>Endgame</h1>

		<h2>Climb</h2>
		<select bind:value={scout_form.climb_end}>
			<option value={'Nothing'}>Nothing</option>
			<option value={'Stage1'}>Stage 1</option>
			<option value={'Stage2'}>Stage 2</option>
			<option value={'Stage3'}>Stage 3</option>
		</select>

		<h2>Defence</h2>
		Main: <button 
				type="button"
    			onclick={() => scout_form.defence_main = !scout_form.defence_main}
				class:active={scout_form.defence_main}>
				{scout_form.defence_main ? 'True' : 'False'}
			</button>
		Beach On Bump: <button 
				type="button"
    			onclick={() => scout_form.beach_on_bump = !scout_form.beach_on_bump}
				class:active={scout_form.beach_on_bump}>
				{scout_form.beach_on_bump ? 'True' : 'False'}
			</button>
		<StarRating bind:value={defence}></StarRating>

		<h2>Comment</h2>
		<textarea bind:value={comment}></textarea>
	{/if}
	<br />
</FormWithLoading>
<br />
<button
	class="tactical-btn"
	onclick={() => {
		form_state--;
	}}
	disabled={form_state === 0}>Back page</button
>
<button
	class="tactical-btn"
	onclick={() => {
		form_state++;
	}}
	disabled={form_state > 1}>Next page</button
>

<style>
	.tactical-btn {
		padding: 0.9rem 1.6rem;
		font-size: 0.95rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;

		color: #eaeaea;
		background: linear-gradient(180deg, #2b2f33, #1a1d20);
		border: 2px solid #3a3f44;
		border-radius: 6px;

		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.08),
			0 4px 12px rgba(0, 0, 0, 0.6);

		cursor: pointer;
		transition: all 0.15s ease;
	}

	.tactical-btn:hover:not(:disabled) {
		background: linear-gradient(180deg, #353a40, #1f2327);
		border-color: #5a6066;
		transform: translateY(-1px);
	}

	.tactical-btn:active:not(:disabled) {
		transform: translateY(1px);
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.6);
	}

	.tactical-btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
		box-shadow: none;
	}
</style>
