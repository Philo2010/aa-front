<script lang="ts">
	import { checkadmin } from '$lib/checkadminship';
	let is_admin = $state<boolean>(false);

	if (checkadmin()) {
		is_admin = true;
	}
</script>

<div class="page">
	<header class="page-header">
		<div class="header-accent"></div>
		<h1>PIT</h1>
		<p class="subtitle">pit scouting</p>
	</header>

	<div class="nav-grid">
		<a href="/pit/select" class="nav-card primary">
			<span class="nav-label">SELECT</span>
			<span class="nav-sub">choose a team to scout</span>
		</a>
		{#if is_admin}
		<a href="/pit/assign" class="nav-card">
			<span class="nav-label">ASSIGN</span>
			<span class="nav-sub">assign pit scouters — admin only</span>
		</a>
		{/if}
	</div>
</div>

