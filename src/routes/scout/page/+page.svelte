<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import FormWithLoading from '$lib/FormWithLoading.svelte';
	import type { Insert2 } from '$lib/schema/types.gen';
	import { scoutEdit, scoutInsert } from '$lib/schema/sdk.gen';
	import StarRating from '$lib/StarRating.svelte';
	import FuelWidget from '$lib/FuelWidget.svelte';
	import AutoTime from '$lib/AutoTime.svelte';
	import NiceErrorTextBox from '$lib/NiceErrorTextBox.svelte';
	import SelectTeam from '$lib/SelectTeam.svelte';
	import { parse_team } from '$lib/ParseTeam.svelte';
	import type { Team } from '$lib/schema/types.gen';

	let team = $state<string>('');
	let stop = $state<boolean>(true);
	let snowgrave_insert_id: number;
	let edit = $state<boolean>(false);
	let done = $state<boolean>(false);
	let defence = $state<number>(0);
	let comment = $state<string>('');
	let scout_form = $state<Insert2>({
		defence_main: false,
		defence_target: null,
		fuel_shoot_teleop: 0,
		fuel_pass_teleop: 0,
		fuel_shoot_auto: 0,
		fuel_pass_auto: 0,
		climb_end: 'Nothing',
		climb_auto: 'Nothing',
		beach_on_bump: false,
		dead: false,
		dnf: false,
		auto_time: 0
	});

	// Who the main defender was defending: the whole alliance, or one bot on it.
	let target_mode = $state<'alliance' | 'bot'>('alliance');
	let target_bot = $state<Team | undefined>(undefined);
	// Fallback when the match's teams can't be listed (old link without game_id).
	let target_team = $state<string>('');

	const target_team_error = $derived.by(() => {
		if (!scout_form.defence_main || target_mode !== 'bot') return null;
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
		if (can_pick_bot) {
			scout_form.defence_target = target_bot ? { Bot: target_bot } : null;
			return;
		}
		const res = parse_team(target_team);
		scout_form.defence_target =
			typeof res === 'string' ? null : { Bot: { number: res.team_number, is_ab_team: res.is_ab_team } };
	});

	// A main defender that says "one bot" has to say which one.
	const target_missing = $derived(
		scout_form.defence_main && target_mode === 'bot' && scout_form.defence_target == null
	);

	$effect(() => {
		stop = comment.trim() === '' || target_missing;
	});

	const Steps = ['Auto', 'Teleop', 'Endgame'] as const;
	let step = $state(0);

	const params = $page.url.searchParams;

	if (params.has('edit') && params.get('edit') === 'true') edit = true;

	if (params.has('id') && params.has('team')) {
		snowgrave_insert_id = Number(params.get('id'));
		team = params.get('team') ?? '';
		if (isNaN(snowgrave_insert_id)) goto('/notallowed');
	} else {
		goto('/notallowed');
	}

	// Optional — only used to list the opposing bots for a defence target. Links
	// made before these params existed still work, they just fall back to typing
	// the team number.
	const upcoming_game_id = Number(params.get('game_id'));
	const scouting_blue = params.get('is_blue')?.toLowerCase() === 'true';
	const can_pick_bot = params.has('game_id') && params.has('is_blue') && Number.isInteger(upcoming_game_id) && upcoming_game_id > 0;

	async function dispatch(): Promise<{ message: string; worked: boolean }> {
		let res = await scoutInsert({
			body: {
				snowgrave_scout_id: snowgrave_insert_id,
				defence,
				game: { RebuiltGame: { ...scout_form } },
				comment
			}
		});
		if (res.error) return { message: 'HTTP ' + res.response.status, worked: false };
		if (res.data.status === 'Error') return { message: res.data.message, worked: false };
		done = true;
		return { message: res.data.message, worked: true };
	}

	async function handleEdit(): Promise<{ message: string; worked: boolean }> {
		let res = await scoutEdit({
			body: {
				snowgrave_scout_id: snowgrave_insert_id,
				defence,
				comment,
				game: { RebuiltGame: { ...scout_form } }
			}
		});
		if (res.error) return { message: String(res.response.status), worked: false };
		if (res.data.status === 'Error') return { message: String(res.data.message), worked: false };
		done = true;
		return { message: String(res.data.message), worked: true };
	}
</script>

