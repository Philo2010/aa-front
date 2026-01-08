<script lang="ts">
    let { input = $bindable(), error, placeholder = "input", type = "text"} = $props();

</script>

<div class="link-block">
    <input class="errorable-box" bind:value={input} {type} {placeholder}>
    {#if error != null}
    <span class="errorable-text">{error}</span>
    {/if}
</div>


<style>
    .errorable-box {
        background-color: gray;
        border-radius: 10px;
        border: 1px solid #2d9fd9;
        color: #a0d18c;
        width: 250px;
        height: 30px;
        padding-left: 10px;
    }
    .errorable-text {
        color: red;
    }
    .link-block input,
    .link-block span {
        display: block;
    }
</style>