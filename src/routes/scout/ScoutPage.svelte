<!--TODO MAKE THIS PRETTY SEQUOURA! (ps please use comments when denoting the state of a page)-->


<script lang="ts">
    import FormWithLoading from "$lib/FormWithLoading.svelte";
    import type { Insert2 } from "$lib/schema/types.gen";
    import { scoutInsert } from "$lib/schema/sdk.gen";
    import { onMount } from "svelte";
    
    let team = $state<string>("");
    let stop = $state<boolean>(true);
    let snowgrave_insert_id: number;
    let scout_form: Insert2 = $state<Insert2>({
        hehe: 0,
        beep: 0,
        hoohoo: ""
    });

    $effect(() => {
      if (scout_form.hoohoo === "") {
        stop = true;
      } else {
        stop = false;
      }
    })

    enum States {
        Auto = 0,
        Teleop = 1,
        Endgame = 2,
    }


    
    let form_state = $state<States>(States.Auto);

    onMount(() => {
        // For hash-based routing like #/pit/insert?id=2&team=5829
        const hash = window.location.hash;
        const searchPart = hash.split('?')[1];
        const params = new URLSearchParams(searchPart);
        
        if (params.has("id") || params.has("team")) {
            snowgrave_insert_id = Number(params.get("id"));
            team = params.get("team");
            if (isNaN(snowgrave_insert_id)) {
                window.location.replace("/#/notallowed");
            }
        } else {
            window.location.replace("/#/notallowed");
        }
    });

    async function dispatch(): Promise<{ message: string; worked: boolean }> {
      let res = await scoutInsert({
          body: {
              snowgrave_scout_id: snowgrave_insert_id,
              game: {
                  ExampleGame: {
                      hehe: scout_form.hehe,
                      beep: scout_form.beep,
                      hoohoo: scout_form.hoohoo
                  }
              }
          }
      });

      if (res.error) {
        return {
          message: "HTTP CODE: " + res.response.status,
          worked: false
        };
      } else {
        if (res.data.status === 'Error') {
          return {
            message: "Message send from server: " + res.data.message,
            worked: false
          };
        } else {
          return {
            message: res.data.message,
            worked: true
          }
        }
      }
    }
</script>

<FormWithLoading dispatch={dispatch} hide_sub={form_state != 2} stop={stop}>

{#if form_state === States.Auto }
<!--Auto-->
<h1>Auto</h1>
<h2>Hehe</h2>
<input type="number" bind:value={scout_form.hehe} placeholder="Hehe">
{:else if form_state === States.Teleop}
<!--Teleop-->
<h1>Teleop</h1>
<h2>Beep</h2>
<input type="number" bind:value={scout_form.beep} placeholder="Beep">
{:else}
<!--Endgame-->
<h1>Endgame</h1>
<h2>Hoohoo</h2>
<input bind:value={scout_form.hoohoo} placeholder="HooHoo">
{/if}
<br>
</FormWithLoading>
<br>
<button class="tactical-btn" onclick={() => {form_state--}} disabled={form_state === 0}>Back page</button>
<button class="tactical-btn" onclick={() => {form_state++}} disabled={form_state > 1}>Next page</button>




<style>
  .tactical-btn {
    padding: 0.9rem 1.6rem;
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;

    color: #eaeaea;
    background: linear-gradient(180deg, #2b2f33, #1a1d20);
    border: 2px solid #3a3f44;
    border-radius: 6px;

    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.08),
      0 4px 12px rgba(0,0,0,0.6);

    cursor: pointer;
    transition: all 0.15s ease;
  }

  .tactical-btn:hover:not(:disabled) {
    background: linear-gradient(180deg, #353a40, #1f2327);
    border-color: #5a6066;
    transform: translateY(-1px);
  }

  .tactical-btn:active:not(:disabled) {
    transform: translateY(1px);
    box-shadow:
      inset 0 2px 4px rgba(0,0,0,0.6);
  }

  .tactical-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    box-shadow: none;
  }
</style>
