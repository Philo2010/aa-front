<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { checkadmin } from '$lib/checkadminship';
	import FormWithLoading from '$lib/FormWithLoading.svelte';
	import NiceErrorTextBox from '$lib/NiceErrorTextBox.svelte';
	import FuelWidget from '$lib/FuelWidget.svelte';
	import StarRating from '$lib/StarRating.svelte';
	import { parse_team } from '$lib/ParseTeam.svelte';
	import { get_event } from '$lib/GetCurrEvent';
	import { prescoutInsert } from '$lib/schema/sdk.gen';
	import type {
		ClimbState,
		DefenceTarget,
		PrescoutInsert,
		Stations,
		TournamentLevels
	} from '$lib/schema/types.gen';

	type ScoutFormState = {
		fuel_shoot_teleop: number;
		fuel_pass_teleop: number;
		fuel_shoot_auto: number;
		fuel_pass_auto: number;
		climb_end: ClimbState;
		climb_auto: ClimbState;
		beach_on_bump: boolean;
		defence_main: boolean;
		defence_target: DefenceTarget | null;
		auto_time: number;
		dead: boolean;
		dnf: boolean;
	};

	onMount(async () => {
		if (!checkadmin()) {
			goto('/notallowed');
			return;
		}
		// Prefill with the active event, but leave it editable — prescout data
		// usually comes from a different event than the one you're at.
		event_code = await get_event();
	});

	// Match identity — a prescout entry describes a real match somewhere, it just
	// was never queued in this system, so the admin supplies all of it by hand.
	let team_str = $state('');
	let event_code = $state('');
	let match_id = $state<number>(1);
	let set = $state<number>(1);
	let tournament_level = $state<TournamentLevels>('QualificationMatch');
	let station = $state<Stations>('Red1');

	const levels: TournamentLevels[] = ['QualificationMatch', 'Quarterfinal', 'Semifinal', 'Final'];
	const stations: Stations[] = ['Red1', 'Red2', 'Red3', 'Blue1', 'Blue2', 'Blue3'];
	const climbs: ClimbState[] = ['Nothing', 'Stage1', 'Stage2', 'Stage3'];

	// Game data — same shape a scout submits.
	let scout_form = $state<ScoutFormState>({
		fuel_shoot_teleop: 0,
		fuel_pass_teleop: 0,
		fuel_shoot_auto: 0,
		fuel_pass_auto: 0,
		climb_end: 'Nothing',
		climb_auto: 'Nothing',
		beach_on_bump: false,
		defence_main: false,
		defence_target: null,
		auto_time: 0,
		dead: false,
		dnf: false,
	});
	let defence = $state<number>(0);
	let comment = $state<string>('');

	// There is no queued match to enumerate the opposing alliance from, so the
	// defended bot is typed in rather than picked from a list.
	let target_mode = $state<'alliance' | 'bot'>('alliance');
	let target_team = $state('');

	const team_error = $derived.by(() => {
		if (team_str === '') return null;
		const res = parse_team(team_str);
		return typeof res === 'string' ? res : null;
	});

	const target_error = $derived.by(() => {
		if (target_team === '') return null;
		const res = parse_team(target_team);
		return typeof res === 'string' ? res : null;
	});

	$effect(() => {
		if (!scout_form.defence_main) {
			scout_form.defence_target = null;
			return;
		}
		if (target_mode === 'alliance') {
			scout_form.defence_target = 'Alliance';
			return;
		}
		const parsed = parse_team(target_team);
		scout_form.defence_target =
			typeof parsed === 'string'
				? null
				: { Bot: { number: parsed.team_number, is_ab_team: parsed.is_ab_team } };
	});

	const target_missing = $derived(
		scout_form.defence_main && target_mode === 'bot' && scout_form.defence_target === null
	);

	const stop = $derived(
		team_str === '' ||
			team_error !== null ||
			event_code.trim() === '' ||
			comment.trim() === '' ||
			target_missing
	);

	async function handleSubmit(): Promise<{ message: string; worked: boolean }> {
		const parsed = parse_team(team_str);
		if (typeof parsed === 'string') return { message: `Team parse error: ${parsed}`, worked: false };

		const { defence_main, defence_target, auto_time, dead, dnf, ...game_fields } = scout_form;
		const body: PrescoutInsert = {
			team: parsed.team_number,
			is_ab_team: parsed.is_ab_team,
			match_id,
			set,
			event_code,
			tournament_level,
			station,
			defence,
			comment,
			defence_main,
			defence_target,
			auto_time,
			dead,
			dnf,
			game: { RebuiltGame: game_fields },
		};

		const res = await prescoutInsert({ body });
		if (res.error) return { message: `Error ${res.response.status}`, worked: false };
		if (res.data.status === 'Error') return { message: res.data.message, worked: false };

		// Keep the match identity so consecutive matches are quick to enter, but
		// clear the per-match data so nothing carries over by accident.
		match_id = match_id + 1;
		scout_form = {
			fuel_shoot_teleop: 0,
			fuel_pass_teleop: 0,
			fuel_shoot_auto: 0,
			fuel_pass_auto: 0,
			climb_end: 'Nothing',
			climb_auto: 'Nothing',
			beach_on_bump: false,
			defence_main: false,
			defence_target: null,
			auto_time: 0,
			dead: false,
			dnf: false,
		};
		defence = 0;
		comment = '';
		target_mode = 'alliance';
		target_team = '';

		return { message: res.data.message, worked: true };
	}
