<script lang="ts">
	import type { GraphDataF, DpdgMode } from "./ChudMasterGoonSoft";
	import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip } from "chart.js";
	import type { ChartConfiguration } from 'chart.js';

	Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip);

	let { data }: { data: GraphDataF } = $props();

	let dpdgMode = $state<DpdgMode>('raw');

	let canvasTotal: HTMLCanvasElement;
	let canvasAuto: HTMLCanvasElement;
	let canvasTeleop: HTMLCanvasElement;
	let canvasDefense: HTMLCanvasElement;
	let canvasDpdg: HTMLCanvasElement;

	$effect(() => {
		const snap = $state.snapshot(data);
		const charts = [
			new Chart(canvasTotal,   { type: 'line', data: snap.total }   as ChartConfiguration<'line'>),
			new Chart(canvasAuto,    { type: 'line', data: snap.auto }    as ChartConfiguration<'line'>),
			new Chart(canvasTeleop,  { type: 'line', data: snap.teleop }  as ChartConfiguration<'line'>),
			new Chart(canvasDefense, { type: 'line', data: snap.defense } as ChartConfiguration<'line'>),
		];
		return () => charts.forEach(c => c.destroy());
	});

	// Separate from the charts above so flipping the toggle only rebuilds the DPDG chart.
	$effect(() => {
		const snap = $state.snapshot(data);
		const chart = new Chart(canvasDpdg, {
			type: 'line',
			data: dpdgMode === 'raw' ? snap.dpdg_raw : snap.dpdg_pct
		} as ChartConfiguration<'line'>);
		return () => chart.destroy();
	});
</script>

<div>
	<h2>Total Score:</h2>
	<canvas bind:this={canvasTotal}></canvas>
	<h2>Auto Score:</h2>
	<canvas bind:this={canvasAuto}></canvas>
	<h2>Teleop Score:</h2>
	<canvas bind:this={canvasTeleop}></canvas>
	<h2>Defense Score:</h2>
	<canvas bind:this={canvasDefense}></canvas>
	<h2>DPDG ({dpdgMode === 'raw' ? 'points' : 'percent'}):</h2>
	<div class="option-grid">
		<button
			type="button"
			class="option-btn"
			class:selected={dpdgMode === 'raw'}
			onclick={() => (dpdgMode = 'raw')}
		>POINTS</button>
		<button
			type="button"
			class="option-btn"
			class:selected={dpdgMode === 'pct'}
			onclick={() => (dpdgMode = 'pct')}
		>PERCENT</button>
	</div>
	<canvas bind:this={canvasDpdg}></canvas>
</div>

<style>
	.option-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 8px;
		margin-bottom: 0.75rem;
	}

	.option-btn {
		padding: 0.75rem 0;
		min-height: 48px;
		border-radius: 8px;
		border: 1.5px solid rgba(255, 255, 255, 0.10);
		background: #1a1a1a;
		color: rgba(255, 255, 255, 0.55);
		font-family: inherit;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		cursor: pointer;
		touch-action: manipulation;
		transition: background 0.15s, border-color 0.15s, color 0.15s;
	}

	.option-btn:active {
		transform: scale(0.97);
	}

	.option-btn.selected {
		background: rgba(60, 179, 113, 0.18);
		border-color: #3cb371;
		color: #5dde8a;
	}
</style>
