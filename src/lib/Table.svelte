<script lang="ts">
    import { PowerTable } from '@muonw/powertable';
    import '@muonw/powertable/styles/power-table.scss';
    import '@muonw/powertable/styles/power-table-mascara.scss';
    import { dpdgClass } from './dpdg';

    let { ptData }: { ptData: Record<string, any>[] } = $props();

    const DPDG_TITLES: Record<string, string> = {
        dpdg_team: 'DPDG Team %',
        dpdg_team_raw: 'DPDG Team Pts',
        dpdg_alliance: 'DPDG Ally %',
        dpdg_alliance_raw: 'DPDG Ally Pts'
    };

    function isDpdgKey(key: string): boolean {
        return key in DPDG_TITLES;
    }

    // Render a DPDG cell as signed + colour-coded HTML. PowerTable's `html`
    // parser keeps the <span class="dpdg-*"> wrapper and app.css colours it.
    function formatDpdgCell(v: any): string {
        if (v === null || v === undefined || v === '') return '';
        const n = Number(v);
        if (!Number.isFinite(n)) return String(v);
        const sign = n > 0 ? '+' : '';
        return `<span class="${dpdgClass(n)}">${sign}${n.toFixed(1)}</span>`;
    }

    function hasPitLink(data: Record<string, any>[]): boolean {
        return data.length > 0 && '_team_number' in data[0] && '_is_ab_team' in data[0];
    }

    function isNumericColumn(data: Record<string, any>[], key: string): boolean {
        return data.every(row => row[key] === null || row[key] === undefined || row[key] === '' || !isNaN(Number(row[key])));
    }

    function buildTableData(data: Record<string, any>[]): Record<string, any>[] {
        if (data.length === 0) return data;

        const pitLinked = hasPitLink(data);
        return data.map(row => {
            const newRow: Record<string, any> = { ...row };

            if (pitLinked) {
                const event = row.event_code ?? row._event_code ?? '';
                const paddedTeam = String(row._team_number).padStart(5, '0');
                const href = `/pit/get?team=${paddedTeam}&is_ab_team=${row._is_ab_team}&event_code=${event}`;
                newRow.team = `<a href="${href}">${row.team}</a>`;
            }

            for (const key of Object.keys(newRow)) {
                if (isDpdgKey(key)) newRow[key] = formatDpdgCell(newRow[key]);
            }

            return newRow;
        });
    }

    const numericSort = (v1: string, v2: string) => Number(v1) - Number(v2);

    // DPDG cells are HTML strings; strip the markup before comparing numerically.
    const dpdgSort = (v1: string, v2: string) => {
        const n1 = Number(String(v1).replace(/<[^>]*>/g, ''));
        const n2 = Number(String(v2).replace(/<[^>]*>/g, ''));
        return (Number.isFinite(n1) ? n1 : 0) - (Number.isFinite(n2) ? n2 : 0);
    };

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
            } else if (isDpdgKey(k)) {
                return {
                    key: k,
                    title: DPDG_TITLES[k],
                    parseAs: 'html' as const,
                    userFunctions: { customSort: dpdgSort }
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
