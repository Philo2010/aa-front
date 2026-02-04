<script lang="ts">
    import { graph } from "$lib/schema/sdk.gen";
    import type { TeamData } from "$lib/schema/types.gen";

    let teams = $state<TeamData[] | string>(new Array());

    async function dispatch(): Promise<{ message: string; worked: boolean }>  {
        let res = graph({
			body: {
				event: "",
				teams: []
			}
		});

        return {
            message: "TBA",
            worked: false
        };
    }
</script>