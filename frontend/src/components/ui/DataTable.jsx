import { useTranslation } from 'react-i18next';
import { EmptyState, ErrorState } from './States';
import { SkeletonTable } from './Skeleton';

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
  const { t } = useTranslation();
  if (loading) return <SkeletonTable columns={columns.length} />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;

  if (rows.length === 0) {
    return <EmptyState title={t(emptyTitle)} description={t(emptyDescription)} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max">
        <thead>
          <tr className="border-b border-slate-200 bg-gradient-to-r from-brand-50/80 via-cyan-50/60 to-slate-50 dark:border-slate-800 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800">
            {columns.map((col) => (
              <th key={col.key} className={`th ${col.right ? 'text-right' : ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((row, idx) => (
            <tr
              key={row[rowKey] ?? idx}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? 'cursor-pointer transition hover:bg-brand-50/40 dark:hover:bg-slate-800/60' : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'}
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
