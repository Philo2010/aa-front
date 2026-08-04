<script lang="ts">
  let {
    current_time_in_seconds = $bindable(0)
  }: {
    current_time_in_seconds?: number;
  } = $props();

  let is_button_pressed = $state(false);

  $effect(() => {
    if (!is_button_pressed) return;

    const interval = setInterval(() => {
      current_time_in_seconds += 1;
    }, 1000);

    return () => clearInterval(interval);
  });

  function format(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }
</script>

<button onclick={() => (is_button_pressed = !is_button_pressed)}>
    <p>{format(current_time_in_seconds)}</p>
</button>