<script lang="ts">
	import type { Game } from '$lib/schema/types.gen';

	let {
		min = 1,
		max = 10,
		beginValue = $bindable(1),
		endValue = $bindable(10),
		games = [] as Game[],
	}: {
		min?: number;
		max?: number;
		beginValue: number;
		endValue: number;
		games?: Game[];
	} = $props();

	let trackEl = $state<HTMLDivElement | null>(null);
	let dragging = $state<'begin' | 'end' | null>(null);
	let hovering = $state<'begin' | 'end' | null>(null);

	let tooltipTarget = $derived(dragging ?? hovering);
	let tooltipValue = $derived(tooltipTarget === 'begin' ? beginValue : tooltipTarget === 'end' ? endValue : null);
	let tooltipGame = $derived(tooltipValue !== null && games.length > 0 ? games[tooltipValue - 1] ?? null : null);

	function pctFor(val: number): number {
		if (max === min) return 0;
		return ((val - min) / (max - min)) * 100;
	}

	function valFromX(clientX: number): number {
		if (!trackEl) return min;
		const rect = trackEl.getBoundingClientRect();
		const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
		return Math.round(min + pct * (max - min));
	}

	function onPointerDown(thumb: 'begin' | 'end') {
		return (e: PointerEvent) => {
			dragging = thumb;
			(e.target as HTMLElement).setPointerCapture(e.pointerId);
		};
	}

	function onPointerMove(e: PointerEvent) {
		if (!dragging) return;
		const v = valFromX(e.clientX);
		if (dragging === 'begin') {
			beginValue = Math.min(v, endValue);
		} else {
			endValue = Math.max(v, beginValue);
		}
	}

	function onPointerUp() {
		dragging = null;
	}
</script>

<div class="dual-range" role="group">
	<div
		class="track"
		bind:this={trackEl}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
	>
		<div
			class="fill"
			style="left: {pctFor(beginValue)}%; right: {100 - pctFor(endValue)}%;"
		></div>

		<!-- begin thumb -->
		<div
			class="thumb"
			style="left: {pctFor(beginValue)}%;"
			role="slider"
			tabindex="0"
			aria-valuenow={beginValue}
			aria-valuemin={min}
			aria-valuemax={endValue}
			aria-label="Range start"
			onpointerdown={onPointerDown('begin')}
			onpointerenter={() => hovering = 'begin'}
			onpointerleave={() => { if (!dragging) hovering = null; }}
		>
			{#if tooltipTarget === 'begin' && tooltipGame}
				<div class="tooltip">
					<strong>Game {tooltipGame.match_id}</strong>
					<span class="tooltip-detail">Set {tooltipGame.set}</span>
					<span class="tooltip-detail">{tooltipGame.tournament_level}</span>
					<span class="tooltip-detail">{tooltipGame.event_code}</span>
				</div>
			{/if}
		</div>

		<!-- end thumb -->
		<div
			class="thumb"
			style="left: {pctFor(endValue)}%;"
			role="slider"
			tabindex="0"
			aria-valuenow={endValue}
			aria-valuemin={beginValue}
			aria-valuemax={max}
			aria-label="Range end"
			onpointerdown={onPointerDown('end')}
			onpointerenter={() => hovering = 'end'}
			onpointerleave={() => { if (!dragging) hovering = null; }}
		>
			{#if tooltipTarget === 'end' && tooltipGame}
				<div class="tooltip">
					<strong>Game {tooltipGame.match_id}</strong>
					<span class="tooltip-detail">Set {tooltipGame.set}</span>
					<span class="tooltip-detail">{tooltipGame.tournament_level}</span>
					<span class="tooltip-detail">{tooltipGame.event_code}</span>
				</div>
			{/if}
		</div>
	</div>

	<div class="labels">
		<span>{beginValue}</span>
		<span>{endValue}</span>
	</div>
</div>

<style>
	.dual-range {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 140px;
		flex: 1;
	}

	.track {
		position: relative;
		height: 6px;
		background: rgba(255, 255, 255, 0.15);
		border-radius: 3px;
		margin: 10px 0;
		touch-action: none;
	}

	.fill {
		position: absolute;
		top: 0;
		bottom: 0;
		background: #4fc3f7;
		border-radius: 3px;
	}

	.thumb {
		position: absolute;
		top: 50%;
		width: 18px;
		height: 18px;
		background: #fff;
		border: 2px solid #4fc3f7;
		border-radius: 50%;
		transform: translate(-50%, -50%);
		cursor: grab;
		touch-action: none;
		z-index: 2;
	}

	.thumb:active {
		cursor: grabbing;
		background: #4fc3f7;
	}

	.tooltip {
		position: absolute;
		bottom: calc(100% + 10px);
		left: 50%;
		transform: translateX(-50%);
		background: #1a1a2e;
		border: 1px solid #4fc3f7;
		border-radius: 6px;
		padding: 6px 10px;
		white-space: nowrap;
		pointer-events: none;
		z-index: 10;
		display: flex;
		flex-direction: column;
		gap: 2px;
		font-size: 0.8em;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
	}

	.tooltip::after {
		content: '';
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		border: 5px solid transparent;
		border-top-color: #4fc3f7;
	}

	.tooltip-detail {
		color: rgba(255, 255, 255, 0.7);
		font-size: 0.9em;
	}

	.labels {
		display: flex;
		justify-content: space-between;
		font-size: 0.75em;
		color: rgba(255, 255, 255, 0.6);
	}
</style>
