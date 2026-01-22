<h1>NOT UPDATED, IF YOU SEE THIS PLEASE DO NOT REMOVE</h1>

<script lang="ts">
    import LinkButton from "../../lib/LinkButton.svelte";
    import { format_team } from "../../lib/ParseTeam.svelte";

    import { getForScout } from "../../lib/schema/sdk.gen";
    import type { PitScouterInstance } from "../../lib/schema/types.gen";
    let data: Array<PitScouterInstance> | string = $state("still loading!");


    //we must grab the data first
    $effect(() => {
    (async () => {
        let res = await getForScout();
        if (res.error) {
            data = "Error code: " + data;
        } else if (res.data.status === 'Error') {
            data = "Error from server: " + res.data.message;
        } else {
            data = res.data.message;
        }
    })();
    });
</script>

{#if typeof(data) == 'string'}
{data}
{:else if data.length == 0}
<p>There are no entrys!</p>
{:else} 
{#each data as game}
   <div class="pit-game-box">
        <p>Event: {game.event}</p>
        <p>Team: {format_team(game.team, game.is_ab_team)}</p>
        {#if game.is_sum}
            <LinkButton to="#/pit/edit?id={game.id}&team={format_team(game.team, game.is_ab_team)}">Redo</LinkButton>
        {:else}
            <LinkButton to="#/pit/insert?id={game.id}&team={format_team(game.team, game.is_ab_team)}">Start</LinkButton>
        {/if}
   </div>
{/each}
{/if}

<style>
    .pit-game-box {
        background-color: #3cb371;
        padding: 10px;
        border-radius: 10px;
        margin: 10px;
    }
</style>