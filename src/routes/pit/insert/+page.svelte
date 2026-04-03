<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import FormWithLoading from '$lib/FormWithLoading.svelte';
	import { insert } from '$lib/schema/sdk.gen';
	import type { ClimbState, Drivebase } from '$lib/schema/types.gen';
	import type { PathPoint } from '$lib/schema/types.gen';
	import RobotPath from '$lib/RobotPath.svelte';

	let is_swerve = $state<boolean>(false);
	let gear_or_drivetype = $state<string>('');
	let auto_paths = $state<PathPoint[][][]>([]);
	let current_path = $state<PathPoint[][]>([]);
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
			return { message: String(res.response.status), worked: false };
		} else {
			if (res.data.status === 'Error') {
				return { message: String(res.data.message), worked: false };
			} else {
				return { message: String(res.data.message), worked: true };
			}
		}
	}
</script>

<div class="pit-shell">
	<header class="pit-header">
		<div class="team-chip">
			<span class="team-label">PIT</span>
			<span class="team-name">Team {team}</span>
		</div>
	</header>

	<FormWithLoading dispatch={handleInsert} submitLabel="Submit Pit">
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
						class:on={do_they_have_a_scouter}
						onclick={() => (do_they_have_a_scouter = !do_they_have_a_scouter)}
					>
						<span class="toggle-indicator"></span>
						<span>Has a scouter</span>
					</button>
					<button
						type="button"
						class="toggle-btn"
						class:on={willing_to_play_defence}
						onclick={() => (willing_to_play_defence = !willing_to_play_defence)}
					>
						<span class="toggle-indicator"></span>
						<span>Willing to play defence</span>
					</button>
					<button
						type="button"
						class="toggle-btn"
						class:on={can_pass}
						onclick={() => (can_pass = !can_pass)}
					>
						<span class="toggle-indicator"></span>
						<span>Can pass</span>
					</button>
					<button
						type="button"
						class="toggle-btn"
						class:on={can_shoot}
						onclick={() => (can_shoot = !can_shoot)}
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
					{#each ['Nothing', 'Stage1', 'Stage2', 'Stage3'] as opt}
						<button
							type="button"
							class="option-btn"
							class:selected={climb === opt}
							onclick={() => (climb = opt as ClimbState)}
						>
							{opt === 'Nothing' ? '—' : opt.replace('Stage', 'Stage ')}
						</button>
					{/each}
				</div>
			</section>

		</div>
	</FormWithLoading>
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
		background: rgba(100, 108, 255, 0.2);
		color: #a0a5ff;
		border: 1px solid rgba(100, 108, 255, 0.35);
		padding: 2px 7px;
		border-radius: 3px;
	}

	.team-name {
		font-size: 1rem;
		font-weight: 700;
		color: #fff;
	}

	/* ── Form body ───────────────────────── */
	.form-body {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1rem;
	}

	.field-section {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.section-label {
		font-size: 0.62rem;
		font-weight: 700;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.35);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.count-badge {
		font-size: 0.55rem;
		background: rgba(255, 255, 255, 0.07);
		color: rgba(255, 255, 255, 0.4);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 3px;
		padding: 1px 6px;
		letter-spacing: 0.08em;
	}

	/* ── Text inputs ─────────────────────── */
	.text-input {
		width: 100%;
		background: #111;
		border: 1.5px solid rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		color: #fff;
		font-family: inherit;
		font-size: 0.9rem;
		padding: 0.75rem;
		box-sizing: border-box;
		outline: none;
		transition: border-color 0.15s;
	}

	.text-input:focus {
		border-color: rgba(60, 179, 113, 0.5);
	}

	.text-input::placeholder {
		color: rgba(255, 255, 255, 0.2);
	}

	/* ── Toggle buttons ──────────────────── */
	.toggle-col {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.toggle-btn {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		border: 1.5px solid rgba(255, 255, 255, 0.08);
		background: #1a1a1a;
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.88rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
		text-align: left;
		transition: all 0.12s;
		touch-action: manipulation;
	}

	.toggle-btn:active { transform: scale(0.98); }

	.toggle-indicator {
		width: 20px;
		height: 20px;
		border-radius: 4px;
		border: 2px solid rgba(255, 255, 255, 0.2);
		flex-shrink: 0;
		transition: all 0.12s;
	}

	.toggle-btn.on {
		border-color: rgba(60, 179, 113, 0.4);
		color: #fff;
	}

	.toggle-btn.on .toggle-indicator {
		background: #3cb371;
		border-color: #3cb371;
	}

	/* ── Option grid (climb) ─────────────── */
	.option-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 8px;
	}

	.option-btn {
		padding: 0.75rem 0;
		border-radius: 8px;
		border: 1.5px solid rgba(255, 255, 255, 0.1);
		background: #1a1a1a;
		color: rgba(255, 255, 255, 0.55);
		font-size: 0.8rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.12s;
		touch-action: manipulation;
	}

	.option-btn:active { transform: scale(0.95); }

	.option-btn.selected {
		background: rgba(60, 179, 113, 0.18);
		border-color: #3cb371;
		color: #5dde8a;
	}

	/* ── Auto path rows ──────────────────── */
	.path-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.6rem 0.75rem;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	.path-info {
		font-size: 0.82rem;
		color: rgba(255, 255, 255, 0.6);
	}

	.remove-btn {
		font-size: 0.75rem;
		padding: 4px 10px;
		border-radius: 5px;
		border: 1px solid rgba(229, 85, 85, 0.35);
		background: rgba(229, 85, 85, 0.1);
		color: #e05555;
		font-family: inherit;
		cursor: pointer;
		transition: background 0.12s;
		touch-action: manipulation;
	}

	.remove-btn:hover { background: rgba(229, 85, 85, 0.2); }

	.add-path-btn {
		padding: 0.7rem;
		border-radius: 8px;
		border: 1.5px dashed rgba(255, 255, 255, 0.15);
		background: transparent;
		color: rgba(255, 255, 255, 0.4);
		font-size: 0.85rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.12s;
		touch-action: manipulation;
	}

	.add-path-btn:hover:not(:disabled) {
		border-color: rgba(60, 179, 113, 0.4);
		color: #5dde8a;
	}

	.add-path-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
</style>
