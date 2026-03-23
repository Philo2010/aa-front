<script lang="ts">
	import { goto } from '$app/navigation';
	import FormWithLoading from '$lib/FormWithLoading.svelte';
	import { queue } from '$lib/schema/sdk.gen';
	import { checkadmin } from '$lib/checkadminship';
	let event_code = $state('');
	if (!checkadmin()) {
		goto('/notallowed');
	}

	async function handleLogin(): Promise<{
		message: string;
		worked: boolean;
	}> {
		let res = await queue({
			body: {
				event: event_code,
			},
		});
		if (res.error) {
			return {
				message: String(res.response.status),
				worked: false,
			};
		} else {
			if (res.data.status == 'Error') {
				return {
					message: 'Error returned by server: ' + res.data.message,
					worked: false,
				};
			} else {
				return {
					message: res.data.message,
					worked: true,
				};
			}
		}
	}
</script>

<main>
	<h1>Queue</h1>
	<FormWithLoading dispatch={handleLogin} submitLabel="Queue">
		<input bind:value={event_code} placeholder="Event Code" />
	</FormWithLoading>
</main>
