<script lang="ts">
  import FormWithLoading from '../lib/FormWithLoading.svelte';
  import { loginRespondsSchema, loginRespondsErrorSchema } from '../lib/schema.zod';
  import { sendApiRefPost } from '../lib/ApiRequest.svelte';

  let username = "";
  let password = "";

  // This function will be called by FormWithLoading when the form is submitted
  async function handleLogin(event: CustomEvent<{ setMessage: (msg: string) => void }>) {
    const { setMessage } = event.detail;

    try {
      const res = await sendApiRefPost(
        loginRespondsSchema,
        loginRespondsErrorSchema,
        { username, password },
        "/api/login"
      );

      switch (res.type) {
        case "success":
          setMessage("Login successful!");
          break;
        case "validation_error":
          setMessage(res.error.issues.map(i => i.message).join(", "));
          break;
        case "network_error":
          setMessage("Network error: " + res.error.message);
          break;
        case "api_error":
          setMessage("Server error: " + res.error);
          break;
      }
    } catch {
      setMessage("Unknown error occurred");
    }
  }
</script>

<FormWithLoading on:submit={handleLogin} submitLabel="Login">
  <input bind:value={username} placeholder="Username" />
  <input type="password" bind:value={password} placeholder="Password" />
</FormWithLoading>
