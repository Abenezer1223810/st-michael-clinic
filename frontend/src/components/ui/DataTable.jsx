import { EmptyState, LoadingState, ErrorState } from './States';

export function DataTable({
  columns,
  rows = [],
  loading = false,
  error = null,
  onRetry,
  emptyTitle = 'No records found',
  emptyDescription = 'No records match the current view.',
  rowKey = 'id',
  onRowClick,
  dense = false,
}) {
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {columns.map((col) => (
              <th key={col.key} className={`th ${col.right ? 'text-right' : ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, idx) => (
            <tr
              key={row[rowKey] ?? idx}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? 'cursor-pointer transition hover:bg-brand-50/40' : 'hover:bg-slate-50/60'}
            >
              {columns.map((col) => (
                <td key={col.key} className={`td ${dense ? 'py-2' : ''} ${col.right ? 'text-right' : ''}`}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
