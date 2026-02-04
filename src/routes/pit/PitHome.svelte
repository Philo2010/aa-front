<script lang="ts">
	import { boolean } from 'zod';
	import { checkadmin } from '../../lib/checkadminship';
	import LinkButton from '../../lib/LinkButton.svelte';
	let is_admin = $state<boolean>(false);

	if (checkadmin()) {
		is_admin = true;
	}
</script>

<LinkButton to="#/pit/select">Select</LinkButton>
{#if is_admin}
	<LinkButton to="#/pit/assign">Assign (Admin Only)</LinkButton>
{/if}
