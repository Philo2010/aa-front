<script lang="ts">
    import { getAllUsers } from '../lib/schema/sdk.gen';
    
    interface Props {
        value: string;
        onchange?: (value: string) => void;
    }
    
    let { value = $bindable(""), onchange }: Props = $props();
    let users = $state<null | string[]>(null);
    
    $effect(() => {
        (async () => {
            let res = await getAllUsers();
            if (res.error) {
                users = null;
            } else {
                if (res.data.status == 'Error') {
                    users = null;
                } else {
                    users = res.data.message;
                }
            }
        })();
    });
    
    function handleChange(e: Event) {
        const target = e.target as HTMLInputElement | HTMLSelectElement;
        value = target.value;
        onchange?.(value);
    }
</script>

{#if users != null}
    <select {value} onchange={handleChange}>
        {#each users as user}
            <option value={user}>
                {user}
            </option>
        {/each}
    </select>
{:else}
    <input {value} oninput={handleChange} placeholder="Enter username">
{/if}