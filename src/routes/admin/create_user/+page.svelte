<script lang="ts">
	import FormWithLoading from '$lib/FormWithLoading.svelte';
	import { createUserFront } from '$lib/schema/sdk.gen';

	let username = $state<string>('');
	let password = $state<string>('');
	let is_admin = $state<boolean>(false);

	async function dispatch(): Promise<{ message: string; worked: boolean }> {
		const res = await createUserFront({
			body: {
				username,
				password,
				is_admin: String(is_admin),
			},
		});
		if (res.error) {
			return { message: 'HTTP ' + res.response.status, worked: false };
		}
		if (res.data.status === 'Error') {
			return { message: res.data.message, worked: false };
		}
		return { message: res.data.message, worked: true };
	}
</script>

<div class="shell">
	<header class="sticky-header">
		<span class="header-label">CREATE USER</span>
	</header>

	<div class="page">
		<FormWithLoading {dispatch} submitLabel="create user">
			<section class="section">
				<div class="section-label">USERNAME</div>
				<input
					type="text"
					bind:value={username}
					placeholder="username"
					autocomplete="off"
					autocorrect="off"
					autocapitalize="off"
					spellcheck="false"
					required
				/>
			</section>

			<section class="section">
				<div class="section-label">PASSWORD</div>
				<input
					type="password"
					bind:value={password}
					placeholder="password"
					autocomplete="new-password"
					required
				/>
			</section>

			<section class="section">
				<div class="section-label">ROLE</div>
				<button
					type="button"
					class="toggle-btn"
					class:on={is_admin}
					onclick={() => (is_admin = !is_admin)}
				>
					<div class="toggle-indicator"></div>
					<span>{is_admin ? 'admin' : 'scouter'}</span>
				</button>
			</section>
		</FormWithLoading>
	</div>
</div>

<style>
	.shell {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		background: #242424;
	}

	.sticky-header {
		display: flex;
		align-items: center;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.07);
		position: sticky;
		top: 0;
		background: #242424;
		z-index: 10;
	}

	.header-label {
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.18em;
		color: rgba(255, 255, 255, 0.5);
	}

	.page {
		max-width: 560px;
		width: 100%;
		margin: 0 auto;
		padding: 1.5rem 1rem 4rem;
	}

	.section {
		margin-bottom: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.section-label {
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.3);
	}

	input[type='text'],
	input[type='password'] {
		background: #111;
		border: 1.5px solid rgba(255, 255, 255, 0.08);
		border-radius: 10px;
		color: #fff;
		font-family: inherit;
		font-size: 0.95rem;
		padding: 0.85rem 1rem;
		outline: none;
		width: 100%;
		box-sizing: border-box;
	}

	input[type='text']:focus,
	input[type='password']:focus {
		border-color: rgba(60, 179, 113, 0.5);
	}

	input::placeholder {
		color: rgba(255, 255, 255, 0.2);
	}

	.toggle-btn {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.85rem 1rem;
		border-radius: 10px;
		border: 1.5px solid rgba(255, 255, 255, 0.08);
		background: #111;
		color: rgba(255, 255, 255, 0.45);
		font-family: inherit;
		font-size: 0.88rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		cursor: pointer;
		width: 100%;
		touch-action: manipulation;
		transition: border-color 0.15s, color 0.15s;
	}

	.toggle-btn.on {
		border-color: rgba(60, 179, 113, 0.4);
		color: #fff;
	}

	.toggle-indicator {
		width: 20px;
		height: 20px;
		border-radius: 4px;
		border: 2px solid rgba(255, 255, 255, 0.2);
		flex-shrink: 0;
		transition: background 0.15s, border-color 0.15s;
	}

	.toggle-btn.on .toggle-indicator {
		background: #3cb371;
		border-color: #3cb371;
	}

	/* ── FormWithLoading overrides ─────────────────────── */
	.page :global(button[type='submit']) {
		width: 100%;
		min-height: 52px;
		border-radius: 8px;
		font-family: inherit;
		font-size: 0.85rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		cursor: pointer;
		touch-action: manipulation;
		transition: background 0.15s;
		border: 1.5px solid rgba(60, 179, 113, 0.35);
		background: rgba(60, 179, 113, 0.12);
		color: #5dde8a;
		margin-top: 0.5rem;
	}

	.page :global(button[type='submit']:hover:not(:disabled)) {
		background: rgba(60, 179, 113, 0.22);
	}

	.page :global(button[type='submit']:active:not(:disabled)) {
		transform: scale(0.97);
	}

	.page :global(button[type='submit']:disabled) {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.page :global(.form-message) {
		font-size: 0.78rem;
		letter-spacing: 0.06em;
		border-radius: 8px;
		padding: 0.65rem 1rem;
		margin-top: 0.75rem;
	}

	.page :global(.form-message[style*='green']) {
		color: #5dde8a !important;
		background: rgba(60, 179, 113, 0.08);
		border: 1px solid rgba(60, 179, 113, 0.2);
	}

	.page :global(.form-message[style*='red']) {
		color: #e06060 !important;
		background: rgba(220, 60, 60, 0.08);
		border: 1px solid rgba(220, 60, 60, 0.2);
	}
</style>
