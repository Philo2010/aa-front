<script>
	let { to, disabled = false, children } = $props();
</script>

{#if disabled}
	<button disabled>
		{@render children()}
	</button>
{:else}
	<a href={to}>
		<button>
			{@render children()}
		</button>
	</a>
{/if}

<style>
	button {
		padding: 0.6rem 1rem;
		border-radius: 6px;
		cursor: pointer;
	}
	button:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}
	a {
		text-decoration: none;
	}
</style>
