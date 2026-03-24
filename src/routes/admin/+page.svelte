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
	</div>
</div>

<style>
	.page {
		max-width: 560px;
		margin: 0 auto;
		padding: 1.5rem 1rem 4rem;
	}

	.page-header {
		position: relative;
		padding-left: 1rem;
		margin-bottom: 2.5rem;
	}

	.header-accent {
		position: absolute;
		left: 0;
		top: 0.15em;
		bottom: 0.15em;
		width: 3px;
		background: #3cb371;
	}

	h1 {
		font-size: 1.75rem;
		font-weight: 700;
		letter-spacing: 0.18em;
		margin: 0;
		color: #fff;
	}

	.subtitle {
		margin: 0.2rem 0 0;
		font-size: 0.72rem;
		letter-spacing: 0.12em;
		color: rgba(255, 255, 255, 0.35);
		text-transform: lowercase;
	}

	.nav-grid {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.nav-card {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 1rem 1.1rem;
		background: #191919;
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 10px;
		text-decoration: none;
		min-height: 64px;
		justify-content: center;
		transition: background 0.15s, border-color 0.15s;
	}

	.nav-card:hover {
		background: #1e1e1e;
		border-color: rgba(60, 179, 113, 0.35);
	}

	.nav-card.ghost {
		background: transparent;
		border-color: rgba(255, 255, 255, 0.05);
	}

	.nav-label {
		font-size: 0.85rem;
		font-weight: 700;
		letter-spacing: 0.16em;
		color: #fff;
	}

	.nav-sub {
		font-size: 0.65rem;
		letter-spacing: 0.08em;
		color: rgba(255, 255, 255, 0.30);
	}
</style>
