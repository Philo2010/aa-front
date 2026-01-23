<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import Input from "$lib/components/ui/input/input.svelte";
  import Label from "$lib/components/ui/label/label.svelte";
    import FormWithLoading from "$lib/FormWithLoading.svelte";
  
  import { login } from '$lib/schema/sdk.gen.ts';
  let username = $state("");
  let password = $state("");

  // Function passed to the child; must return Promise<string>
  async function handleLogin(): Promise<{message: string, worked: boolean}> {
     console.log("running dispatch");
     const res = await login({
      body: {
        username: username,
        password: password
      }
    });
    if (res.error) {
      //there is an error now (sad)
      return {
        message: String(res.response.status),
        worked: false
      };
    } else {
        if (res.data == undefined) {
            return {
                message: "No data from server",
                worked: false
            }
        }
      if ('Error' in res.data) {
        return {
          message: "Error returned by server: " + res.data.Error,
          worked: false, 
        };
      } else {
        return {
          message: res.data.Success, 
          worked: true
        };
      }
    }
  }
</script>

<Card.Root class="-my-4 w-full max-w-sm">
  <Card.Header>
    <Card.Title>Please log in</Card.Title>
  </Card.Header>
  <Card.Content>
    <FormWithLoading dispatch={handleLogin}>
      <div class="flex flex-col gap-6">
        <div class="grid gap-2">
          <Label for="email">Email</Label>
          <Input id="email" bind:value={username} required/>
        </div>
        <div class="grid gap-2">
          <Label for="password">Password</Label>
          <Input type="password" bind:value={password} required/>
        </div>
      </div>
    </FormWithLoading>
  </Card.Content>
  <Card.Footer>
    <Button type="submit" class="w-full">Login</Button>
  </Card.Footer>
</Card.Root>