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
  striped = true,
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
          <tr className="sticky top-0 z-10 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-slate-50 to-white dark:border-slate-800 dark:from-slate-800/90 dark:via-slate-800/90 dark:to-slate-900/90 backdrop-blur-sm">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`th select-none ${col.right ? 'text-right' : ''} ${col.center ? 'text-center' : ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {rows.map((row, idx) => {
            const isStripe = striped && idx % 2 === 1;
            return (
              <tr
                key={row[rowKey] ?? idx}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={[
                  'group relative transition-colors duration-100',
                  onRowClick ? 'cursor-pointer' : '',
                  onRowClick
                    ? 'hover:bg-brand-50/60 dark:hover:bg-teal-900/10'
                    : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/30',
                  isStripe ? 'bg-slate-50/50 dark:bg-slate-800/20' : 'bg-white dark:bg-transparent',
                  'animate-stagger-in animation-fill-both',
                ].join(' ')}
                style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
              >
                {/* Left accent bar on clickable rows */}
                {onRowClick && (
                  <td className="absolute left-0 top-0 h-full w-0.5 scale-y-0 bg-brand-500 transition-transform duration-150 group-hover:scale-y-100 rounded-full" aria-hidden />
                )}
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={[
                      col.mono ? 'td-mono' : 'td',
                      dense ? 'py-2' : '',
                      col.right ? 'text-right' : '',
                      col.center ? 'text-center' : '',
                      col.className || '',
                    ].join(' ')}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
