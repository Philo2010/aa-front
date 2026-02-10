import { format_team, type TeamData } from "../lib/ParseTeam.svelte";
import type { GraphTeam } from "./schema/types.gen";


export type GamesGraph = {
    time: string;
    total_score: number;
    auto_score: number;
    teleop_score: number;
    defence: number;
};

export type ChartDataset = {
    label: string;
    data: number[];
    fill: boolean;
    borderColor: string;
    tension: number;
};

export type ChartData = {
    labels: string[];
    datasets: ChartDataset[];
};

export type GraphDataF = {
    total: ChartData;
    auto: ChartData;
    teleop: ChartData;
    defense: ChartData;
};

function generateColor(index: number): string {
    const hue = (index * 137.508) % 360;
    return `hsl(${hue}, 70%, 55%)`;
}

export function generateGraphData(teams: GraphTeam[]): GraphDataF {
    // Use timestamps from the first team for labels
    const labels = teams.length > 0 && teams[0].data.length > 0
        ? teams[0].data.map(item => item.time)
        : [];

    // Generate datasets for each metric
    const datasetsTotal: ChartDataset[] = teams.map((team, index) => ({
        label: `Team ${format_team(team.team.team, team.team.is_ab_team)} Total`,
        data: team.data.map(item => item.total_score),
        fill: false,
        borderColor: generateColor(index),
        tension: 0.1
    }));

    const datasetsAuto: ChartDataset[] = teams.map((team, index) => ({
        label: `Team ${format_team(team.team.team, team.team.is_ab_team)} Auto`,
        data: team.data.map(item => item.auto_score),
        fill: false,
        borderColor: generateColor(index),
        tension: 0.1
    }));

    const datasetsTeleop: ChartDataset[] = teams.map((team, index) => ({
        label: `Team ${format_team(team.team.team, team.team.is_ab_team)} Teleop`,
        data: team.data.map(item => item.teleop_score),
        fill: false,
        borderColor: generateColor(index),
        tension: 0.1
    }));

    const datasetsDefense: ChartDataset[] = teams.map((team, index) => ({
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