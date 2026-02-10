<script lang="ts">
	import FormWithLoading from "$lib/FormWithLoading.svelte";
	import { get_event } from "$lib/GetCurrEvent";
	import NiceErrorTextBox from "$lib/NiceErrorTextBox.svelte";
	import { parse_team } from "$lib/ParseTeam.svelte";
    import { graph } from "$lib/schema/sdk.gen";
    import type { GraphData, TeamData } from "$lib/schema/types.gen";
	import { Line } from "svelte-chartjs";
    import {generateGraphData} from "$lib/ChudMasterGoonSoft";
    import type {GraphDataF} from "$lib/ChudMasterGoonSoft";
    
    let teams_string = $state<string[]>(new Array());
    const teamErrors = $derived(
        teams_string.map(value => {
            const res = parse_team(value);
            return typeof res === "string" ? res : null;
        })
    );
    let done = $state<boolean>(false);
    let final_data = $state<GraphDataF | null>(null);
    
    $effect(() => {
        done = teamErrors.every(element => element !== null);
    })
    
    async function dispatch(): Promise<{ message: string; worked: boolean }>  {
        let event = await get_event();
        let all_teams: Array<TeamData> = new Array();
        teams_string.forEach((element) => {
            let type = parse_team(element);
            if (typeof type == 'string') {
                return {
                    message: "SHOULD NOT BE ABLE REACTH THIS POINT",
                    worked: false
                };
            } else {
                let final: TeamData = {
                    is_ab_team: type.is_ab_team,
                    team: type.team_number
                };
                all_teams.push(final);
            }
        })
        let res = await graph({
			body: {
				event: event,
				teams: all_teams
			}
		});
        if (res.error) {
            return {
                message: String(res.response.status),
                worked: false
            };
        } else {
            if (res.data.status === 'Error') {
                return {
                    message: res.data.message,
                    worked: false
                };
            } else {
                final_data = generateGraphData(res.data.message);
                return {
                    message: "Got data!",
                    worked: true
                };
            }
        }
    }
    
    function add() {
        teams_string.push("");
    }
</script>

{#if final_data === null}
<FormWithLoading stop={done} dispatch={dispatch}>
    {#each teams_string as team, i}
        <NiceErrorTextBox bind:input={teams_string[i]} error={teamErrors[i]}></NiceErrorTextBox>
    {/each}
    <button type="button" onclick={add}>Add</button>
</FormWithLoading>
{:else}
<h2>Total Score Over Time</h2>
<Line data={final_data.total}></Line>

<h2>Auto Score Over Time</h2>
<Line data={final_data.auto}></Line>

<h2>Teleop Score Over Time</h2>
<Line data={final_data.teleop}></Line>

<h2>Defense Rating Over Time</h2>
<Line data={final_data.defense}></Line>
{/if}