export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-700 ${className}`} />;
}

export function SkeletonStatCard() {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-14" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonStatGrid({ count = 5 }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStatCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonTable({ columns = 5, rows = 6 }) {
  return (
    <div className="card overflow-hidden">
      <div className="space-y-3 border-b border-slate-200 p-5 dark:border-slate-700">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3.5 w-72" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-max">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="th">
                  <Skeleton className="h-3 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: columns }).map((_, c) => (
                  <td key={c} className="td">
                    <Skeleton className="h-3.5 w-full max-w-[120px]" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SkeletonDetail({ lines = 5 }) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="space-y-5">
        <div className="card space-y-3 p-5">
          <Skeleton className="h-5 w-36" />
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton key={i} className="h-3.5 w-full" />
          ))}
        </div>
        <div className="card space-y-3 p-5">
          <Skeleton className="h-5 w-28" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-3.5 w-full" />
          ))}
        </div>
      </div>
      <div className="card space-y-3 p-5 lg:col-span-2">
        <Skeleton className="h-5 w-44" />
        {Array.from({ length: lines + 2 }).map((_, i) => (
          <Skeleton key={i} className="h-3.5 w-full" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div>
      <div className="card overflow-hidden">
        <div className="animate-pulse h-1.5 bg-slate-200/80 dark:bg-slate-700" />
        <div className="p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-52" />
              <Skeleton className="h-3.5 w-72" />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <div className="mb-5 flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24" />
          ))}
        </div>
      </div>
      <SkeletonDetail />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div>
      <div className="card space-y-3 p-6">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="mt-8">
        <SkeletonStatGrid />
      </div>
      <div className="mt-8">
        <SkeletonDetail lines={4} />
      </div>
    </div>
  );
}
