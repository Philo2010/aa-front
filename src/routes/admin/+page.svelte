<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { checkadmin } from '$lib/checkadminship';

	onMount(() => {
		if (!checkadmin()) {
			goto('/notallowed');
		}
	});
</script>

<div class="page">
	<header class="page-header">
		<div class="header-accent"></div>
		<h1>ADMIN</h1>
		<p class="subtitle">admin controls</p>
	</header>

	<div class="nav-grid">
		<a href="/admin/queue" class="nav-card">
			<span class="nav-label">QUEUE</span>
			<span class="nav-sub">manage match queue</span>
		</a>
		<a href="/admin/queueplayoff" class="nav-card">
			<span class="nav-label">QUEUE PLAYOFF</span>
			<span class="nav-sub">manage playoff queue</span>
		</a>
		<a href="/scout/assign" class="nav-card">
			<span class="nav-label">ASSIGN SCOUTER</span>
			<span class="nav-sub">assign scouts to matches</span>
		</a>
		<a href="/admin/leaderboard" class="nav-card">
			<span class="nav-label">LEADERBOARD</span>
			<span class="nav-sub">scouter rankings</span>
		</a>
		<a href="/admin/setevent" class="nav-card">
			<span class="nav-label">SET EVENT</span>
			<span class="nav-sub">configure active event</span>
		</a>
		<a href="/admin/subscout" class="nav-card">
			<span class="nav-label">SUB SCOUT</span>
			<span class="nav-sub">substitute a scouter</span>
		</a>
		<a href="/admin/create_user" class="nav-card">
			<span class="nav-label">CREATE USER</span>
			<span class="nav-sub">add new accounts</span>
		</a>
		<a href="/admin/passwordreset" class="nav-card ghost">
			<span class="nav-label">PASSWORD RESET</span>
			<span class="nav-sub">reset user passwords</span>
		</a>
		<a href="/admin/sendwarning" class="nav-card ghost">
			<span class="nav-label">SEND WARNING</span>
			<span class="nav-sub">notify scouters</span>
		</a>
		<a href="/admin/addmatch" class="nav-card">
			<span class="nav-label">ADD MATCH</span>
			<span class="nav-sub">manually insert a match</span>
		</a>
		<a href="/admin/deleteevent" class="nav-card danger">
			<span class="nav-label">DELETE EVENT</span>
			<span class="nav-sub">remove event queue and assignments</span>
		</a>
	</div>
</div>

