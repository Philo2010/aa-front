

<script lang="ts">
    import { resetPassword } from "../../lib/schema/sdk.gen";
    import FormWithLoading from "../../lib/FormWithLoading.svelte";
    import UserSelector from "../../lib/UserSelector.svelte";
    import { checkadmin } from "../../lib/checkadminship";
    let user = $state<string>("");
    let password = $state<string>("");
    let stop = $derived((user === ""));
    if (!checkadmin()) {
        window.location.replace("/#/notallowed");
    }


    async function handlepass(): Promise<{message: string, worked: boolean}> {
        let res = await resetPassword({
            body: {
                user: user,
                new_password: password
            }
        });

        if (res.error) {
            return {
                message: String(res.response.status),
                worked: false
            }
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

<FormWithLoading dispatch={handlepass} {stop} submitLabel="Submit">
    <h1>Password Reset</h1>
    <h2>User</h2>
    <UserSelector bind:value={user} />
    <h2>Password</h2>
    <input bind:value={password} />
</FormWithLoading>