</script>

<div class="page">
	<header class="page-header">
		<div class="header-accent"></div>
		<h1>PRESCOUT</h1>
		<p class="subtitle">enter match data by hand</p>
	</header>

	<div class="notice">
		Prescout data is stored separately from real scouting data. It never counts toward averages,
		graphs or DPDG, and only shows in search with PRESCOUT ONLY turned on.
	</div>

	<FormWithLoading dispatch={handleSubmit} {stop} submitLabel="STORE PRESCOUT">
		<!-- ── Match identity ───────────────────── -->
		<section class="field-section">
			<div class="section-label">Team</div>
			<NiceErrorTextBox bind:input={team_str} error={team_error} placeholder="e.g. 696 or 696B" />
		</section>

		<section class="field-section">
			<div class="section-label">Match Info</div>
			<div class="row-2">
				<div class="input-group">
					<label class="input-label" for="pre-event">EVENT CODE</label>
					<input id="pre-event" class="text-input" type="text" bind:value={event_code} placeholder="2026cahaw" />
				</div>
				<div class="input-group">
					<label class="input-label" for="pre-level">LEVEL</label>
					<select id="pre-level" class="text-input select-input" bind:value={tournament_level}>
						{#each levels as lvl}
							<option value={lvl}>{lvl}</option>
						{/each}
					</select>
				</div>
			</div>
			<div class="row-2">
				<div class="input-group">
					<label class="input-label" for="pre-match">MATCH #</label>
					<input id="pre-match" class="text-input" type="number" bind:value={match_id} min="1" />
				</div>
				<div class="input-group">
					<label class="input-label" for="pre-set">SET</label>
					<input id="pre-set" class="text-input" type="number" bind:value={set} min="1" />
				</div>
			</div>
		</section>

		<section class="field-section">
			<div class="section-label">Station</div>
			<div class="station-grid">
				{#each stations as st}
					<button
						type="button"
						class="option-btn"
						class:selected={station === st}
						class:red={st.startsWith('Red')}
						class:blue={st.startsWith('Blue')}
						onclick={() => (station = st)}
					>
						{st.startsWith('Red') ? 'R' : 'B'}{st.slice(-1)}
					</button>
				{/each}
			</div>
		</section>

		<!-- ── Auto ─────────────────────────────── -->
		<div class="phase-label">Auto</div>

		<section class="field-section">
			<div class="section-label">Shoot</div>
			<FuelWidget bind:count={scout_form.fuel_shoot_auto} />
		</section>

		<section class="field-section">
			<div class="section-label">Pass</div>
			<FuelWidget bind:count={scout_form.fuel_pass_auto} />
		</section>

		<section class="field-section">
			<div class="section-label">Climb (auto)</div>
			<div class="option-grid">
				{#each climbs as opt}
					<button
						type="button"
						class="option-btn"
						class:selected={scout_form.climb_auto === opt}
						onclick={() => (scout_form.climb_auto = opt)}
					>
						{opt === 'Nothing' ? '—' : opt.replace('Stage', 'Stage ')}
					</button>
				{/each}
			</div>
		</section>

		<section class="field-section">
			<div class="section-label">Auto Time (seconds)</div>
			<input class="text-input" type="number" bind:value={scout_form.auto_time} min="0" step="0.1" />
		</section>

		<!-- ── Teleop ───────────────────────────── -->
		<div class="phase-label">Teleop</div>

		<section class="field-section">
			<div class="section-label">Shoot</div>
			<FuelWidget bind:count={scout_form.fuel_shoot_teleop} />
		</section>

		<section class="field-section">
			<div class="section-label">Pass</div>
			<FuelWidget bind:count={scout_form.fuel_pass_teleop} />
		</section>

		<!-- ── Endgame ──────────────────────────── -->
		<div class="phase-label">Endgame</div>

		<section class="field-section">
			<div class="section-label">Climb</div>
			<div class="option-grid">
				{#each climbs as opt}
					<button
						type="button"
						class="option-btn"
						class:selected={scout_form.climb_end === opt}
						onclick={() => (scout_form.climb_end = opt)}
					>
						{opt === 'Nothing' ? '—' : opt.replace('Stage', 'Stage ')}
					</button>
				{/each}
			</div>
		</section>

		<section class="field-section">
			<div class="section-label">Status</div>
			<div class="toggle-row">
				<button
					type="button"
					class="toggle-btn"
					class:on={scout_form.dead}
					onclick={() => (scout_form.dead = !scout_form.dead)}
				>
					<span class="toggle-indicator"></span>
					<span>Dead</span>
				</button>
				<button
					type="button"
					class="toggle-btn"
					class:on={scout_form.dnf}
					onclick={() => (scout_form.dnf = !scout_form.dnf)}
				>
					<span class="toggle-indicator"></span>
					<span>DNF</span>
				</button>
			</div>
		</section>

		<section class="field-section">
			<div class="section-label">Defence</div>
			<div class="toggle-row">
				<button
					type="button"
					class="toggle-btn"
					class:on={scout_form.defence_main}
					onclick={() => (scout_form.defence_main = !scout_form.defence_main)}
				>
					<span class="toggle-indicator"></span>
					<span>Main defender</span>
				</button>
				<button
					type="button"
					class="toggle-btn"
					class:on={scout_form.beach_on_bump}
					onclick={() => (scout_form.beach_on_bump = !scout_form.beach_on_bump)}
				>
					<span class="toggle-indicator"></span>
					<span>Beach on bump</span>
				</button>
			</div>

			{#if scout_form.defence_main}
				<div class="target-block">
					<div class="rating-label">Defended</div>
					<div class="option-grid two">
						<button
							type="button"
							class="option-btn"
							class:selected={target_mode === 'alliance'}
							onclick={() => (target_mode = 'alliance')}>Whole alliance</button
						>
						<button
							type="button"
							class="option-btn"
							class:selected={target_mode === 'bot'}
							onclick={() => (target_mode = 'bot')}>One bot</button
						>
					</div>
					{#if target_mode === 'bot'}
						<NiceErrorTextBox
							bind:input={target_team}
							error={target_error}
							placeholder="team defended (e.g. 696 or 696B)"
						/>
						{#if target_missing}
							<span class="target-hint">enter the bot that was defended</span>
						{/if}
					{/if}
				</div>
			{/if}

			<div class="defence-rating">
				<div class="rating-label">Defence Rating (0–5)</div>
				<StarRating bind:value={defence} />
			</div>
		</section>

		<section class="field-section">
			<div class="section-label">Comment <span class="required">required</span></div>
			<textarea bind:value={comment} placeholder="Where this data came from, notes about the team…"
			></textarea>
		</section>
	</FormWithLoading>
</div>

<style>
	.notice {
		background: rgba(255, 160, 0, 0.1);
		border: 1px solid rgba(255, 160, 0, 0.3);
		border-radius: 8px;
		color: rgba(255, 190, 110, 0.9);
		font-size: 0.72rem;
		line-height: 1.6;
		padding: 0.7rem 0.9rem;
		margin-bottom: 1.25rem;
	}

	.phase-label {
		font-size: 1.1rem;
		font-weight: 800;
		letter-spacing: 0.06em;
		color: #fff;
		margin: 1.75rem 0 0.25rem;
		padding-top: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.07);
	}

	.row-2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.6rem;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.input-label {
		font-size: 0.58rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		color: rgba(255, 255, 255, 0.35);
	}

	.select-input {
		appearance: none;
		cursor: pointer;
	}

	.option-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 8px;
	}

	.option-grid.two {
		grid-template-columns: repeat(2, 1fr);
	}

	.station-grid {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 8px;
	}

	.station-grid .option-btn.red.selected {
		background: rgba(220, 60, 60, 0.2);
		border-color: #e05555;
		color: #e06060;
	}

	.station-grid .option-btn.blue.selected {
		background: rgba(60, 110, 220, 0.2);
		border-color: #5588ee;
		color: #6699ee;
	}

	.toggle-row {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.target-block {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin-top: 0.75rem;
	}

	.target-hint {
		font-size: 0.7rem;
		color: rgba(255, 200, 90, 0.75);
	}

	.defence-rating {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin-top: 0.75rem;
	}

	.rating-label {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.4);
		letter-spacing: 0.06em;
	}

	.required {
		font-size: 0.55rem;
		color: #e05555;
		letter-spacing: 0.08em;
	}

	textarea {
		width: 100%;
		background: #111;
		border: 1.5px solid rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		color: #fff;
		font-family: inherit;
		font-size: 0.9rem;
		line-height: 1.6;
		padding: 0.75rem;
		resize: vertical;
		box-sizing: border-box;
		outline: none;
		transition: border-color 0.15s;
	}

	textarea:focus {
		border-color: rgba(60, 179, 113, 0.5);
	}

	textarea::placeholder {
		color: rgba(255, 255, 255, 0.2);
	}

	@media (max-width: 480px) {
		.station-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}
</style>
