<nav class="page">
	<header class="page-header">
		<div class="header-accent"></div>
		<h1>ABYSS ANGEL</h1>
		<p class="subtitle">frc scouting for team 696</p>
	</header>

	<div class="nav-grid">
		<a href="/scout/select" class="nav-card primary">
			<span class="nav-label">SCOUT</span>
			<span class="nav-sub">view scouting assignments</span>
		</a>
		<a href="/pit" class="nav-card">
			<span class="nav-label">PIT</span>
			<span class="nav-sub">pit scouting</span>
		</a>
		<a href="/view" class="nav-card">
			<span class="nav-label">STATS</span>
			<span class="nav-sub">view & analyze data</span>
		</a>
		<a href="/admin" class="nav-card">
			<span class="nav-label">ADMIN</span>
			<span class="nav-sub">admin controls</span>
		</a>
		<a href="/login" class="nav-card ghost">
			<span class="nav-label">LOGIN</span>
			<span class="nav-sub">sign into your account</span>
		</a>
		<a href="/about" class="nav-card ghost">
			<span class="nav-label">ABOUT</span>
			<span class="nav-sub">about this app</span>
		</a>
	</div>
</nav>

<style>
	.page {
		max-width: 560px;
		margin: 0 auto;
		padding: 1.5rem 1rem 4rem;
		display: block;
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

	.nav-card.primary {
		background: rgba(60, 179, 113, 0.08);
		border-color: rgba(60, 179, 113, 0.25);
	}

	.nav-card.primary:hover {
		background: rgba(60, 179, 113, 0.14);
		border-color: rgba(60, 179, 113, 0.45);
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

	.nav-card.primary .nav-label {
		color: #5dde8a;
	}

	.nav-sub {
		font-size: 0.65rem;
		letter-spacing: 0.08em;
		color: rgba(255, 255, 255, 0.30);
	}
</style>
