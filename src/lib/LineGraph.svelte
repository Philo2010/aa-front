<script lang="ts">
	import type { GraphDataF } from "./ChudMasterGoonSoft";
	import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip } from "chart.js";
	import type { ChartConfiguration } from 'chart.js';

	Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip);

	let { data }: { data: GraphDataF } = $props();

	let canvasTotal: HTMLCanvasElement;
	let canvasAuto: HTMLCanvasElement;
	let canvasTeleop: HTMLCanvasElement;
	let canvasDefense: HTMLCanvasElement;

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
</div>

