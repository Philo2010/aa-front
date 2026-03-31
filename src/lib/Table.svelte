<script lang="ts">
    import { PowerTable } from '@muonw/powertable';
    import '@muonw/powertable/styles/power-table.scss';
    import '@muonw/powertable/styles/power-table-mascara.scss';

    let { ptData }: { ptData: Record<string, any>[] } = $props();

    function hasPitLink(data: Record<string, any>[]): boolean {
        return data.length > 0 && '_team_number' in data[0] && '_is_ab_team' in data[0];
    }

    function isNumericColumn(data: Record<string, any>[], key: string): boolean {
        return data.every(row => row[key] === null || row[key] === undefined || row[key] === '' || !isNaN(Number(row[key])));
    }

    function buildTableData(data: Record<string, any>[]): Record<string, any>[] {
        if (data.length === 0) return data;

        const keys = Object.keys(data[0]).filter(k => !k.startsWith('_'));
        const numericKeys = new Set(keys.filter(k => k !== 'team' && isNumericColumn(data, k)));

        const mapped = data.map(row => {
            const newRow: Record<string, any> = { ...row };

            for (const k of numericKeys) {
                if (row[k] !== null && row[k] !== undefined && row[k] !== '') {
                    newRow[k] = Number(row[k]);
                }
            }

            if (hasPitLink(data)) {
                const event = row.event_code ?? row._event_code ?? '';
                const paddedTeam = String(row._team_number).padStart(5, '0');
                const href = `/pit/get?team=${paddedTeam}&is_ab_team=${row._is_ab_team}&event_code=${event}`;
                newRow.team = `<a href="${href}">${row.team}</a>`;
            }

            return newRow;
        });

        return mapped;
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