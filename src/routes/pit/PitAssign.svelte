<h1>NOT UPDATED, IF YOU SEE THIS PLEASE DO NOT REMOVE</h1>

<script lang="ts">
    import { pitGetAll } from '../../lib/schema/sdk.gen';
    import type { PitAssigment, PitEvent } from '../../lib/schema/types.gen';
    import { format_team } from '../../lib/ParseTeam.svelte'
    import LinkButton from '../../lib/LinkButton.svelte';
    import UserSelector from '../../lib/UserSelector.svelte';
    import FormWithLoading from '../../lib/FormWithLoading.svelte';
    import type { AssignPitData } from '../../lib/schema/types.gen';
    import { assignPit } from '../../lib/schema/sdk.gen';
    import { da, fa } from 'zod/locales';
    let games = $state<string | Array<PitEvent>>("loading");
    let stop = $state<boolean>(true);

    //key is the id and string is the username
    let players: Map<number, string> = $state( new Map<number, string>());

    function format_data(player_data: Map<number, string>): {players: Array<string>, games: PitAssigment[]} {
        let games_by_id: Array<PitAssigment> = new Array<PitAssigment>;
        let player_by_id: Array<string> = new Array<string>;
        player_data.forEach((value, key) => {
            let player_index: number;
            let find_index: number = player_by_id.findIndex(v => v === value);
            if (find_index != -1) {
                player_index = find_index
            } else {
                let new_index = player_by_id.push(value) - 1;
                player_index = new_index;
            }
            games_by_id.push({
                index: player_index,
                upcomingid: key
            });
        })
        return {
            players: player_by_id,
            games: games_by_id
        };
    }

    //seting stop
    $effect(() => {
        if (games.length == players.size) {
            stop = false;
        }
    });

    $effect(() => {
    (async () => {
        let res = await pitGetAll();
        if (res.error) {
            games = "Error code: " + res.response.status;
        } else if (res.data.status === 'Error') {
            games = "Error from server: " + res.data.message;
        } else {
            games = res.data.message;
        }
    })();
    });

    


    async function handleInsert(): Promise<{ message: string; worked: boolean; }> {
        let data = format_data(players);
        let res = await assignPit({
            body: {
                scouts: data.players,
                asignment: data.games
            }
        });
        if (res.error) {
            return {
                worked: false,
                message: String(res.response.status),
            };
        } else {
            if (res.data.status === 'Error') {
                return {
                    worked: false,
                    message: "Error from server: " + String(res.data.message)
                }
            } else {
                return {
                    worked: true,
                    message: String(res.data.message)
                }
            }
        }
    }
</script>

{#if typeof(games) === "string"}
<p>{games}</p>
{:else}
    <FormWithLoading dispatch={handleInsert} bind:stop={stop}>
        {#each games as game}
        <div class="pit-game-box">
            <p>Team: {format_team(game.team, game.is_ab_team)}</p>
            <p>Event Code: {game.event_code}</p>
            <UserSelector value={players.get(game.id) ?? ""}
                onchange={(v) => {
                    players.set(game.id, v);
                    players = new Map(players);
                }}>
            </UserSelector> 
        </div>  
        {/each}
    </FormWithLoading>
{/if}

<style>
    .pit-game-box {
        background-color: #3cb371;
        padding: 10px;
        border-radius: 10px;
        margin: 10px;
    }
</style>