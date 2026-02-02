

<script lang="ts">
    import FormWithLoading from '../../lib/FormWithLoading.svelte';
    import UserSelector from '../../lib/UserSelector.svelte';
    import { sendScoutwarn } from '../../lib/schema/sdk.gen';
    import { checkadmin } from "../../lib/checkadminship";
    
    let used_to_send = $state<string>("");
    let message = $state<string>("");
    let anon = $state<boolean>(false);
    let stop = $derived(used_to_send == "");
    
    if (!checkadmin()) {
        window.location.replace("/#/notallowed");
    }
    
    async function send(): Promise<{ message: string; worked: boolean }> {
        let res = await sendScoutwarn({
            body: {
                resv: used_to_send,
                message: message,
                is_anon: anon
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
    <UserSelector bind:value={used_to_send} />
    
    <h2>Message</h2>
    <textarea bind:value={message}></textarea>
    <h2>Is anon</h2>
    <input type="checkbox" bind:checked={anon}>
    <br> 
    <br>    
</FormWithLoading>