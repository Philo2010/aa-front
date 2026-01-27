<script lang="ts">
    import { onMount } from "svelte";
    import { mvpInsert } from "$lib/schema/sdk.gen";
    import FormWithLoading from "$lib/FormWithLoading.svelte";
    import SelectTeam from "$lib/SelectTeam.svelte";
    import type { TeamData } from "$lib/schema/types.gen";
    import { es } from "zod/locales";

    let is_blue = $state<boolean>(false);
    let mvp_snowgrave_id = $state<number>(0);
    let game_id = $state<number>(0);
    let mvp_team = $state<TeamData | undefined>(undefined);
    let comment = $state<string>("");
    let total_score = $state<number>();
    let penalty_score = $state<number>();

    onMount(() => {
        // For hash-based routing like #/scout/mvp?id=2&is_blue=true&game_id=6767
        const hash = window.location.hash;
        const searchPart = hash.split('?')[1];
        const params = new URLSearchParams(searchPart);
        
        if (params.has("id") || params.has("is_blue") || params.has("game_id")) {
            mvp_snowgrave_id = Number(params.get("id"));
            game_id = Number(params.get("game_id"));
            is_blue = params.get("is_blue").toLowerCase() === "true";
            console.log(params.get("is_blue"));
            if (isNaN(mvp_snowgrave_id)) {
                window.location.replace("/#/notallowed");
            }
            if (isNaN(game_id)) {
                window.location.replace("/#/notallowed");
            }
        } else {
            window.location.replace("/#/notallowed");
        }
    });

    async function dispatch(): Promise<{ message: string; worked: boolean }> {
        let res = await mvpInsert({
            body: {
                mvp_id: mvp_snowgrave_id,
                mvp_team: mvp_team,
                comment: comment,
                total_score: total_score,
                penalty_score: penalty_score
            }
        });

        if (res.error) {
            return {
                message: "Code: " + String(res.response.status),
                worked: false
            }
        } else {
            if (res.data.status === 'Error') {
                return {
                    message: "Error from server: " + res.data.message,
                    worked: false
                };
            } else {
                return {
                    message: res.data.message,
                    worked: true
                };
            }
        }
    }
</script>


<FormWithLoading dispatch={dispatch}>
    <h2>MVP team:</h2>
    <SelectTeam is_blue={is_blue} game_id={game_id} bind:value={mvp_team} />
    <h2>Why is it MVP:</h2>
    <textarea bind:value={comment}></textarea>
    <h2>Total Score for {is_blue ? "Blue" : "Red"}</h2>
    <input type="number" bind:value={total_score}>
    <h2>Penalty Score for {is_blue ? "Blue" : "Red"}</h2>
    <input type="number" bind:value={penalty_score}>
</FormWithLoading>