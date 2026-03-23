<script>
	import '../app.css';
	import GetWarningBox from '$lib/GetWarningBox.svelte';

	let { children } = $props();
</script>

{@render children()}
<GetWarningBox />
