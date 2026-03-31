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

        if (hasPitLink(data)) {
            return data.map(row => {
                const newRow: Record<string, any> = { ...row };
                const event = row.event_code ?? row._event_code ?? '';
                const paddedTeam = String(row._team_number).padStart(5, '0');
                const href = `/pit/get?team=${paddedTeam}&is_ab_team=${row._is_ab_team}&event_code=${event}`;
                newRow.team = `<a href="${href}">${row.team}</a>`;
                return newRow;
            });
        }

        return data;
    }

    const numericSort = (v1: string, v2: string) => Number(v1) - Number(v2);

    function buildInstructs(data: Record<string, any>[]) {
        if (data.length === 0) return [];

        const keys = Object.keys(data[0]).filter(k => !k.startsWith('_'));

        return keys.map(k => {
            if (k === 'team' && hasPitLink(data)) {
                return {
                    key: k,
                    parseAs: 'unsafe-html' as const,
                    userFunctions: {
                        customSort: (v1: string, v2: string) => {
                            const n1 = Number(v1.match(/team=(\d+)/)?.[1] ?? 0);
                            const n2 = Number(v2.match(/team=(\d+)/)?.[1] ?? 0);
                            return n1 - n2;
                        }
                    }
                };
            } else if (k !== 'team' && isNumericColumn(data, k)) {
                return { key: k, userFunctions: { customSort: numericSort } };
            } else {
                return { key: k };
            }
        });
    }

    let tableData = $derived(buildTableData(ptData));
    let ptInstructs = $derived(buildInstructs(ptData));
</script>

<PowerTable ptData={tableData} {ptInstructs} />
