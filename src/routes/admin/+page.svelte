<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import LinkButton from '$lib/LinkButton.svelte';
	import { checkadmin } from '$lib/checkadminship';

	onMount(() => {
		if (!checkadmin()) {
			goto('/notallowed');
		}
	});
</script>

<main>
	<LinkButton to="/admin/leaderboard">Leaderboard</LinkButton>
	<LinkButton to="/admin/passwordreset">Password Reset</LinkButton>
	<LinkButton to="/admin/sendwarning">Send Warning</LinkButton>
	<LinkButton to="/admin/setevent">Set Event</LinkButton>
	<LinkButton to="/admin/subscout">Sub Scout</LinkButton>
	<LinkButton to="/admin/queue">Queue</LinkButton>
	<LinkButton to="/admin/queueplayoff">Queue Playoff</LinkButton>
	<LinkButton to="/admin/create_user">Create User</LinkButton>
	<LinkButton to="/scout/assign">Assign Scouter</LinkButton>
</main>
