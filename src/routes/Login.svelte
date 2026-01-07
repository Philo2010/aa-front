<script lang="ts">
  import FormWithLoading from '../lib/FormWithLoading.svelte';
  import { loginRespondsSchema, loginRespondsErrorSchema } from '../lib/schema.zod';
  import { sendApiRefPost } from '../lib/ApiRequest.svelte';

  let username = "";
  let password = "";

  // Function passed to the child; must return Promise<string>
  async function handleLogin(): Promise<string> {
    try {
      const res = await sendApiRefPost(
        loginRespondsSchema,
        loginRespondsErrorSchema,
        { username, password },
        "/api/login"
      );

      switch (res.type) {
        case "success":
          return "Login successful!";
        case "validation_error":
          return res.error.issues.map(i => i.message).join(", ");
        case "network_error":
          return "Network error: " + res.error.message;
        case "api_error":
          return "Server error: " + res.error;
      }
    } catch {
      return "Unknown error occurred";
    }
  }
</script>

<main>
<FormWithLoading dispatch={handleLogin} submitLabel="Login">
  <input bind:value={username} placeholder="Username" />
  <input type="password" bind:value={password} placeholder="Password" />
</FormWithLoading>
</main>