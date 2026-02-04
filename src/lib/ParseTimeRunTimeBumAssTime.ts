
import type { TournamentLevels, Stations, GamesFull} from './schema/types.gen';
//parses differnt yearly types and "flattens them" for safe printing
import { format_team } from './ParseTeam.svelte';

export type ExampleGameFlatten = {
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
	hehe: number;
	beep: number;
	hoohoo: string;
};

export function FlattenData(data: GamesFull): ExampleGameFlatten {
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
        hehe: data.game.ExampleGame.hehe,
        beep: data.game.ExampleGame.beep,
        hoohoo: data.game.ExampleGame.hoohoo
    };
}
