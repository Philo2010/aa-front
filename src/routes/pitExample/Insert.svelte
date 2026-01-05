<script>
    import { useApiForm } from "../../lib/useApiForm";


  let payload = {
    team: '',
    is_am_team: false,
    event_code: '',
    pit: {
      width: '',
      height: ''
    }
  };

const { submit, loading, result, error } = useApiForm({
    endpoint: '/api/login'
  });

  function handleSubmit() {
    // Convert numbers if needed
    const submission = {
      ...payload,
      team: Number(payload.team),
      pit: {
        width: Number(payload.pit.width),
        height: Number(payload.pit.height)
      }
    };

    console.log(submission);
    // call API here
  }
</script>
<main>
<form on:submit|preventDefault={handleSubmit}>
  <input bind:value={payload.team} />
  <input bind:value={payload.is_am_team} />

  <button disabled={$loading}>
    {$loading ? 'Sending…' : 'Submit'}
  </button>
</form>
</main>

<button on:click={handleSubmit}>Submit</button>
