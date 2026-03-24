<script lang="ts">
	import { PowerTable } from '@muonw/powertable';

	import '@muonw/powertable/styles/power-table.scss';
	import '@muonw/powertable/styles/power-table-mascara.scss';

	let { ptData }: { ptData: Record<string, any>[] } = $props();

	function hasPitLink(data: Record<string, any>[]): boolean {
		return data.length > 0 && '_team_number' in data[0] && '_is_ab_team' in data[0];
	}

	function buildTableData(data: Record<string, any>[]): Record<string, any>[] {
		if (!hasPitLink(data)) return data;

		return data.map(row => {
			const event = row.event_code ?? row._event_code ?? '';
			const href = `/pit/get?team=${row._team_number}&is_ab_team=${row._is_ab_team}&event_code=${event}`;
			return {
				...row,
				team: `<a href="${href}">${row.team}</a>`,
			};
		});
	}

	function buildInstructs(data: Record<string, any>[]) {
		if (!hasPitLink(data) || data.length === 0) return undefined;

		return Object.keys(data[0])
			.filter(k => !k.startsWith('_'))
			.map(k => k === 'team' ? { key: k, parseAs: 'unsafe-html' as const } : { key: k });
	}

	let tableData = $derived(buildTableData(ptData));
	let ptInstructs = $derived(buildInstructs(ptData));
</script>

{#if ptInstructs}
	<PowerTable ptData={tableData} {ptInstructs} />
{:else}
	<PowerTable ptData={tableData} />
{/if}
