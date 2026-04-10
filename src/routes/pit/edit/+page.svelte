<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import FormWithLoading from '$lib/FormWithLoading.svelte';
	import { editPit, get } from '$lib/schema/sdk.gen';
	import type { ClimbState, Drivebase } from '$lib/schema/types.gen';
	import type { PathPoint } from '$lib/schema/types.gen';
	import RobotPath from '$lib/RobotPath.svelte';
	import RobotPathView from '$lib/RobotPathView.svelte';

	let is_swerve = $state<boolean>(false);
	let gear_or_drivetype = $state<string>('');
	let auto_paths = $state<PathPoint[][][]>([]);
	let current_path = $state<PathPoint[][]>([]);
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
	let loading = $state(true);
	let load_error = $state<string | null>(null);

	onMount(() => {
		(async () => {
			const params = $page.url.searchParams;
			if (params.has('id') && params.has('team')) {
				insert_id = Number(params.get('id'));
				team = params.get('team') ?? '';
				if (isNaN(insert_id)) {
					goto('/notallowed');
					return;
				}
			} else {
				goto('/notallowed');
				return;
			}

			const team_num_raw = Number(params.get('team_num'));
			const is_ab_team_raw = params.get('is_ab_team');
			const event_code_raw = params.get('event_code');

			if (
				params.has('team_num') &&
				params.has('is_ab_team') &&
				params.has('event_code') &&
				!isNaN(team_num_raw) &&
				(is_ab_team_raw === 'true' || is_ab_team_raw === 'false')
			) {
				const res = await get({
					body: {
						team: team_num_raw,
						is_ab_team: is_ab_team_raw === 'true',
						event_code: event_code_raw!,
					},
				});

				if (res.error) {
					load_error = 'Failed to load existing data (code ' + res.response.status + ')';
				} else if (res.data.status === 'Error') {
					load_error = 'Error: ' + res.data.message;
				} else {
					const pit = res.data.message.pit.RebuiltPit;
					is_swerve = pit.is_swerve;
					gear_or_drivetype = pit.gear_or_drivebase ?? '';
					auto_paths = (pit.auto_paths as PathPoint[][][]) ?? [];
					years_of_driver_experience = pit.years_of_driver_experience ?? null;
					what_they_are_looking_from_the_tournament = pit.what_they_are_looking_from_the_tournament ?? null;
					do_they_have_a_scouter = pit.do_they_have_a_scouter ?? null;
					how_many_batteries_do_they_have_on_hand = pit.how_many_batteries_do_they_have_on_hand ?? null;
					willing_to_play_defence = pit.willing_to_play_defence ?? null;
					strategy = pit.strategy ?? null;
					can_pass = pit.can_pass ?? null;
					can_shoot = pit.can_shoot ?? null;
					climb = pit.climb ?? null;
				}
			}

			loading = false;
		})();
	});

	function addPath() {
		if (current_path.length > 0) {
			auto_paths = [...auto_paths, current_path];
			current_path = [];
		}
	}

	function removePath(i: number) {
		auto_paths = auto_paths.filter((_, idx) => idx !== i);
	}

	function toggleBool(val: boolean | null): boolean {
		return val === null ? true : !val;
	}

	async function handleInsert(): Promise<{
		message: string;
		worked: boolean;
	}> {
		if (current_path.length > 0) {
			auto_paths = [...auto_paths, current_path];
			current_path = [];
		}

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

<div class="pit-shell">
	<header class="pit-header">
		<div class="team-chip">
			<span class="team-label">EDIT</span>
			<span class="team-name">Team {team}</span>
		</div>
	</header>

	{#if loading}
		<p class="load-status">Loading…</p>
	{:else}
	{#if load_error}
		<p class="load-error">{load_error}</p>
	{/if}

	<FormWithLoading dispatch={handleInsert} submitLabel="Save Changes">
		<div class="form-body">

			<!-- Drivebase -->
			<section class="field-section">
				<div class="section-label">Drivebase</div>
				<button
					type="button"
					class="toggle-btn"
					class:on={is_swerve}
					onclick={() => (is_swerve = !is_swerve)}
				>
					<span class="toggle-indicator"></span>
					<span>Swerve drive</span>
				</button>
				<input
					type="text"
					class="text-input"
					bind:value={gear_or_drivetype}
					placeholder={is_swerve ? 'Gear ratio…' : 'Drivebase type…'}
				/>
			</section>

			<!-- Auto Paths -->
			<section class="field-section">
				<div class="section-label">
					Auto Paths
					<span class="count-badge">{auto_paths.length} / 3</span>
				</div>

				{#each auto_paths as path, i}
					<div class="path-row">
						<span class="path-info">Path {i + 1} — {path.length} stroke{path.length !== 1 ? 's' : ''}</span>
						<button type="button" class="remove-btn" onclick={() => removePath(i)}>Remove</button>
					</div>
					<RobotPathView strokes={path} />
				{/each}

				{#if auto_paths.length < 3}
					<RobotPath bind:pathData={current_path} />
					<button
						type="button"
						class="add-path-btn"
						onclick={addPath}
						disabled={current_path.length === 0}
					>
						+ Add Path
					</button>
				{/if}
			</section>

			<!-- Driver Experience -->
			<section class="field-section">
				<div class="section-label">Years of Driver Experience</div>
				<input type="number" class="text-input" bind:value={years_of_driver_experience} min="0" />
			</section>

			<!-- Tournament Goals -->
			<section class="field-section">
				<div class="section-label">Looking for from tournament</div>
				<input
					type="text"
					class="text-input"
					bind:value={what_they_are_looking_from_the_tournament}
					placeholder="Goals…"
				/>
			</section>

			<!-- Batteries -->
			<section class="field-section">
				<div class="section-label">Batteries on hand</div>
				<input type="number" class="text-input" bind:value={how_many_batteries_do_they_have_on_hand} min="0" />
			</section>

			<!-- Strategy -->
			<section class="field-section">
				<div class="section-label">Strategy</div>
				<input type="text" class="text-input" bind:value={strategy} placeholder="Strategy…" />
			</section>

			<!-- Toggles -->
			<section class="field-section">
				<div class="section-label">Capabilities</div>
				<div class="toggle-col">
					<button
						type="button"
						class="toggle-btn"
						class:on={do_they_have_a_scouter === true}
						onclick={() => (do_they_have_a_scouter = toggleBool(do_they_have_a_scouter))}
					>
						<span class="toggle-indicator"></span>
						<span>Has a scouter</span>
					</button>
					<button
						type="button"
						class="toggle-btn"
						class:on={willing_to_play_defence === true}
						onclick={() => (willing_to_play_defence = toggleBool(willing_to_play_defence))}
					>
						<span class="toggle-indicator"></span>
						<span>Willing to play defence</span>
					</button>
					<button
						type="button"
						class="toggle-btn"
						class:on={can_pass === true}
						onclick={() => (can_pass = toggleBool(can_pass))}
					>
						<span class="toggle-indicator"></span>
						<span>Can pass</span>
					</button>
					<button
						type="button"
						class="toggle-btn"
						class:on={can_shoot === true}
						onclick={() => (can_shoot = toggleBool(can_shoot))}
					>
						<span class="toggle-indicator"></span>
						<span>Can shoot</span>
					</button>
				</div>
			</section>

			<!-- Climb -->
			<section class="field-section">
				<div class="section-label">Climb</div>
				<div class="option-grid">
					<button
						type="button"
						class="option-btn"
						class:selected={climb === null}
						onclick={() => (climb = null)}
					>
						—
					</button>
					{#each ['Nothing', 'Stage1', 'Stage2', 'Stage3'] as opt}
						<button
							type="button"
							class="option-btn"
							class:selected={climb === opt}
							onclick={() => (climb = opt as ClimbState)}
						>
							{opt === 'Nothing' ? 'None' : opt.replace('Stage', 'Stage ')}
						</button>
					{/each}
				</div>
			</section>

		</div>
	</FormWithLoading>
	{/if}
</div>

<style>
	.pit-shell {
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
		max-width: 480px;
		margin: 0 auto;
		padding: 0 0 2rem;
	}

	/* ── Header ──────────────────────────── */
	.pit-header {
		display: flex;
		align-items: center;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.07);
		position: sticky;
		top: 0;
		background: #242424;
		z-index: 10;
	}

	.team-chip {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.team-label {
		font-size: 0.58rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		background: rgba(255, 180, 0, 0.15);
		color: #ffd060;
		border: 1px solid rgba(255, 180, 0, 0.3);
		padding: 2px 7px;
		border-radius: 3px;
	}

	.team-name {
		font-size: 1rem;
		font-weight: 700;
		color: #fff;
	}

	/* ── Section label (flex for badge) ─── */
	.section-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	/* ── Option grid (climb) ─────────────── */
	.option-grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 8px;
	}

	.load-status {
		padding: 1rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.load-error {
		padding: 0.5rem 1rem;
		color: #f87171;
		font-size: 0.85rem;
	}
</style>
