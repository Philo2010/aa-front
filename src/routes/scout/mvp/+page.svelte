<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { mvpInsert } from '$lib/schema/sdk.gen';
	import SelectTeam from '$lib/SelectTeam.svelte';
	import type { Team } from '$lib/schema/types.gen';

	let is_blue = $state<boolean>(false);
	let mvp_snowgrave_id = $state<number>(0);
	let game_id = $state<number>(0);
	let mvp_team = $state<Team | undefined>(undefined);
	let comment = $state<string>('');
	let total_score = $state<number | undefined>(undefined);
	let penalty_score = $state<number | undefined>(undefined);

	let loading = $state(false);
	let error_msg = $state<string | null>(null);
	let done = $state(false);

	onMount(() => {
		const params = $page.url.searchParams;
		if (params.has('id') && params.has('is_blue') && params.has('game_id')) {
			mvp_snowgrave_id = Number(params.get('id'));
			game_id = Number(params.get('game_id'));
			is_blue = params.get('is_blue').toLowerCase() === 'true';
			if (isNaN(mvp_snowgrave_id) || isNaN(game_id)) goto('/notallowed');
		} else {
			goto('/notallowed');
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (loading) return;
		loading = true;
		error_msg = null;
		try {
			const res = await mvpInsert({
				body: {
					mvp_id: mvp_snowgrave_id,
					mvp_team,
					comment,
					total_score,
					penalty_score,
				},
			});
			if (res.error) {
				error_msg = 'HTTP ' + res.response.status;
			} else if (res.data.status === 'Error') {
				error_msg = res.data.message;
			} else {
				done = true;
			}
		} catch (err) {
			error_msg = 'Unknown error';
			console.error(err);
		} finally {
			loading = false;
		}
	}

	const alliance = $derived(is_blue ? 'BLUE' : 'RED');
</script>

{#if done}
	<div class="done-screen">
		<div class="done-content">
			<div class="done-icon">✓</div>
			<div class="done-title">MVP submitted</div>
			<div class="done-alliance" class:blue={is_blue} class:red={!is_blue}>{alliance}</div>
			<a href="/scout/select" class="done-back">← back to assignments</a>
		</div>
	</div>
{:else}
	<div class="shell">
		<header class="sticky-header">
			<div class="header-left">
				<span class="header-label">MVP REPORT</span>
				<span class="alliance-pip" class:blue={is_blue} class:red={!is_blue}>{alliance}</span>
			</div>
		</header>

		<form class="page" onsubmit={handleSubmit}>
			<fieldset disabled={loading}>

				<!-- MVP Team -->
				<section class="section">
					<div class="section-label">MVP TEAM</div>
					<div class="select-wrap" class:blue={is_blue} class:red={!is_blue}>
						<SelectTeam {is_blue} {game_id} bind:value={mvp_team} />
					</div>
				</section>

				<!-- Scores -->
				<section class="section">
					<div class="section-label">{alliance} ALLIANCE SCORES</div>
					<div class="score-grid">
						<div class="score-field">
							<label for="total">Total score</label>
							<input
								id="total"
								type="number"
								inputmode="numeric"
								bind:value={total_score}
								placeholder="0"
								min="0"
							/>
						</div>
						<div class="score-field">
							<label for="penalty">Penalty score</label>
							<input
								id="penalty"
								type="number"
								inputmode="numeric"
								bind:value={penalty_score}
								placeholder="0"
								min="0"
							/>
						</div>
					</div>
				</section>

				<!-- Comment -->
				<section class="section">
					<div class="section-label">COMMENT</div>
					<textarea
						bind:value={comment}
						placeholder="why is this team MVP?"
						rows="4"
					></textarea>
				</section>

			</fieldset>

			{#if error_msg}
				<div class="error-bar">{error_msg}</div>
			{/if}

			<div class="nav-bar">
				<button
					type="submit"
					class="submit-btn"
					class:blue={is_blue}
					class:red={!is_blue}
					disabled={loading}
				>
					{loading ? 'submitting…' : 'submit mvp'}
				</button>
			</div>
		</form>
	</div>
{/if}

<style>
	/* ── Shell ──────────────────────────────────────────── */
	.shell {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		background: #242424;
	}

	/* ── Sticky header ──────────────────────────────────── */
	.sticky-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.07);
		position: sticky;
		top: 0;
		background: #242424;
		z-index: 10;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}

	.header-label {
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.18em;
		color: rgba(255, 255, 255, 0.5);
	}

	.alliance-pip {
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		padding: 2px 7px;
		border-radius: 3px;
	}

	.alliance-pip.red {
		background: rgba(220, 60, 60, 0.2);
		color: #e06060;
	}

	.alliance-pip.blue {
		background: rgba(60, 110, 220, 0.2);
		color: #6699ee;
	}

	/* ── Page body ─────────────────────────────────────── */
	.page {
		flex: 1;
		max-width: 560px;
		width: 100%;
		margin: 0 auto;
		padding: 1.5rem 1rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	fieldset {
		border: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	/* ── Sections ──────────────────────────────────────── */
	.section {
		margin-bottom: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.section-label {
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.3);
	}

	/* ── Select team wrapper ───────────────────────────── */
	.select-wrap {
		background: #191919;
		border-radius: 10px;
		overflow: hidden;
	}

	.select-wrap.red {
		border: 1px solid rgba(220, 60, 60, 0.18);
	}

	.select-wrap.blue {
		border: 1px solid rgba(60, 110, 220, 0.18);
	}

	/* Style the child select from SelectTeam */
	.select-wrap :global(select) {
		width: 100%;
		background: transparent;
		border: none;
		color: #fff;
		font-family: inherit;
		font-size: 0.95rem;
		font-weight: 700;
		padding: 0.9rem 1rem;
		outline: none;
		cursor: pointer;
		appearance: none;
		-webkit-appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='rgba(255,255,255,0.3)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 1rem center;
		padding-right: 2.5rem;
	}

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

	.select-wrap :global(input::placeholder) {
		color: rgba(255, 255, 255, 0.2);
	}

	/* ── Score grid ────────────────────────────────────── */
	.score-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.score-field {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	label {
		font-size: 0.58rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.3);
	}

	input[type='number'] {
		background: #111;
		border: 1.5px solid rgba(255, 255, 255, 0.08);
		border-radius: 10px;
		color: #fff;
		font-family: inherit;
		font-size: 1.4rem;
		font-weight: 700;
		padding: 0.75rem 1rem;
		outline: none;
		width: 100%;
		box-sizing: border-box;
		min-height: 64px;
		text-align: center;
		-moz-appearance: textfield;
	}

	input[type='number']::-webkit-outer-spin-button,
	input[type='number']::-webkit-inner-spin-button {
		-webkit-appearance: none;
	}

	input[type='number']:focus {
		border-color: rgba(60, 179, 113, 0.5);
	}

	/* ── Textarea ──────────────────────────────────────── */
	textarea {
		background: #111;
		border: 1.5px solid rgba(255, 255, 255, 0.08);
		border-radius: 10px;
		color: #fff;
		font-family: inherit;
		font-size: 0.88rem;
		padding: 0.85rem 1rem;
		outline: none;
		resize: vertical;
		width: 100%;
		box-sizing: border-box;
		line-height: 1.5;
	}

	textarea:focus {
		border-color: rgba(60, 179, 113, 0.5);
	}

	textarea::placeholder {
		color: rgba(255, 255, 255, 0.2);
	}

	/* ── Error bar ─────────────────────────────────────── */
	.error-bar {
		font-size: 0.78rem;
		letter-spacing: 0.06em;
		color: #e06060;
		background: rgba(220, 60, 60, 0.08);
		border: 1px solid rgba(220, 60, 60, 0.2);
		border-radius: 8px;
		padding: 0.65rem 1rem;
		margin-bottom: 0.75rem;
	}

	/* ── Nav / submit bar ──────────────────────────────── */
	.nav-bar {
		position: sticky;
		bottom: 0;
		background: #242424;
		border-top: 1px solid rgba(255, 255, 255, 0.07);
		padding: 0.85rem 1rem;
		margin: 0 -1rem;
	}

	.submit-btn {
		width: 100%;
		min-height: 52px;
		border-radius: 8px;
		font-family: inherit;
		font-size: 0.85rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		cursor: pointer;
		touch-action: manipulation;
		transition: background 0.15s;
		border: 1.5px solid;
	}

	.submit-btn:active:not(:disabled) {
		transform: scale(0.97);
	}

	.submit-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.submit-btn.red {
		background: rgba(220, 60, 60, 0.12);
		border-color: rgba(220, 60, 60, 0.3);
		color: #e06060;
	}

	.submit-btn.red:hover:not(:disabled) {
		background: rgba(220, 60, 60, 0.22);
	}

	.submit-btn.blue {
		background: rgba(60, 110, 220, 0.12);
		border-color: rgba(60, 110, 220, 0.3);
		color: #6699ee;
	}

	.submit-btn.blue:hover:not(:disabled) {
		background: rgba(60, 110, 220, 0.22);
	}

	/* ── Done screen ───────────────────────────────────── */
	.done-screen {
		position: fixed;
		inset: 0;
		background: #242424;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
	}

	.done-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}

	.done-icon {
		width: 72px;
		height: 72px;
		border-radius: 50%;
		background: rgba(60, 179, 113, 0.12);
		border: 2px solid rgba(60, 179, 113, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2rem;
		color: #3cb371;
	}

	.done-title {
		font-size: 1.1rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		color: #fff;
	}

	.done-alliance {
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		padding: 3px 10px;
		border-radius: 4px;
	}

	.done-alliance.red {
		background: rgba(220, 60, 60, 0.2);
		color: #e06060;
	}

	.done-alliance.blue {
		background: rgba(60, 110, 220, 0.2);
		color: #6699ee;
	}

	.done-back {
		font-size: 0.75rem;
		letter-spacing: 0.1em;
		color: rgba(255, 255, 255, 0.35);
		text-decoration: none;
		margin-top: 0.5rem;
	}

	.done-back:hover {
		color: rgba(255, 255, 255, 0.7);
	}

	@keyframes popIn {
		from {
			opacity: 0;
			transform: scale(0.85);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
