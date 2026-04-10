<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { checkadmin } from '$lib/checkadminship';
	import FormWithLoading from '$lib/FormWithLoading.svelte';
	import UserSelector from '$lib/UserSelector.svelte';
	import NiceErrorTextBox from '$lib/NiceErrorTextBox.svelte';
	import { parse_team } from '$lib/ParseTeam.svelte';
	import { manualAddMatch } from '$lib/schema/sdk.gen';
	import type { TournamentLevels, ManualInsertMatchFront } from '$lib/schema/types.gen';

	onMount(() => {
		if (!checkadmin()) goto('/notallowed');
	});

	type TeamEntry = { team_str: string; scouters: string[] };

	function makeTeam(): TeamEntry {
		return { team_str: '', scouters: [''] };
	}

	let event_code = $state('');
	let match_id = $state<number>(1);
	let set = $state<number>(1);
	let tournament_level = $state<TournamentLevels>('QualificationMatch');
	let red_mvp = $state('');
	let blue_mvp = $state('');
	let red_teams = $state<TeamEntry[]>([makeTeam(), makeTeam(), makeTeam()]);
	let blue_teams = $state<TeamEntry[]>([makeTeam(), makeTeam(), makeTeam()]);

	const levels: TournamentLevels[] = ['QualificationMatch', 'Quarterfinal', 'Semifinal', 'Final'];

	function addScouter(team: TeamEntry) {
		team.scouters = [...team.scouters, ''];
	}

	function removeScouter(team: TeamEntry, i: number) {
		team.scouters = team.scouters.filter((_, idx) => idx !== i);
	}

	async function handleSubmit(): Promise<{ message: string; worked: boolean }> {
		// validate teams
		for (const t of [...red_teams, ...blue_teams]) {
			const parsed = parse_team(t.team_str);
			if (typeof parsed === 'string') return { message: `Team parse error: ${parsed}`, worked: false };
		}

		function buildTeam(t: TeamEntry, station: string) {
			const parsed = parse_team(t.team_str) as { team_number: number; is_ab_team: boolean };
			return {
				team: {
					id: 0, station: station as any, team: parsed.team_number,
					is_ab_team: parsed.is_ab_team, scouters: [], done: false, is_inserted: false,
				},
				scouters: t.scouters.filter(s => s.trim() !== ''),
			};
		}

		const body: ManualInsertMatchFront = {
			event_code,
			match_id,
			set,
			tournament_level,
			mvps: { red_username: red_mvp, blue_username: blue_mvp },
			teams_red: [
				buildTeam(red_teams[0], 'Red1'),
				buildTeam(red_teams[1], 'Red2'),
				buildTeam(red_teams[2], 'Red3'),
			],
			teams_blue: [
				buildTeam(blue_teams[0], 'Blue1'),
				buildTeam(blue_teams[1], 'Blue2'),
				buildTeam(blue_teams[2], 'Blue3'),
			],
		};

		const res = await manualAddMatch({ body });
		if (res.error) return { message: `Error ${res.response.status}`, worked: false };
		if (res.data.status === 'Error') return { message: res.data.message, worked: false };
		return { message: res.data.message, worked: true };
	}
</script>

