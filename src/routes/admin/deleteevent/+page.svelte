<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { checkadmin } from '$lib/checkadminship';
	import FormWithLoading from '$lib/FormWithLoading.svelte';
	import { deleteEvent } from '$lib/schema/sdk.gen';

	let event = $state('');
	let confirmed = $state(false);

	onMount(() => {
		if (!checkadmin()) {
			goto('/notallowed');
		}
	});

	async function handleDelete(): Promise<{ message: string; worked: boolean }> {
		if (!confirmed) {
			return { message: 'check the confirmation box first', worked: false };
		}
		const res = await deleteEvent({ body: { event } });
		if (res.error) {
			return { message: String(res.response.status), worked: false };
		}
		if (res.data.status === 'Error') {
			return { message: 'server error: ' + res.data.message, worked: false };
		}
		event = '';
		confirmed = false;
		return { message: res.data.message, worked: true };
	}
</script>

<div class="page">
	<header class="page-header">
		<div class="header-accent"></div>
		<h1>DELETE EVENT</h1>
		<p class="subtitle">remove all queue + assignment data for an event</p>
	</header>

	<div class="warn-box">
		<span class="warn-label">WARNING</span>
		<p>
			this removes all match queues, scouter assignments, and unsubmitted MVP slots for the event.
			submitted pit data, published game data, and MVP scouts with data are preserved.
		</p>
	</div>

	<FormWithLoading dispatch={handleDelete} submitLabel="DELETE EVENT">
		<div class="section">
			<label class="field-label" for="event-input">EVENT CODE</label>
			<input
				id="event-input"
				type="text"
				bind:value={event}
				placeholder="e.g. 2026oncmp"
				autocomplete="off"
			/>
		</div>

		<div class="section confirm-row">
			<label class="confirm-label">
				<input type="checkbox" bind:checked={confirmed} />
				<span>i understand this cannot be undone</span>
			</label>
		</div>
	</FormWithLoading>
</div>

<style>
	.page {
		max-width: 480px;
		margin: 0 auto;
		padding: 1.5rem 1rem 4rem;
	}

	.page-header {
		position: relative;
		padding-left: 1rem;
		margin-bottom: 2rem;
	}

	.header-accent {
		position: absolute;
		left: 0;
		top: 0.15em;
		bottom: 0.15em;
		width: 3px;
		background: #c0392b;
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

	.warn-box {
		background: rgba(192, 57, 43, 0.1);
		border: 1px solid rgba(192, 57, 43, 0.3);
		border-radius: 10px;
		padding: 0.9rem 1rem;
		margin-bottom: 1.5rem;
	}

	.warn-label {
		display: block;
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.18em;
		color: #e06060;
		margin-bottom: 0.4rem;
	}

	.warn-box p {
		margin: 0;
		font-size: 0.75rem;
		line-height: 1.6;
		color: rgba(255, 255, 255, 0.5);
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin-bottom: 1rem;
	}

	.field-label {
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.18em;
		color: rgba(255, 255, 255, 0.35);
	}

	input[type='text'] {
		background: #111;
		border: 1.5px solid rgba(255, 255, 255, 0.08);
		border-radius: 10px;
		color: #fff;
		font-family: inherit;
		font-size: 0.9rem;
		padding: 0.85rem 1rem;
		outline: none;
		transition: border-color 0.15s;
		width: 100%;
		box-sizing: border-box;
	}

	input[type='text']:focus {
		border-color: rgba(192, 57, 43, 0.5);
	}

	.confirm-row {
		margin-bottom: 0.5rem;
	}

	.confirm-label {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		cursor: pointer;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.45);
		letter-spacing: 0.05em;
	}

	input[type='checkbox'] {
		accent-color: #c0392b;
		width: 15px;
		height: 15px;
		cursor: pointer;
		flex-shrink: 0;
	}
</style>
