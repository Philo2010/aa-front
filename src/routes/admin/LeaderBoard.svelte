

<script lang="ts">
    if (!checkadmin()) {
        window.location.replace("/#/notallowed");
    }
    import { getLeaderboard } from '../../lib/schema/sdk.gen';
    import type { SnowScouterDataLeaderBoard } from '../../lib/schema/types.gen';
    let data = $state<SnowScouterDataLeaderBoard[]>();
    let loading = $state(true);
    let failed = $state<string | null>();
    $effect(() => {
    (async () => {
        let res = await getLeaderboard();
        if (res.error) {
            loading = false;
            failed = "Error connecting to db: " + res.response.status;
        } else {
            if (res.data.status === 'Error') {
                loading = false;
                failed = "Error from db: " + res.data.message;
            } else {
                loading = false;
                data = res.data.message;
            }
        }
    })();
});
</script>

<h1>Leader Board</h1>

{#if !loading}
    {#if failed}
        <p style="color:red;">Failed because: {failed}</p>
    {:else}
        {#each data as scouter}
            {scouter.amount_of_warning}
            {scouter.username}
        {/each}
    {/if}
{:else}
    <p>Loading</p>
{/if}