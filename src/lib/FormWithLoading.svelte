<script lang="ts">
    import type { Snippet } from "svelte";
    import * as Card from "$lib/components/ui/card/index.js";


  let loading = $state(false);
  let message = $state(null);
  let is_error = $state(true);
  let { 
    children, 
    submitLabel = "Submit", 
    stop = $bindable(), 
    dispatch 
  }: {
    children: Snippet;
    submitLabel?: string;
    stop?: boolean;
    dispatch: () => Promise<{ message: string; worked: boolean }>;
  } = $props();

  async function handleSubmit(event: Event) {
    event.preventDefault();
    if (loading) return;

    loading = true;
    try {
      let message_data = await dispatch();
      message = message_data.message;
      is_error = !message_data.worked;
    } catch (err) {
      message = "Unknown error occurred";
      is_error = true;
      console.error(err);
    } finally {
      loading = false;
    }
  }
</script>


<form onsubmit={handleSubmit}>
  <fieldset disabled={loading}>
    {@render children()}
  </fieldset>
</form>

{#if message}
  <p class="form-message"
    style:color={is_error ? "red" : "green"}>{message}</p>
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
    font-size: 0.9rem;
    margin-top: 0.5rem;
  }
</style>
