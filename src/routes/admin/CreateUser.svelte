<script lang="ts">
    import FormWithLoading from "../../lib/FormWithLoading.svelte";
    import { createUserFront } from "../../lib/schema/sdk.gen";

    let username = $state<string>("");
    let password = $state<string>("");
    let is_admin = $state<boolean>(false);

    async function dispatch(): Promise<{ message: string; worked: boolean }> {
        let res = await createUserFront({
            body: {
                username: username,
                password: password,
                is_admin: String(is_admin)
            }
        });

        if (res.error) {
            return {
                message: "Failed to connect status: " + res.response.status,
                worked: false
            };
        } else {
            if (res.data.status === 'Error') {
                return {
                    message: "Error from Server: " + res.data.message,
                    worked: false
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



<FormWithLoading {dispatch}>
    <input bind:value={username} placeholder="Username"> <br>
    <input bind:value={password} placeholder="Password">
    <h3>Is admin</h3>
    <input type="checkbox" bind:checked={is_admin} /><br>

</FormWithLoading>