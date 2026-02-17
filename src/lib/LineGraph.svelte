<script lang="ts">
	import { onMount } from "svelte";

    let total_chart_id: string = "TotalChart";
    let auto_chart_id: string = "AutoChart";
    let teleop_chart_id: string = "TeleopChart";
    let defense_chart_id: string = "DefenseChart";


	import type { GraphDataF } from "./ChudMasterGoonSoft";
	import { Chart } from "chart.js";

    let { data }: { data: GraphDataF } = $props();

    import type { ChartConfiguration } from 'chart.js';

    onMount(() => {
        const ctx_total = document.getElementById(total_chart_id) as HTMLCanvasElement | null;
        const ctx_auto = document.getElementById(auto_chart_id) as HTMLCanvasElement | null;
        const ctx_teleop = document.getElementById(teleop_chart_id) as HTMLCanvasElement | null;
        const ctx_defense = document.getElementById(defense_chart_id) as HTMLCanvasElement | null;

        if (!ctx_total || !ctx_auto) return;

        const totalConfig: ChartConfiguration<'line'> = {
            type: 'line',
            data: data.total
        };

        const autoConfig: ChartConfiguration<'line'> = {
            type: 'line',
            data: data.auto
        };

        const teleopConfig: ChartConfiguration<'line'> = {
            type: 'line',
            data: data.teleop
        };

        const defenseConfig: ChartConfiguration<'line'> = {
            type: 'line',
            data: data.defense
        };

        new Chart(ctx_total, totalConfig);
        new Chart(ctx_auto, autoConfig);
        new Chart(ctx_teleop, teleopConfig);
        new Chart(ctx_defense, defenseConfig);
    });

</script>

<div>
    <h2>Total Score:</h2>
    <canvas id="{total_chart_id}"></canvas>
    <h2>Auto Score:</h2>
    <canvas id="{auto_chart_id}"></canvas>
    <h2>Teleop Score:</h2>
    <canvas id="{teleop_chart_id}"></canvas>
    <h2>Defense Score:</h2>
    <canvas id="{defense_chart_id}"></canvas>
</div>