<div class="page">
	<header class="page-header">
		<div class="header-accent"></div>
		<h1>ADD MATCH</h1>
		<p class="subtitle">manually insert a match</p>
	</header>

	<FormWithLoading dispatch={handleSubmit} submitLabel="Add Match">
		<!-- Match info -->
		<section class="field-section">
			<div class="section-label">Match Info</div>
			<div class="row-2">
				<div class="input-group">
					<label class="input-label">EVENT CODE</label>
					<input class="text-input" type="text" bind:value={event_code} placeholder="2024cave" />
				</div>
				<div class="input-group">
					<label class="input-label">LEVEL</label>
					<select class="text-input select-input" bind:value={tournament_level}>
						{#each levels as lvl}
							<option value={lvl}>{lvl}</option>
						{/each}
					</select>
				</div>
			</div>
			<div class="row-2">
				<div class="input-group">
					<label class="input-label">MATCH #</label>
					<input class="text-input" type="number" bind:value={match_id} min="1" />
				</div>
				<div class="input-group">
					<label class="input-label">SET</label>
					<input class="text-input" type="number" bind:value={set} min="1" />
				</div>
			</div>
		</section>

		<!-- MVPs -->
		<section class="field-section">
			<div class="section-label">MVPs</div>
			<div class="row-2">
				<div class="mvp-field red-mvp">
					<span class="alliance-pip red-pip">RED</span>
					<UserSelector bind:value={red_mvp} />
				</div>
				<div class="mvp-field blue-mvp">
					<span class="alliance-pip blue-pip">BLUE</span>
					<UserSelector bind:value={blue_mvp} />
				</div>
			</div>
		</section>

		<!-- Red teams -->
		<section class="field-section">
			<div class="section-label alliance-label red-label">Red Alliance</div>
			{#each red_teams as team, i}
				<div class="team-block red-block">
					<div class="team-block-header">
						<span class="station-tag red-station">R{i + 1}</span>
						<NiceErrorTextBox
							bind:input={team.team_str}
							placeholder="Team #"
							error={team.team_str && typeof parse_team(team.team_str) === 'string' ? parse_team(team.team_str) : undefined}
						/>
					</div>
					<div class="scouter-list">
						{#each team.scouters as _, si}
							<div class="scouter-row">
								<UserSelector bind:value={team.scouters[si]} />
								{#if team.scouters.length > 1}
									<button type="button" class="icon-btn remove" onclick={() => removeScouter(team, si)}>✕</button>
								{/if}
							</div>
						{/each}
						<button type="button" class="add-row-btn" onclick={() => addScouter(team)}>+ scouter</button>
					</div>
				</div>
			{/each}
		</section>

		<!-- Blue teams -->
		<section class="field-section">
			<div class="section-label alliance-label blue-label">Blue Alliance</div>
			{#each blue_teams as team, i}
				<div class="team-block blue-block">
					<div class="team-block-header">
						<span class="station-tag blue-station">B{i + 1}</span>
						<NiceErrorTextBox
							bind:input={team.team_str}
							placeholder="Team #"
							error={team.team_str && typeof parse_team(team.team_str) === 'string' ? parse_team(team.team_str) : undefined}
						/>
					</div>
					<div class="scouter-list">
						{#each team.scouters as _, si}
							<div class="scouter-row">
								<UserSelector bind:value={team.scouters[si]} />
								{#if team.scouters.length > 1}
									<button type="button" class="icon-btn remove" onclick={() => removeScouter(team, si)}>✕</button>
								{/if}
							</div>
						{/each}
						<button type="button" class="add-row-btn" onclick={() => addScouter(team)}>+ scouter</button>
					</div>
				</div>
			{/each}
		</section>
	</FormWithLoading>
</div>

<style>
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
		color: rgba(255,255,255,0.35);
	}

	.select-input {
		appearance: none;
		cursor: pointer;
	}

	.mvp-field {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 8px;
	}

	.red-mvp { background: rgba(220,60,60,0.06); border: 1px solid rgba(220,60,60,0.15); }
	.blue-mvp { background: rgba(60,110,220,0.06); border: 1px solid rgba(60,110,220,0.15); }

	.alliance-pip {
		font-size: 0.55rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		padding: 2px 6px;
		border-radius: 3px;
		flex-shrink: 0;
	}

	.red-pip { background: rgba(220,60,60,0.2); color: #e06060; }
	.blue-pip { background: rgba(60,110,220,0.2); color: #6699ee; }

	.alliance-label { font-size: 0.7rem; }
	.red-label { color: #e06060; }
	.blue-label { color: #6699ee; }

	.team-block {
		border-radius: 8px;
		overflow: hidden;
		border: 1px solid;
	}

	.red-block { border-color: rgba(220,60,60,0.2); }
	.blue-block { border-color: rgba(60,110,220,0.2); }

	.team-block-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
	}

	.red-block .team-block-header { background: rgba(220,60,60,0.06); }
	.blue-block .team-block-header { background: rgba(60,110,220,0.06); }

	.station-tag {
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		padding: 2px 6px;
		border-radius: 3px;
		flex-shrink: 0;
	}

	.red-station { background: rgba(220,60,60,0.2); color: #e06060; }
	.blue-station { background: rgba(60,110,220,0.2); color: #6699ee; }

.scouter-list {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: 0.5rem 0.75rem 0.6rem;
	}

	.scouter-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.icon-btn {
		background: transparent;
		border: 1px solid rgba(255,255,255,0.12);
		border-radius: 4px;
		color: rgba(255,255,255,0.4);
		cursor: pointer;
		font-size: 0.65rem;
		padding: 2px 5px;
		transition: color 0.15s, border-color 0.15s;
		flex-shrink: 0;
	}

	.icon-btn.remove:hover { color: #e05555; border-color: #e05555; }

	.add-row-btn {
		background: transparent;
		border: 1px dashed rgba(255,255,255,0.12);
		border-radius: 4px;
		color: rgba(255,255,255,0.35);
		cursor: pointer;
		font-size: 0.65rem;
		letter-spacing: 0.06em;
		padding: 3px 8px;
		transition: color 0.15s, border-color 0.15s;
		align-self: flex-start;
	}

	.add-row-btn:hover { color: #fff; border-color: rgba(255,255,255,0.35); }
</style>
