<script lang="ts">
	import FormWithLoading from '../lib/FormWithLoading.svelte';
	import { login } from '../lib/schema/sdk.gen';
	let username = $state('');
	let password = $state('');

	// Function passed to the child; must return Promise<string>
	async function handleLogin(): Promise<{
		message: string;
		worked: boolean;
	}> {
		console.log('running dispatch');
		const res = await login({
			body: {
				username: username,
				password: password,
			},
		});
		if (res.error) {
			//there is an error now (sad)
			return {
				message: String(res.response.status),
				worked: false,
			};
		} else {
			if ('Error' in res.data) {
				return {
					message: 'Error returned by server: ' + res.data.Error,
					worked: false,
				};
			} else {
				return {
					message: res.data.Success,
					worked: true,
				};
			}
		}
	}
</script>

<main>
	<FormWithLoading dispatch={handleLogin} submitLabel="Login">
		<input bind:value={username} placeholder="Username" />
		<input type="password" bind:value={password} placeholder="Password" />
	</FormWithLoading>
</main>
