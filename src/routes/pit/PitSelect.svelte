<script lang="ts">
    import { da } from "zod/locales";
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
{/if}