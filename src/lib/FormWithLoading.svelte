<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{ submit: { setMessage: (msg: string) => void } }>();

  let loading = false;
  export let message: string | null = null;
  export let submitLabel: string = "Submit";

  async function handleSubmit(event: Event) {
    event.preventDefault();
    if (loading) return;

    loading = true;
    try {
      dispatch("submit", { setMessage: (m: string) => (message = m) });
    } catch {
      message = "Unknown error occurred";
    } finally {
      loading = false;
    }
  }
</script>

<form on:submit={handleSubmit}>
  <fieldset disabled={loading}>
    <slot />
    <button type="submit" disabled={loading}>
      {loading ? "Sending…" : submitLabel}
    </button>
  </fieldset>
</form>

{#if message}
  <p>{message}</p>
{/if}