{#if done}
	<div class="done-screen">
		<div class="done-content">
			<div class="done-icon">✓</div>
			<div class="done-title">{edit ? 'Redo submitted' : 'Submitted'}</div>
			<div class="done-team">Team {team}</div>
			<a href="/scout/select" class="done-back">← Back to assignments</a>
		</div>
	</div>
{:else}

<div class="scout-shell">
	<!-- Header -->
	<header class="scout-header">
		<div class="team-chip">
			{#if edit}<span class="redo-tag">REDO</span>{/if}
			<span class="team-name">Team {team}</span>
		</div>
		<div class="step-dots">
			{#each Steps as s, i}
				<button
					type="button"
					class="dot"
					class:active={i === step}
					class:done={i < step}
					onclick={() => step = i}
					title={s}
				></button>
			{/each}
		</div>
	</header>

	<!-- Step label -->
	<div class="step-label">
		<span class="step-name">{Steps[step]}</span>
		<span class="step-count">{step + 1} / {Steps.length}</span>
	</div>

	<!-- Form content -->
	<FormWithLoading
		dispatch={edit ? handleEdit : dispatch}
		hide_sub={step !== 2}
		{stop}
		submitLabel={edit ? 'Save edit' : 'Submit'}
	>
		<div class="form-body">
			{#if step === 0}
				<!-- AUTO -->
				<section class="field-section">
					<div class="section-label">Shoot</div>
					<FuelWidget bind:count={scout_form.fuel_shoot_auto} />
				</section>

				<section class="field-section">
					<div class="section-label">Pass</div>
					<FuelWidget bind:count={scout_form.fuel_pass_auto} />
				</section>

				<section class="field-section">
					<div class="section-label">Climb</div>
					<div class="option-grid">
						{#each ['Nothing', 'Stage1', 'Stage2', 'Stage3'] as opt}
							<button
								type="button"
								class="option-btn"
								class:selected={scout_form.climb_auto === opt}
								onclick={() => scout_form.climb_auto = opt as any}
							>
								{opt === 'Nothing' ? '—' : opt.replace('Stage', 'Stage ')}
							</button>
						{/each}
					</div>
				</section>

				<section class="field-section">
					<div class="section-label">Auto Time</div>
					<AutoTime bind:current_time_in_seconds={scout_form.auto_time} />
				</section>

			{:else if step === 1}
				<!-- TELEOP -->
				<section class="field-section">
					<div class="section-label">Shoot</div>
					<FuelWidget bind:count={scout_form.fuel_shoot_teleop} />
				</section>

				<section class="field-section">
					<div class="section-label">Pass</div>
					<FuelWidget bind:count={scout_form.fuel_pass_teleop} />
				</section>

			{:else}
				<!-- ENDGAME -->
				<section class="field-section">
					<div class="section-label">Climb</div>
					<div class="option-grid">
						{#each ['Nothing', 'Stage1', 'Stage2', 'Stage3'] as opt}
							<button
								type="button"
								class="option-btn"
								class:selected={scout_form.climb_end === opt}
								onclick={() => scout_form.climb_end = opt as any}
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
							onclick={() => scout_form.dead = !scout_form.dead}
						>
							<span class="toggle-indicator"></span>
							<span>Dead</span>
						</button>
						<button
							type="button"
							class="toggle-btn"
							class:on={scout_form.dnf}
							onclick={() => scout_form.dnf = !scout_form.dnf}
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
							onclick={() => scout_form.defence_main = !scout_form.defence_main}
						>
							<span class="toggle-indicator"></span>
							<span>Main defender</span>
						</button>
						<button
							type="button"
							class="toggle-btn"
							class:on={scout_form.beach_on_bump}
							onclick={() => scout_form.beach_on_bump = !scout_form.beach_on_bump}
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
									onclick={() => target_mode = 'alliance'}
								>Whole alliance</button>
								<button
									type="button"
									class="option-btn"
									class:selected={target_mode === 'bot'}
									onclick={() => target_mode = 'bot'}
								>One bot</button>
							</div>
							{#if target_mode === 'bot'}
								{#if can_pick_bot}
									<div class="select-wrap">
										<SelectTeam game_id={upcoming_game_id} is_blue={!scouting_blue} bind:value={target_bot} />
									</div>
									{#if target_missing}
										<span class="target-hint">pick the bot you defended</span>
									{/if}
								{:else}
									<NiceErrorTextBox
										bind:input={target_team}
										error={target_team_error}
										placeholder="team defended (e.g. 696 or 696B)"
									/>
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
					<textarea
						bind:value={comment}
						placeholder="Notes about this team…"
						rows="4"
					></textarea>
				</section>
			{/if}
		</div>
	</FormWithLoading>

	<!-- Nav -->
	<div class="nav-bar">
		<button
			type="button"
			class="nav-btn back"
			onclick={() => step--}
			disabled={step === 0}
		>← Back</button>
		<button
			type="button"
			class="nav-btn next"
			onclick={() => step++}
			disabled={step >= 2}
		>Next →</button>
	</div>
</div>

{/if}

<style>
	/* ── Shell ──────────────────────────── */
	.scout-shell {
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
		max-width: 480px;
		margin: 0 auto;
		padding: 0 0 1rem;
	}

	/* ── Header ─────────────────────────── */
	.scout-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid rgba(255,255,255,0.07);
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

	.redo-tag {
		font-size: 0.58rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		background: rgba(255,160,0,0.2);
		color: #ffa000;
		border: 1px solid rgba(255,160,0,0.35);
		padding: 2px 7px;
		border-radius: 3px;
	}

	.team-name {
		font-size: 1rem;
		font-weight: 700;
		color: #fff;
	}

	.step-dots {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		border: none;
		cursor: pointer;
		padding: 0;
		background: rgba(255,255,255,0.15);
		transition: background 0.2s, transform 0.15s;
	}

	.dot.done    { background: rgba(60,179,113,0.5); }
	.dot.active  { background: #3cb371; transform: scale(1.3); }

	/* ── Step label ─────────────────────── */
	.step-label {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		padding: 0.9rem 1rem 0.4rem;
	}

	.step-name {
		font-size: 1.4rem;
		font-weight: 800;
		letter-spacing: 0.06em;
		color: #fff;
	}

	.step-count {
		font-size: 0.65rem;
		letter-spacing: 0.1em;
		color: rgba(255,255,255,0.3);
	}

	/* ── Form body ──────────────────────── */
	.form-body { padding: 0.5rem 1rem 1rem; }

	.section-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.required {
		font-size: 0.55rem;
		color: #e05555;
		letter-spacing: 0.08em;
	}

	/* ── Option grid (climb) ────────────── */
	.option-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 8px;
	}

	.option-grid.two {
		grid-template-columns: repeat(2, 1fr);
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

	.select-wrap {
		background: #111;
		border: 1.5px solid rgba(255, 255, 255, 0.1);
		border-radius: 10px;
	}

	/* Style the child select/input from SelectTeam */
	.select-wrap :global(select),
	.select-wrap :global(input) {
		width: 100%;
		background: transparent;
		border: none;
		color: #fff;
		font-family: inherit;
		font-size: 0.95rem;
		padding: 0.9rem 1rem;
		outline: none;
		box-sizing: border-box;
	}

	.select-wrap :global(select) {
		font-weight: 700;
		cursor: pointer;
		appearance: none;
		-webkit-appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='rgba(255,255,255,0.3)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 1rem center;
		padding-right: 2.5rem;
	}

	/* ── Toggle row ─────────────────────── */
	.toggle-row {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	/* ── Defence rating ─────────────────── */
	.defence-rating {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.rating-label {
		font-size: 0.7rem;
		color: rgba(255,255,255,0.4);
		letter-spacing: 0.06em;
	}

	/* ── Textarea ───────────────────────── */
	textarea {
		width: 100%;
		background: #111;
		border: 1.5px solid rgba(255,255,255,0.1);
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

	textarea:focus { border-color: rgba(60,179,113,0.5); }
	textarea::placeholder { color: rgba(255,255,255,0.2); }

	/* ── Nav bar ────────────────────────── */
	.nav-bar {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
		padding: 1rem 1rem 0;
		position: sticky;
		bottom: 0;
		background: #242424;
		border-top: 1px solid rgba(255,255,255,0.07);
	}

	.nav-btn {
		padding: 0.9rem;
		border-radius: 10px;
		font-size: 0.9rem;
		font-weight: 700;
		font-family: inherit;
		letter-spacing: 0.05em;
		cursor: pointer;
		transition: all 0.12s;
		touch-action: manipulation;
		border: 1.5px solid rgba(255,255,255,0.1);
	}

	.nav-btn:active:not(:disabled) { transform: scale(0.97); }

	.nav-btn:disabled {
		opacity: 0.25;
		cursor: not-allowed;
	}

	.back {
		background: #1a1a1a;
		color: rgba(255,255,255,0.7);
	}

	.back:hover:not(:disabled) { background: #242424; }

	.next {
		background: rgba(60,179,113,0.15);
		border-color: rgba(60,179,113,0.4);
		color: #5dde8a;
	}

	.next:hover:not(:disabled) { background: rgba(60,179,113,0.25); }

	/* ── Done screen ─────────────────────── */
	.done-screen {
		position: fixed;
		inset: 0;
		background: #242424;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		animation: fadeIn 0.25s ease both;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to   { opacity: 1; }
	}

	.done-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
	}

	@keyframes popIn {
		from { opacity: 0; transform: scale(0.85); }
		to   { opacity: 1; transform: scale(1); }
	}

	.done-icon {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		background: rgba(60, 179, 113, 0.15);
		border: 2px solid rgba(60, 179, 113, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2.2rem;
		color: #3cb371;
	}

	.done-title {
		font-size: 1.5rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		color: #fff;
	}

	.done-team {
		font-size: 0.8rem;
		letter-spacing: 0.12em;
		color: rgba(255, 255, 255, 0.4);
	}

	.done-back {
		margin-top: 0.5rem;
		padding: 0.7rem 1.5rem;
		border-radius: 8px;
		background: rgba(60, 179, 113, 0.12);
		border: 1.5px solid rgba(60, 179, 113, 0.3);
		color: #5dde8a;
		text-decoration: none;
		font-size: 0.82rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		transition: background 0.15s;
	}

	.done-back:hover { background: rgba(60, 179, 113, 0.22); }
</style>
