<h1>NOT UPDATED, IF YOU SEE THIS PLEASE DO NOT REMOVE</h1>

<script lang="ts">
    import type { TeamData } from "$lib/schema/types.gen";
    import SelectTeam from "$lib/SelectTeam.svelte";
    let val = $state<TeamData | undefined>(undefined);
    $effect(() => {
      if (typeof(val) !== 'undefined') {
        console.log(val);
      }
    })

  
</script>

<div>
  <h1>My App</h1>
  <SelectTeam is_blue={false} bind:value={val} game_id={1}></SelectTeam>
</div>

<style>

</style>