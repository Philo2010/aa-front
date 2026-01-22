<h1>NOT UPDATED, IF YOU SEE THIS PLEASE DO NOT REMOVE</h1>

<script lang="ts">
    import FormWithLoading from "../../lib/FormWithLoading.svelte";
    import { insert } from "../../lib/schema/sdk.gen";
    import { onMount } from 'svelte';

    let url = new URL(window.location.href);
    let width = $state<number>(0);
    let height = $state<number>(0);
    let team = $state<string>("");

    let insert_id: number;
    onMount(() => {
        // For hash-based routing like #/pit/insert?id=2&team=5829
        const hash = window.location.hash;
        const searchPart = hash.split('?')[1];
        const params = new URLSearchParams(searchPart);
        
        if (params.has("id") || params.has("team")) {
            insert_id = Number(params.get("id"));
            team = params.get("team");
            if (isNaN(insert_id)) {
                window.location.replace("/#/notallowed");
            }
        } else {
            window.location.replace("/#/notallowed");
        }
    });


    async function handleInsert(): Promise<{message: string, worked: boolean}> {
        let res = await insert({
            body: {
                pit_insert_id: insert_id,
                pit: {
                    ExamplePit: {
                        width: width,
                        height: height
                    }
                }
            }
        })
        if (res.error) {
            return {
                message: String(res.response.status),
                worked: false
            };
        } else {
            if (res.data.status = 'Error') {
                return {
                    message: String(res.data.message),
                    worked: false
                };
            } else {
                return {
                    message: String(res.data.message),
                    worked: true
                };
            }
        }
    }
</script>
<FormWithLoading dispatch={handleInsert}>
    <h1>Currently geting data for team: {team}</h1>
    <h2>Width</h2>
    <input type="number" bind:value={width}>
    <h2>Height</h2>
    <input type="number" bind:value={height}>
</FormWithLoading>