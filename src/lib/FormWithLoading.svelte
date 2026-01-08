<script lang="ts">

  let loading = $state(false);
  let { children, message = null, submitLabel = "Submit", stop = $bindable(), dispatch} = $props();

  async function handleSubmit(event: Event) {
    event.preventDefault();
    if (loading) return;

    loading = true;
    console.log("about to run dispatch!");
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

<form onsubmit={handleSubmit}>
  <fieldset disabled={loading}>
    {@render children()}
    <button type="submit" disabled={loading || stop}>
      {#if loading}
        Sending…
      {:else if stop}
        N/A
      {:else}
       {submitLabel}
       {/if}
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
