<script lang="ts">
	import { PowerTable } from '@muonw/powertable';
	let { ptData } = $props();


	// Uncomment to add basic styling. Requires installing saas (i.e. npm install -D sass)
	import '@muonw/powertable/styles/power-table.scss';

	// Uncomment if using @muonw/mascara (https://github.com/muonw/muonw-mascara)
	import '@muonw/powertable/styles/power-table-mascara.scss';
</script>

<PowerTable {ptData} />
