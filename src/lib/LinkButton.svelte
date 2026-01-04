<script>
  import { push } from 'svelte-spa-router';

  export let to;
  export let replace = false;
  export let disabled = false;

  function navigate() {
    if (disabled) return;

    if (replace) {
      history.replaceState({}, '', to);
      push(to);
    } else {
      push(to);
    }
  }
</script>

<button on:click={navigate} disabled={disabled}>
  <slot />
</button>

<style>
  button {
    padding: 0.6rem 1rem;
    border-radius: 6px;
    cursor: pointer;
  }
</style>
