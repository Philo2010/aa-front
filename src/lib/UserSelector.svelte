<script lang="ts">
	import { fetchUsers, getUsers, subscribe } from '../lib/store/users.svelte';

	interface Props {
		value: string;
		onchange?: (value: string) => void;
	}

	let { value = $bindable(''), onchange }: Props = $props();

	let users = $state(getUsers());
	let query = $state(value);
	let open = $state(false);

	$effect(() => {
		fetchUsers();
		return subscribe(() => {
			users = getUsers();
		});
	});

	$effect(() => {
		query = value;
	});

	let filteredUsers = $derived(
		users == null
			? null
			: users.filter((user) => user.toLowerCase().includes(query.trim().toLowerCase()))
	);

	function selectUser(user: string) {
		value = user;
		query = user;
		open = false;
		onchange?.(value);
	}

	function handleInput(e: Event) {
		query = (e.target as HTMLInputElement).value;
		open = true;
		if (users == null) {
			value = query;
			onchange?.(value);
		}
	}

	function handleFocus() {
		open = true;
	}

	function handleBlur() {
		// let a pending option click register before closing
		setTimeout(() => {
			open = false;
			query = value;
		}, 150);
	}
</script>

<div class="user-selector">
	<input
		value={query}
		oninput={handleInput}
		onfocus={handleFocus}
		onblur={handleBlur}
		placeholder="Enter username"
		autocomplete="off"
	/>
	{#if open && filteredUsers != null && filteredUsers.length > 0}
		<ul class="user-selector-options">
			{#each filteredUsers as user}
				<li>
					<button type="button" onmousedown={() => selectUser(user)}>
						{user}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.user-selector {
		position: relative;
	}

	.user-selector input {
		width: 100%;
		background: #111;
		border: 1.5px solid rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		color: #fff;
		font-family: inherit;
		font-size: 0.9rem;
		padding: 0.75rem;
		outline: none;
	}

	.user-selector input:focus {
		border-color: rgba(60, 179, 113, 0.5);
	}

	.user-selector input::placeholder {
		color: rgba(255, 255, 255, 0.2);
	}

	.user-selector-options {
		position: absolute;
		z-index: 20;
		top: calc(100% + 4px);
		left: 0;
		right: 0;
		max-height: 12rem;
		overflow-y: auto;
		margin: 0;
		padding: 0.25rem;
		list-style: none;
		background: #111;
		border: 1.5px solid rgba(255, 255, 255, 0.1);
		border-radius: 10px;
	}

	.user-selector-options button {
		width: 100%;
		text-align: left;
		background: none;
		border: none;
		border-radius: 6px;
		color: rgba(255, 255, 255, 0.75);
		font-family: inherit;
		font-size: 0.85rem;
		padding: 0.5rem 0.6rem;
		cursor: pointer;
	}

	.user-selector-options button:hover {
		background: rgba(60, 179, 113, 0.18);
		color: #5dde8a;
	}
</style>
