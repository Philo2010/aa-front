<script lang="ts">
    import { fetchUsers, getUsers, subscribe } from '../lib/store/users.svelte';

    interface Props {
        value: string;
        onchange?: (value: string) => void;
    }

    let { value = $bindable(""), onchange }: Props = $props();
    
    let users = $state(getUsers());

    $effect(() => {
        fetchUsers();
        return subscribe(() => {
            users = getUsers();
        });
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