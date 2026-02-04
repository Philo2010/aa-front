<script lang="ts">
	import FormWithLoading from '../../lib/FormWithLoading.svelte';
	import { queue } from '../../lib/schema/sdk.gen';
	let event_code = $state('');
	import { checkadmin } from '../../lib/checkadminship';
	if (!checkadmin()) {
		window.location.replace('/#/notallowed');
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
			//there is an error now (sad)
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
