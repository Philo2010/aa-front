import { format_team, type TeamData } from "../lib/ParseTeam.svelte";
import type { GraphTeam } from "./schema/types.gen";
import type { ChartConfiguration, ChartDataset, ChartData } from 'chart.js';

export type GamesGraph = {
    time: string;
    total_score: number;
    auto_score: number;
    teleop_score: number;
    defence: number;
};

export type GraphDataF = {
    total: ChartData<'line'>;
    auto: ChartData<'line'>;
    teleop: ChartData<'line'>;
    defense: ChartData<'line'>;
};

function generateColor(index: number): string {
    const hue = (index * 137.508) % 360;
    return `hsl(${hue}, 70%, 55%)`;
}

export function generateGraphData(teams: GraphTeam[]): GraphDataF {
    const labels = teams.length > 0 && teams[0].data.length > 0
        ? teams[0].data.map(item => item.time)
        : [];

    const datasetsTotal: ChartDataset<'line'>[] = teams.map((team, index) => ({
        label: `Team ${format_team(team.team.team, team.team.is_ab_team)} Total`,
        data: team.data.map(item => item.total_score),
        fill: false,
        borderColor: generateColor(index),
        tension: 0.1
    }));

    const datasetsAuto: ChartDataset<'line'>[] = teams.map((team, index) => ({
        label: `Team ${format_team(team.team.team, team.team.is_ab_team)} Auto`,
        data: team.data.map(item => item.auto_score),
        fill: false,
        borderColor: generateColor(index),
        tension: 0.1
    }));

    const datasetsTeleop: ChartDataset<'line'>[] = teams.map((team, index) => ({
        label: `Team ${format_team(team.team.team, team.team.is_ab_team)} Teleop`,
        data: team.data.map(item => item.teleop_score),
        fill: false,
        borderColor: generateColor(index),
        tension: 0.1
    }));

    const datasetsDefense: ChartDataset<'line'>[] = teams.map((team, index) => ({
        label: `Team ${format_team(team.team.team, team.team.is_ab_team)} Defense`,
        data: team.data.map(item => item.defence),
        fill: false,
        borderColor: generateColor(index),
        tension: 0.1
    }));

    return {
        total: { labels, datasets: datasetsTotal },
        auto: { labels, datasets: datasetsAuto },
        teleop: { labels, datasets: datasetsTeleop },
        defense: { labels, datasets: datasetsDefense }
    };
}
