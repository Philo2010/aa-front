
import type { TournamentLevels, Stations, GamesFull, TeamAvg, ClimbState} from './schema/types.gen';
//parses differnt yearly types and "flattens them" for safe printing
import { format_team } from './ParseTeam.svelte';

export type RebuiltGameFlatten = {
    id: number;
	user: string;
    team: string;
	match_id: number;
	set: number;
	total_score: number;
	event_code: string;
	tournament_level: TournamentLevels;
	station: Stations;
	created_at: string;
	is_mvp: boolean;
    defence: number;
    comment: string;
    defence_main: boolean;
    fuel_shoot_teleop: number;
    fuel_pass_teleop: number;
    fuel_shoot_auto: number;
    fuel_pass_auto: number;
    climb_end: ClimbState;
    climb_auto: ClimbState;
    beach_on_bump: boolean;
};
export type RebuiltAvgFlatten = {
	team: string;
    total_score: number; 
    auto_score: number;
    teleop_score: number;
    defence_score: number;
    mvp_percent: number;
    defence_main_avg: number;
    fuel_shoot_teleop_avg: number;
    fuel_pass_teleop_avg: number;
    fuel_shoot_auto_avg: number;
    fuel_pass_auto_avg: number;
    level_1_avg: number;
    level_2_avg: number;
    level_3_avg: number;
    level_1_avg_auto: number;
    level_2_avg_auto: number;
    level_3_avg_auto: number;
    beach_on_bump: number;
};

export function FlattenData(data: GamesFull): RebuiltGameFlatten {
    const date = new Date(data.header.created_at);

    const formatted = date.toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short"
    });
    return {
        id: data.header.id,
        user: data.header.user,
        team: format_team(data.header.team, data.header.is_ab_team),
        match_id: data.header.match_id,
        set: data.header.set,
        total_score: data.header.total_score,
        event_code: data.header.event_code,
        tournament_level: data.header.tournament_level,
        station: data.header.station,
        created_at: formatted,
        is_mvp: data.header.is_mvp,
        defence: data.header.defence,
        comment: data.header.comment,
        defence_main: data.game.RebuiltGame.defence_main,
        fuel_shoot_teleop: data.game.RebuiltGame.fuel_shoot_teleop,
        fuel_pass_teleop: data.game.RebuiltGame.fuel_pass_teleop,
        fuel_shoot_auto: data.game.RebuiltGame.fuel_shoot_auto,
        fuel_pass_auto: data.game.RebuiltGame.fuel_pass_auto,
        climb_end: data.game.RebuiltGame.climb_end,
        climb_auto: data.game.RebuiltGame.climb_auto,
        beach_on_bump: data.game.RebuiltGame.beach_on_bump,
    };
}


export function FlattenDataAvg(data: TeamAvg): RebuiltAvgFlatten {
    let team_format = format_team(data.team, data.is_ab_team);

    return {
        team: team_format,
        total_score: data.total_score,
        auto_score: data.auto_score,
        teleop_score: data.teleop_score,
        defence_score: data.defence_score,
        mvp_percent: data.mvp_percent * 100,
        defence_main_avg: data.game.RebuiltGame.defence_main_avg,
        fuel_shoot_teleop_avg: data.game.RebuiltGame.fuel_shoot_teleop_avg,
        fuel_pass_teleop_avg: data.game.RebuiltGame.fuel_pass_teleop_avg,
        fuel_shoot_auto_avg: data.game.RebuiltGame.fuel_shoot_auto_avg,
        fuel_pass_auto_avg: data.game.RebuiltGame.fuel_pass_auto_avg,
        level_1_avg: data.game.RebuiltGame.level_1_avg,
        level_2_avg: data.game.RebuiltGame.level_2_avg,
        level_3_avg: data.game.RebuiltGame.level_3_avg,
        level_1_avg_auto: data.game.RebuiltGame.level_1_avg_auto,
        level_2_avg_auto: data.game.RebuiltGame.level_2_avg_auto,
        level_3_avg_auto: data.game.RebuiltGame.level_3_avg_auto,
        beach_on_bump: data.game.RebuiltGame.beach_on_bump
    };
}