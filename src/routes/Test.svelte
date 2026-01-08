<script lang="ts">
    import NiceErrorTextBox from "../lib/NiceErrorTextBox.svelte";
    let input = $state();
    let error = $state(null);

    $effect(() => {
        if (typeof input != "string") {
            return;
        }
        if (input.includes("a")) {
            error = "can't have a!";
        } else {
            error = null;
        }
    }) 
</script>

<main>
    <p>{input}</p>
    <NiceErrorTextBox bind:input={input} error={error} />
</main>