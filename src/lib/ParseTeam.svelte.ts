
export type TeamData = {
    team_number: number,
    is_ab_team: boolean
}

function parse_team(team_string: string): TeamData | string {
    let team_number: number;
    
    if (team_string.endsWith('B') || team_string.endsWith('b')) {
        //is a b team
        let string_team = team_string.slice(0, -1);
        team_number = parseInt(string_team);
        if (isNaN(team_number)) {
            return "Please input a vaild team!";
        }
        let data = {
            team_number: team_number,
            is_ab_team: true
        }
        return data;
    } else {
        team_number = parseInt(team_string);
        if (isNaN(team_number)) {
            return "Please input a vaild team!";
        }
        return {
            team_number: team_number,
            is_ab_team: false
        }
    }
}