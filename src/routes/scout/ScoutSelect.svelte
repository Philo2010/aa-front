<script lang='ts'>
    import { getYears } from "../../lib/schema/sdk.gen";
    import type { GameForArrayOfScoutingTeamForScouterWithoutIdAndMvpIds } from "../../lib/schema/types.gen";
    let games = $state<string | GameForArrayOfScoutingTeamForScouterWithoutIdAndMvpIds[]>("Loading");

    $effect(() => {
    (async () => {
        let res = await getYears();
        if (res.error) {
            games = "Error code: " + games;
        } else if (res.data.status === 'Error') {
            games = "Error from server: " + res.data.message;
        } else {
            games = res.data.message;
        }
    })()});
</script>
{#if typeof games === 'string'} 
{games}
{:else}
<!--    id: number;
    teams: Array<ScoutingTeamForScouterWithoutId>;
    mvp: MvpIds;
};-->
{#each games as game}
    <div>
        <p>Match: {game.match_id}</p>
        <p>Set: {game.set}</p>
        <p>Tournament Level: {game.tournament_level}</p>
        <p>Event Code: {game.event_code}</p>
        <h4>Your assigned to scout:</h4>
        {#each game.teams as team }
            
        {/each}

    </div>
{/each}
{/if}