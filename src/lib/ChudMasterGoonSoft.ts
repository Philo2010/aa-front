import { format_team } from "../lib/ParseTeam.svelte";
import { dpdgColor } from "./dpdg";
import type { GraphTeam } from "./schema/types.gen";
import type { ChartConfiguration, ChartDataset, ChartData } from 'chart.js';

// DPDG points are coloured by sign (green = positive/good, red = negative/bad)
// so the direction is readable at a glance, while the connecting line keeps the
// per-team colour so you can still tell which series a point belongs to.
const dpdgPointColor = (ctx: any): string => {
	const v = ctx?.parsed?.y ?? ctx?.raw;
	return dpdgColor(typeof v === 'number' ? v : null);
};

const dpdgPointStyle = {
	pointBackgroundColor: dpdgPointColor,
	pointBorderColor: dpdgPointColor,
	pointBorderWidth: 1.5,
	pointRadius: 3.5,
	pointHoverRadius: 5
};

export type GamesGraph = {
    time: string;
    total_score: number;
    auto_score: number;
    teleop_score: number;
    defence: number;
    dpdg_team: number | null;
    dpdg_team_raw: number | null;
    dpdg_alliance: number | null;
    dpdg_alliance_raw: number | null;
};

export type GraphDataF = {
    total: ChartData<'line'>;
    auto: ChartData<'line'>;
    teleop: ChartData<'line'>;
    defense: ChartData<'line'>;
    dpdg_raw: ChartData<'line'>;
    dpdg_pct: ChartData<'line'>;
};

export type DpdgMode = 'raw' | 'pct';

function generateColor(index: number): string {
    const hue = (index * 137.508) % 360;
    return `hsl(${hue}, 70%, 55%)`;
}

export function generateGraphData(teams: GraphTeam[]): GraphDataF {
    const labels = teams.length > 0 && teams[0].data.length > 0
        ? teams[0].data.map(item => item.time)
        : [];

    const datasetsTotal: ChartDataset<'line'>[] = teams.map((team, index) => ({
        label: `Team ${format_team(team.team.number, team.team.is_ab_team)} Total`,
        data: team.data.map(item => item.total_score),
        fill: false,
        borderColor: generateColor(index),
        tension: 0.1
    }));

    const datasetsAuto: ChartDataset<'line'>[] = teams.map((team, index) => ({
        label: `Team ${format_team(team.team.number, team.team.is_ab_team)} Auto`,
        data: team.data.map(item => item.auto_score),
        fill: false,
        borderColor: generateColor(index),
        tension: 0.1
    }));

    const datasetsTeleop: ChartDataset<'line'>[] = teams.map((team, index) => ({
        label: `Team ${format_team(team.team.number, team.team.is_ab_team)} Teleop`,
        data: team.data.map(item => item.teleop_score),
        fill: false,
        borderColor: generateColor(index),
        tension: 0.1
    }));

    const datasetsDefense: ChartDataset<'line'>[] = teams.map((team, index) => ({
        label: `Team ${format_team(team.team.number, team.team.is_ab_team)} Defense`,
        data: team.data.map(item => item.defence),
        fill: false,
        borderColor: generateColor(index),
        tension: 0.1
    }));

    // DPDG is split by defence target: a game only ever populates the team side
    // (targeted a single bot) or the alliance side (defended the whole alliance).
    // Plot both so neither is hidden; missing points stay null.
    const datasetsDpdgRaw: ChartDataset<'line'>[] = teams.flatMap((team, index) => {
        const color = generateColor(index);
        const label = `Team ${format_team(team.team.number, team.team.is_ab_team)}`;
        return [
            {
                label: `${label} DPDG Team Pts`,
                data: team.data.map(item => item.dpdg_team_raw ?? null),
                fill: false,
                borderColor: color,
                tension: 0.1,
                ...dpdgPointStyle
            },
            {
                label: `${label} DPDG Alliance Pts`,
                data: team.data.map(item => item.dpdg_alliance_raw ?? null),
                fill: false,
                borderColor: color,
                borderDash: [6, 4],
                tension: 0.1,
                ...dpdgPointStyle
            }
        ];
    });

    const datasetsDpdgPct: ChartDataset<'line'>[] = teams.flatMap((team, index) => {
        const color = generateColor(index);
        const label = `Team ${format_team(team.team.number, team.team.is_ab_team)}`;
        return [
            {
                label: `${label} DPDG Team %`,
                data: team.data.map(item => item.dpdg_team ?? null),
                fill: false,
                borderColor: color,
                tension: 0.1,
                ...dpdgPointStyle
            },
            {
                label: `${label} DPDG Alliance %`,
                data: team.data.map(item => item.dpdg_alliance ?? null),
                fill: false,
                borderColor: color,
                borderDash: [6, 4],
                tension: 0.1,
                ...dpdgPointStyle
            }
        ];
    });

    return {
        total: { labels, datasets: datasetsTotal },
        auto: { labels, datasets: datasetsAuto },
        teleop: { labels, datasets: datasetsTeleop },
        defense: { labels, datasets: datasetsDefense },
        dpdg_raw: { labels, datasets: datasetsDpdgRaw },
        dpdg_pct: { labels, datasets: datasetsDpdgPct }
    };
}
