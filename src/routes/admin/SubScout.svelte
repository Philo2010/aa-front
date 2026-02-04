<script lang="ts">
	import FormWithLoading from '../../lib/FormWithLoading.svelte';
	import { subScout } from '../../lib/schema/sdk.gen';
	import UserSelector from '../../lib/UserSelector.svelte';

	let og = $state<string>('');
	let replacement = $state<string>('');

	async function handleEvent(): Promise<{
		message: string;
		worked: boolean;
	}> {
		let res = await subScout({
			body: {
				og: og,
				replacement: replacement,
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
					message: String(res.data.message),
					worked: false,
				};
			} else {
				return {
					message: String(res.data.message),
					worked: true,
				};
			}
		}
	}
</script>

<h1>Sub Scout</h1>
<FormWithLoading dispatch={handleEvent}>
	<h2>Og</h2>
	<UserSelector bind:value={og} />
	<br />
	<h2>Replacement</h2>
	<UserSelector bind:value={replacement} />
	<br />
	<br />
</FormWithLoading>
