<script lang="ts">
	import FormWithLoading from '$lib/FormWithLoading.svelte';
	import { login } from '$lib/schema/sdk.gen';

	let username = $state('');
	let password = $state('');

	async function handleLogin(): Promise<{ message: string; worked: boolean }> {
		const res = await login({ body: { username, password } });
		if (res.error) return { message: String(res.response.status), worked: false };
		if ('Error' in res.data) return { message: res.data.Error, worked: false };
		return { message: res.data.Success, worked: true };
	}
</script>

<div class="shell">
	<div class="card">
		<h1>Sign in</h1>
		<p class="subtitle">abyss angel scouting</p>

		<FormWithLoading dispatch={handleLogin} submitLabel="Sign in">
			<div class="fields">
				<div class="field">
					<label for="username">Username</label>
					<input
						id="username"
						bind:value={username}
						placeholder="enter username"
						autocomplete="username"
						autocapitalize="none"
					/>
				</div>
				<div class="field">
					<label for="password">Password</label>
					<input
						id="password"
						type="password"
						bind:value={password}
						placeholder="••••••••"
						autocomplete="current-password"
					/>
				</div>
			</div>
		</FormWithLoading>
	</div>
</div>

<style>
	.shell {
		min-height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
	}

	.card {
		width: 100%;
		max-width: 360px;
		background: #191919;
		border: 1px solid rgba(255,255,255,0.07);
		border-radius: 14px;
		padding: 2.5rem 2rem 2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0;
		animation: rise 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	@keyframes rise {
		from { opacity: 0; transform: translateY(16px); }
		to   { opacity: 1; transform: translateY(0); }
	}

	/* ── Logo mark ──────────────────────── */
	.logo-mark {
		position: relative;
		width: 56px;
		height: 56px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 1.4rem;
	}

	.logo-ring {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		border: 2px solid rgba(60, 179, 113, 0.35);
		background: rgba(60, 179, 113, 0.08);
	}

	.logo-letter {
		font-size: 1.5rem;
		font-weight: 800;
		color: #3cb371;
		letter-spacing: -0.02em;
		position: relative;
	}

	/* ── Heading ────────────────────────── */
	h1 {
		font-size: 1.4rem;
		font-weight: 800;
		letter-spacing: 0.06em;
		color: #fff;
		margin: 0 0 0.3rem;
	}

	.subtitle {
		font-size: 0.65rem;
		letter-spacing: 0.14em;
		color: rgba(255,255,255,0.3);
		margin: 0 0 2rem;
	}

	/* ── Fields ─────────────────────────── */
	.fields {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		width: 100%;
		margin-bottom: 1.1rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	label {
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: rgba(255,255,255,0.35);
	}

	input {
		width: 100%;
		background: #111;
		border: 1.5px solid rgba(255,255,255,0.08);
		border-radius: 8px;
		color: #fff;
		font-family: inherit;
		font-size: 0.9rem;
		padding: 0.65rem 0.85rem;
		outline: none;
		box-sizing: border-box;
		transition: border-color 0.15s;
	}

	input:focus {
		border-color: rgba(60, 179, 113, 0.5);
	}

	input::placeholder {
		color: rgba(255,255,255,0.18);
	}

	/* ── Override FormWithLoading submit btn ── */
	:global(.card button[type="submit"]) {
		width: 100%;
		padding: 0.75rem;
		border-radius: 8px;
		border: 1.5px solid rgba(60,179,113,0.35);
		background: rgba(60,179,113,0.15);
		color: #5dde8a;
		font-family: inherit;
		font-size: 0.88rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		cursor: pointer;
		transition: background 0.15s;
	}

	:global(.card button[type="submit"]:hover:not(:disabled)) {
		background: rgba(60,179,113,0.25);
	}

	:global(.card button[type="submit"]:disabled) {
		opacity: 0.45;
		cursor: not-allowed;
	}
</style>
