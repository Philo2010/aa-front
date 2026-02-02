<script lang="ts">
    import NiceErrorTextBox from "$lib/NiceErrorTextBox.svelte";
    import { parse_team } from "$lib/ParseTeam.svelte";
    import type { TeamData } from "$lib/schema/types.gen";
    import type { SearchParamData } from "$lib/schema/types.gen";
    import { get_event } from "$lib/GetCurrEvent";
    import SelectTeam from "$lib/SelectTeam.svelte";
    import { search } from "$lib/schema/sdk.gen";
    
    let to_add = $state("");
    let team_string = $state<string>("");
    let team_error: string | null = $state<null>(null);
    let team = $state<TeamData | null>(null);
    let params: SearchParamData = $state({
        user: null,
        team: null,
        is_ab_team: null,
        match_id: null,
        set: null,
        total_score: null,
        event_code: null,
        tournament_level: null,
        station: null,
        is_mvp: null
    });
    $effect(() => {
        if (!team_string) return;

        const res = parse_team(team_string);
        if (typeof res === "string") {
            team_error = res;
        } else {
            // Only update if different to prevent infinite loop
            if (!team || team.team !== res.team_number || team.is_ab_team !== res.is_ab_team) {
                team = { team: res.team_number, is_ab_team: res.is_ab_team };
            }
            team_error = null;
        }
    });
    $inspect(team_string, team);

    
    function formatKey(key: string) {
        return key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    }
    
    function add() {
        if (!to_add) return;
        const key = to_add as keyof SearchParamData;

        if (key === 'team') {
            team = {
                team: 0,
                is_ab_team: false
            };
            to_add = "";
            return;
        }

        //Handle Team
        
        // Determine the default value based on the field name
        if (key === 'is_ab_team' || key === 'is_mvp') {
            (params[key] as boolean | null) = false;
        } else if (key === 'total_score' || key === 'match_id' || key === 'set' || key === 'station') {
            (params[key] as number | null) = 0;
        } else {
            (params[key] as string | null) = "";
        }
        
        to_add = ""; // Reset selection
    }

    async function dispatch(): Promise<{message: string, worked: boolean}> {
        //handle loading team
        if (team !== null) {
            params.team = team.team;
            params.is_ab_team = team.is_ab_team;
        }
        //handle event
        if (params.event_code === null) {
            let event = await get_event();
            params.event_code = event;
        }

        let res = await search({
            body: params
        });

        if (res.error) {
            return {
                message: "CODE: " + res.response.status,
                worked: false
            };
        } else {
            if (res.data.status === 'Error') {
                return {
                    message: res.data.message,
                    worked: false
                };
            } else {
                return {
                    message: "Worked!",
                    worked: true,
                };
            }
        }
    }
    
    function remove(key: keyof SearchParamData) {
        (params[key] as any) = null;
    }
    
    function isBooleanKey(key: string): key is 'is_ab_team' | 'is_mvp' {
        return key === 'is_ab_team' || key === 'is_mvp';
    }
    
    function isNumberKey(key: string): key is 'total_score' | 'match_id' | 'set' | 'station' {
        return key === 'total_score' || key === 'match_id' || key === 'set' || key === 'station';
    }
</script>

<div>
    <select bind:value={to_add}>
        <option value="">Select a parameter...</option>
        {#each Object.entries(params) as [key, value]}
            {#if value === null && key !== 'team' && key !== 'is_ab_team'}
                <option value={key}>{formatKey(key)}</option>
            {/if}
        {/each}
        <option value="team">Team</option>
    </select>
    <button onclick={add}>Add...</button>
    
    <div>
        <h3>Current Params:</h3>
        <ul>
            {#if team !== null}
                Team: <NiceErrorTextBox error={team_error} bind:input={team_string}></NiceErrorTextBox>
            {/if}
            {#each Object.entries(params) as [key, value]}
                {#if value !== null}
                    <li>
                        <label>
                            {formatKey(key)}:
                            {#if isBooleanKey(key)}
                                <input type="checkbox" bind:checked={params[key]} />
                            {:else if isNumberKey(key)}
                                <input type="number" bind:value={params[key]} />
                            {:else}
                                <input type="text" bind:value={params[key]} />
                            {/if}
                        </label>
                        <button onclick={() => remove(key as keyof SearchParamData)}>Remove</button>
                    </li>
                {/if}
            {/each}
        </ul>
    </div>
</div>

<style>
    li {
        margin: 0.5rem 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    input[type="text"],
    input[type="number"] {
        padding: 0.25rem;
        border: 1px solid #ccc;
        border-radius: 4px;
    }
</style>