<script lang="ts">
    import { tr } from 'zod/locales';
    import FormWithLoading from '../../lib/FormWithLoading.svelte';
    import { sendScoutwarn } from '../../lib/schema/sdk.gen';
    import { getAllUsers } from '../../lib/schema/sdk.gen';

    let users = $state<null | string[]>(null);
    let used_to_send = $state<string>("");
    let message = $state<string>();
    let stop = $derived((used_to_send == ""));

    $effect(() => {
        (async () => {
            let res = await getAllUsers();
            if (res.error) {
                users = null;
            } else {
                if (res.data.status == 'Error') {
                    users = null
                } else {
                    users = res.data.message;
                }
            }
        })();
    })
    async function send(): Promise<{ message: string; worked: boolean }> {
        let res = await sendScoutwarn({
            body: {
                resv: used_to_send,
                message: message,
            }
        });

        if (res.error) {
            return {
                message: String(res.response.status),
                worked: false
            };
        } else {
            if (res.data.status == "Error") {
                return {
                    message: "Error returned by server: " + res.data.message,
                    worked: false, 
                };
            } else {
                return {
                    message: res.data.message, 
                    worked: true
                };
            }
        }
    } 
    
</script>

<h1>Send Warning</h1>
<FormWithLoading dispatch={send} submitLabel="Send" {stop}>
    <h2>Person to send to</h2>
    {#if users != null}
        <select bind:value={used_to_send}>
            {#each users as user}
                <option value={user}>
                    {user}
                </option>
            {/each}
        </select>
    {:else}
        <input bind:value={used_to_send}>
    {/if}
    <h2>Message</h2>
    <textarea bind:value={message}></textarea>
    <br> 
    <br>    
</FormWithLoading>