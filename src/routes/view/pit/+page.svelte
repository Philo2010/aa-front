<script lang="ts">
	import { goto } from '$app/navigation';
	import { checkadmin } from '$lib/checkadminship';
	import { onMount } from 'svelte';
	import { get_event } from '$lib/GetCurrEvent';
	import { get } from '$lib/schema/sdk.gen';
	import { parse_team, format_team } from '$lib/ParseTeam.svelte';
	import type { PitGetSend } from '$lib/schema/types.gen';
	import RobotPathView from '$lib/RobotPathView.svelte';

	onMount(() => {
		if (!checkadmin()) {
			goto('/notallowed');
		}
	});

	let team_string = $state('');
	let team_error = $state<string | null>(null);
	let submitting = $state(false);
	let submit_error = $state<string | null>(null);
	let data = $state<PitGetSend | null>(null);

	$effect(() => {
		if (!team_string) {
			team_error = null;
			return;
		}
		const res = parse_team(team_string);
		if (typeof res === 'string') {
			team_error = res;
		} else {
			team_error = null;
		}
	});

	async function lookup() {
		const parsed = parse_team(team_string);
		if (typeof parsed === 'string') {
			team_error = parsed;
			return;
		}
		submitting = true;
		submit_error = null;
		data = null;
		try {
			const event_code = await get_event();
			const res = await get({
				body: {
					team: parsed.team_number,
					is_ab_team: parsed.is_ab_team,
					event_code,
				},
			});
			if (res.error) {
				submit_error = 'Error ' + res.response.status;
			} else if (res.data.status === 'Error') {
				submit_error = res.data.message;
			} else {
				data = res.data.message;
			}
		} catch (e) {
			submit_error = 'Failed to reach server';
		}
		submitting = false;
	}
</script>

