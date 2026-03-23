<script lang="ts">
	let { ptData } = $props();

	function visibleKeys(row: Record<string, any>): string[] {
		return Object.keys(row).filter(k => !k.startsWith('_'));
	}

	function pitGetUrl(row: Record<string, any>): string | null {
		if ('_team_number' in row && '_is_ab_team' in row) {
			const event = row.event_code ?? row._event_code ?? '';
			return `/pit/get?team=${row._team_number}&is_ab_team=${row._is_ab_team}&event_code=${event}`;
		}
		return null;
	}
</script>

{#if ptData && ptData.length > 0}
	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					{#each visibleKeys(ptData[0]) as key}
						<th>{key.replace(/_/g, ' ')}</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each ptData as row}
					<tr>
						{#each visibleKeys(row) as key}
							<td>
								{#if key === 'team'}
									{@const href = pitGetUrl(row)}
									{#if href}
										<a href={href}>{row[key]}</a>
									{:else}
										{row[key]}
									{/if}
								{:else}
									{row[key]}
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{:else}
	<p>No data</p>
{/if}

<style>
	.table-wrap {
		overflow-x: auto;
	}
	table {
		border-collapse: collapse;
		width: 100%;
		font-size: 0.85rem;
	}
	th, td {
		border: 1px solid #333;
		padding: 6px 10px;
		text-align: left;
		white-space: nowrap;
	}
	th {
		background: #1a1a1a;
		text-transform: capitalize;
		position: sticky;
		top: 0;
	}
	tr:nth-child(even) {
		background: #1e1e1e;
	}
	a {
		color: #7ecfff;
	}
</style>
