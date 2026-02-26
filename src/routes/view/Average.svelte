<script lang="ts">
	import { get_event } from "$lib/GetCurrEvent";
	import { FlattenDataAvg, type RebuiltAvgFlatten } from "$lib/ParseTimeRunTimeBumAssTime";
	import { averages } from "$lib/schema/sdk.gen";
	import type { TeamAvg } from "$lib/schema/types.gen";
	import Table from "$lib/Table.svelte";
	import { onMount } from "svelte";

    let data = $state<string | RebuiltAvgFlatten[]>("Loading");

    

    async function dispatch() {
        let event = await get_event();

        let res = await averages({
			path: {
				event: event
			}
		});

        if (res.error) {
            data = "Error code: " + res.response.status;
        } else {
            if (res.data.status === 'Error') {
                data = "Error from server: " + res.data.message;
            } else {
                data = res.data.message.map(FlattenDataAvg);
            }
        }
    }

    onMount(() => {
		(async () => {await dispatch();})();
	});
</script>

{#if typeof(data) === 'string'}
<p>{data}</p>
{:else}
<Table ptData={data}></Table>
{/if}