<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import FormWithLoading from '$lib/FormWithLoading.svelte';
	import { editPit } from '$lib/schema/sdk.gen';

	let width = $state<number>(0);
	let height = $state<number>(0);
	let team = $state<string>('');
	let insert_id: number;

	const params = $page.url.searchParams;
	if (params.has('id') && params.has('team')) {
		insert_id = Number(params.get('id'));
		team = params.get('team') ?? '';
		if (isNaN(insert_id)) {
			goto('/notallowed');
		}
	} else {
		goto('/notallowed');
	}

	async function handleInsert(): Promise<{
		message: string;
		worked: boolean;
	}> {
		let res = await editPit({
			body: {
				ExamplePit: {
					width: width,
					height: height,
				},
			},
			path: {
				id: insert_id,
			},
		});
		if (res.error) {
			return {
				message: String(res.response.status),
				worked: false,
			};
		} else {
			if ((res.data.status = 'Error')) {
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

<FormWithLoading dispatch={handleInsert}>
	<h1>Currently Editing data for team: {team}</h1>
	<h2>Width</h2>
	<input type="number" bind:value={width} />
	<h2>Height</h2>
	<input type="number" bind:value={height} />
</FormWithLoading>
