<script lang="ts">
    import type { TeamData } from '../lib/ParseTeam.svelte';
    import { parse_team } from '../lib/ParseTeam.svelte';

    let team_string = $state('');
    let team_data = $derived(parse_team(team_string));
    let team_is_ab_team = $state(null);
    let team_number = $state(null);
</script>

<main>
    <input bind:value={team_string}>
    {#if typeof team_data == "string"}
    <p>{team_data}</p>
    {:else}
    <p>{team_data.team_number}</p>
    <p>{team_data.is_ab_team}</p>
    {/if}
</main>