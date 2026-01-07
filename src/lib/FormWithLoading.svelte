<script lang="ts">
  // The parent passes a function that returns a Promise<string>
  export let dispatch: () => Promise<string>;

  let loading = false;
  export let message: string | null = null;
  export let submitLabel: string = "Submit";

  async function handleSubmit(event: Event) {
    event.preventDefault();
    if (loading) return;

    loading = true;
    try {
      message = await dispatch();
    } catch (err) {
      message = "Unknown error occurred";
      console.error(err);
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
  <p class="form-message">{message}</p>
{/if}

<style>
  fieldset {
    border: none;
    padding: 0;
    margin: 0;
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .form-message {
    color: red;
    font-size: 0.9rem;
    margin-top: 0.5rem;
  }
</style>
