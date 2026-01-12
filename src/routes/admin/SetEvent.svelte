<script lang="ts">
    import FormWithLoading from "../../lib/FormWithLoading.svelte";
    import { setEvent } from "../../lib/schema/sdk.gen";
    let event = $state<string>();

    async function handleEvent(): Promise<{message: string, worked: boolean}> {
        let res = await setEvent({
            body: {
                event: event
            }
        });
        if (res.error) {
            return {
                message: String(res.response.status),
                worked: false
            };
        } else {
            if (res.data.status === "Error") {
                return {
                    message: "Error returned by server: " + res.data.message,
                    worked: false, 
                };
            } else {
                return {
                    message: res.data.message,
                    worked: true, 
                };
            }
        }
    }
    
</script>



<h1>Set Event</h1>
<FormWithLoading dispatch={handleEvent}>
    <input bind:value={event} placeholder="Event" />
</FormWithLoading>