{#if data === null}
<div class="page">
	<header class="page-header">
		<div class="header-accent"></div>
		<h1>PIT LOOKUP</h1>
		<p class="subtitle">lookup pit scouting by team</p>
	</header>

	<div class="field-group">
		<label class="field-label" for="team-input">TEAM</label>
		<input
			id="team-input"
			class="field-input"
			class:error={team_error !== null}
			bind:value={team_string}
			placeholder="e.g. 696 or 696B"
			onkeydown={(e) => { if (e.key === 'Enter') lookup(); }}
		/>
		{#if team_error}
			<span class="field-error">{team_error}</span>
		{/if}
	</div>

	{#if submit_error}
		<p class="error-msg">{submit_error}</p>
	{/if}

	<button class="btn-primary" onclick={lookup} disabled={submitting || !team_string || team_error !== null}>
		{submitting ? 'LOOKING UP…' : 'LOOKUP'}
	</button>
</div>
{:else}
<div class="page">
	<header class="page-header">
		<div class="header-accent"></div>
		<h1>PIT — {format_team(data.header.team, data.header.is_ab_team)}</h1>
		<p class="subtitle">{data.header.event_code}</p>
	</header>

	<button class="btn-ghost" onclick={() => { data = null; }}>← BACK</button>

	<div class="info-card">
		<div class="card-header"><span class="section-label">METADATA</span></div>
		<div class="info-row"><span class="info-key">SCOUTER</span><span class="info-val">{data.header.user}</span></div>
		<div class="info-row"><span class="info-key">SUBMITTED</span><span class="info-val">{data.header.created_at}</span></div>
	</div>

	<div class="info-card">
		<div class="card-header"><span class="section-label">PIT DATA</span></div>
		<div class="info-row"><span class="info-key">DRIVEBASE</span><span class="info-val">{data.pit.RebuiltPit.is_swerve ? `Swerve (${data.pit.RebuiltPit.gear_or_drivebase})` : data.pit.RebuiltPit.gear_or_drivebase}</span></div>
		<div class="info-row"><span class="info-key">DRIVER EXP</span><span class="info-val">{data.pit.RebuiltPit.years_of_driver_experience} yr</span></div>
		<div class="info-row"><span class="info-key">BATTERIES</span><span class="info-val">{data.pit.RebuiltPit.how_many_batteries_do_they_have_on_hand}</span></div>
		<div class="info-row"><span class="info-key">HAS SCOUTER</span><span class="info-val">{data.pit.RebuiltPit.do_they_have_a_scouter}</span></div>
		<div class="info-row"><span class="info-key">CAN PASS</span><span class="info-val">{data.pit.RebuiltPit.can_pass}</span></div>
		<div class="info-row"><span class="info-key">CAN SHOOT</span><span class="info-val">{data.pit.RebuiltPit.can_shoot}</span></div>
		<div class="info-row"><span class="info-key">CLIMB</span><span class="info-val">{data.pit.RebuiltPit.climb}</span></div>
		<div class="info-row"><span class="info-key">DEFENCE</span><span class="info-val">{data.pit.RebuiltPit.willing_to_play_defence}</span></div>
		{#if data.pit.RebuiltPit.strategy}
		<div class="info-row stacked"><span class="info-key">STRATEGY</span><span class="info-val muted">{data.pit.RebuiltPit.strategy}</span></div>
		{/if}
		{#if data.pit.RebuiltPit.what_they_are_looking_from_the_tournament}
		<div class="info-row stacked"><span class="info-key">GOALS</span><span class="info-val muted">{data.pit.RebuiltPit.what_they_are_looking_from_the_tournament}</span></div>
		{/if}
	</div>

	{#if data.pit.RebuiltPit.auto_paths && data.pit.RebuiltPit.auto_paths.length > 0}
	<div class="section-label" style="margin-bottom: 0.5rem;">AUTO PATHS</div>
	{#each data.pit.RebuiltPit.auto_paths as path, i}
		<RobotPathView strokes={path as any} label={`Path ${i + 1}`} />
	{/each}
	{/if}
</div>
{/if}

<style>
	.page-header { margin-bottom: 2rem; }

	.field-group {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		margin-bottom: 1.25rem;
	}

	.field-label {
		font-size: 0.60rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		color: rgba(255, 255, 255, 0.35);
	}

	.field-input {
		background: #111;
		border: 1.5px solid rgba(255, 255, 255, 0.10);
		border-radius: 8px;
		color: #fff;
		font-family: inherit;
		font-size: 0.95rem;
		padding: 0.55rem 0.75rem;
		outline: none;
		transition: border-color 0.15s;
	}

	.field-input:focus {
		border-color: rgba(60, 179, 113, 0.50);
	}

	.field-input.error {
		border-color: rgba(224, 85, 85, 0.50);
	}

	.field-error {
		font-size: 0.72rem;
		color: #e05555;
		letter-spacing: 0.04em;
	}

	.btn-primary {
		width: 100%;
		min-height: 48px;
		background: rgba(60, 179, 113, 0.15);
		border: 1px solid rgba(60, 179, 113, 0.35);
		border-radius: 8px;
		color: #5dde8a;
		font-family: inherit;
		font-size: 0.85rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		cursor: pointer;
		transition: background 0.15s;
	}

	.btn-primary:hover:not(:disabled) {
		background: rgba(60, 179, 113, 0.25);
	}

	.btn-primary:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.btn-ghost {
		background: #1a1a1a;
		border: 1px solid rgba(255, 255, 255, 0.10);
		border-radius: 6px;
		color: rgba(255, 255, 255, 0.70);
		font-family: inherit;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.10em;
		padding: 0.5rem 0.9rem;
		cursor: pointer;
		transition: border-color 0.15s;
		margin-bottom: 1.25rem;
		display: inline-block;
	}

	.btn-ghost:hover {
		border-color: rgba(255, 255, 255, 0.25);
	}

	.error-msg {
		font-size: 0.80rem;
		color: #e05555;
		margin: 0 0 1rem;
		letter-spacing: 0.06em;
	}

	.info-card {
		background: #191919;
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 10px;
		overflow: hidden;
		margin-bottom: 1rem;
	}

	.card-header {
		padding: 0.5rem 1rem;
		background: rgba(255, 255, 255, 0.03);
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	.section-label {
		font-size: 0.60rem;
		color: rgba(255, 255, 255, 0.30);
		font-weight: 700;
		letter-spacing: 0.12em;
	}

	.info-row {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		padding: 0.55rem 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.info-row:last-child {
		border-bottom: none;
	}

	.info-row.stacked {
		flex-direction: column;
		gap: 0.2rem;
	}

	.info-key {
		font-size: 0.60rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		color: rgba(255, 255, 255, 0.35);
		min-width: 90px;
		flex-shrink: 0;
	}

	.info-val {
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.85);
	}

	.info-val.muted {
		font-size: 0.80rem;
		color: rgba(255, 255, 255, 0.55);
		line-height: 1.4;
	}
</style>
