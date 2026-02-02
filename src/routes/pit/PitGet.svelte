

<script lang="ts">
    import { onMount } from "svelte";
    import { checkadmin } from "../../lib/checkadminship";
    import { get } from "../../lib/schema/sdk.gen";
    import type { PitGetSend } from "../../lib/schema/types.gen";
    import { format_team } from "../../lib/ParseTeam.svelte";

    if (!checkadmin()) {
        window.location.replace("/#/notallowed");
    }

    let data = $state<PitGetSend | string>("loading");

    async function load_data_from_server(team: number, is_ab_team: boolean, event_code: string) {
        let res = await get({
            body: {
                team: team,
                is_ab_team: is_ab_team,
                event_code: event_code
            }
        });

        if (res.error) {
            data = "failed to get data! Code: " + res.response.status;
            return;
        } else {
            if (res.data.status === 'Error') {
                data = "Error back from server: " + res.data.message;
            } else {
                data = res.data.message;
            }
        }
    }

    onMount(() => {
        (async () => {
            let team: number = null;
            let is_ab_team: boolean = null;
            let event_code: string = null;
            const hash = window.location.hash;
            const searchPart = hash.split('?')[1];
            const params = new URLSearchParams(searchPart);
            
            if (params.has("team") || params.has("is_ab_team") || params.has("event_code")) {
                let team_temp = Number(params.get("team"));
                let is_ab_team_temp = params.get("is_ab_team");
                event_code = params.get("event_code"); //no way to check here
                //parse out bool
                if (is_ab_team_temp === "true") {
                    is_ab_team = true;
                } else if (is_ab_team_temp === "false") {
                    is_ab_team = false;
                } else {
                window.location.replace("/#/notallowed"); 
                }

                if (isNaN(team_temp)) {
                    window.location.replace("/#/notallowed");
                } else {
                    team = team_temp;
                }
                //ok now we are chill
                await load_data_from_server(team, is_ab_team, event_code);

            } else {
                window.location.replace("/#/notallowed");
            }
        })();
    });


</script>

{#if typeof(data) === 'string'}
{data}
{:else}
<h3>Metadata</h3>
    <p>Id: {data.header.id}</p>
    <p>User: {data.header.user}</p>
    <p>Team: {format_team(data.header.team, data.header.is_ab_team)}</p>
    <p>Event Code: {data.header.event_code}</p>
    <p>Created At: {data.header.created_at}</p>
<h3>Data</h3>
    <p>Height: {data.pit.ExamplePit.height}</p>
    <p>Width: {data.pit.ExamplePit.width}</p>
{/if}