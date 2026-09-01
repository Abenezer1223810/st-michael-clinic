import { useState, useEffect, useCallback } from 'react';
import {
  ArchiveRestore,
  Trash2,
  RefreshCw,
  Search,
  Clock,
  AlertTriangle,
  Filter,
  ShieldAlert,
  User,
  PackageOpen,
} from 'lucide-react';
import { recycleBinService } from '../../services/recycleBinService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const ALL_ENTITY_TYPES = [
  { value: 'USER', label: 'Staff / Users', adminOnly: true },
  { value: 'PATIENT', label: 'Patients' },
  { value: 'LAB_REQUEST', label: 'Lab Requests' },
  { value: 'PRESCRIPTION', label: 'Prescriptions' },
  { value: 'PROCEDURE_ORDER', label: 'Procedure Orders' },
  { value: 'INJECTION_ORDER', label: 'Injection Orders' },
  { value: 'MEDICINE', label: 'Medicines (Catalog)', adminOnly: true },
  { value: 'LAB_TEST', label: 'Lab Tests (Catalog)', adminOnly: true },
  { value: 'PROCEDURE_TYPE', label: 'Procedure Types (Catalog)', adminOnly: true },
];

function Daysbadge({ days }) {
  if (days === null || days === undefined) return null;
  let cls = 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300';
  if (days <= 3) cls = 'text-rose-600 bg-rose-100 dark:bg-rose-900/40 dark:text-rose-300';
  else if (days <= 7) cls = 'text-orange-500 bg-orange-100 dark:bg-orange-900/40 dark:text-orange-300';
  else if (days <= 14) cls = 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/40 dark:text-yellow-300';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>
      <Clock className="h-3 w-3" />
      {days}d left
    </span>
  );
}


function ConfirmModal({ open, title, message, confirmLabel, confirmClass, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800">
        <div className="mb-3 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 flex-shrink-0 text-orange-500" />
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">{title}</h2>
        </div>
        <p className="mb-5 text-sm text-slate-600 dark:text-slate-300">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RecycleBinPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = (user?.role || '').toLowerCase() === 'administrator';
  const ENTITY_TYPES = ALL_ENTITY_TYPES.filter((et) => isAdmin || !et.adminOnly);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [confirm, setConfirm] = useState(null); // { type: 'restore'|'purge'|'empty', item }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (entityFilter !== 'ALL') params.entityType = entityFilter;
      if (isAdmin && userFilter) params.user = userFilter;
      if (search) params.search = search;
      const { data } = await recycleBinService.list(params);
      setItems(data.items || []);
    } catch (err) {
      toast({ type: 'error', message: err?.response?.data?.message || 'Failed to load recycle bin.' });
    } finally {
      setLoading(false);
    }
  }, [entityFilter, userFilter, search, isAdmin, toast]);

  useEffect(() => { load(); }, [load]);

  const handleRestore = async (item) => {
    try {
      const { data } = await recycleBinService.restore(item.id);
      toast({ type: 'success', message: data.message || `"${item.title}" restored.` });
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      toast({ type: 'error', message: err?.response?.data?.message || 'Restore failed.' });
    }
    setConfirm(null);
  };

  const handlePurge = async (item) => {
    try {
      await recycleBinService.purge(item.id);
      toast({ type: 'success', message: `"${item.title}" permanently deleted.` });
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      toast({ type: 'error', message: err?.response?.data?.message || 'Delete failed.' });
    }
    setConfirm(null);
  };

  const handleEmpty = async () => {
    try {
      await recycleBinService.empty();
      toast({ type: 'success', message: 'Recycle bin emptied.' });
      setItems([]);
    } catch (err) {
      toast({ type: 'error', message: err?.response?.data?.message || 'Failed to empty bin.' });
    }
    setConfirm(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ArchiveRestore className="h-6 w-6 text-brand-600" />
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {isAdmin ? 'System-Wide Recycle Bin' : 'My Recycle Bin'}
            </h1>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                <ShieldAlert className="h-3 w-3" />
                Administrator View
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isAdmin
              ? 'View and manage all deleted items across the entire system. Items are permanently removed after 30 days.'
              : 'Items you have deleted are held here for 30 days before permanent removal. You can restore them anytime.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          {isAdmin && items.length > 0 && (
            <button
              onClick={() => setConfirm({ type: 'empty' })}
              className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 shadow-sm hover:bg-red-100 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
              Empty All
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search deleted items…"
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-brand-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
          />
        </div>

        {/* Entity type filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="rounded-xl border border-slate-200 py-2 pl-3 pr-8 text-sm focus:border-brand-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
          >
            {ENTITY_TYPES.map((et) => (
              <option key={et.value} value={et.value}>{et.label}</option>
            ))}
          </select>
        </div>

        {/* Admin: user filter */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              placeholder="Filter by user…"
              className="w-40 rounded-xl border border-slate-200 py-2 pl-3 pr-3 text-sm focus:border-brand-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
            />
          </div>
        )}
      </div>

      {/* Items list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
          Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 py-20 text-slate-400 dark:border-slate-700">
          <PackageOpen className="h-12 w-12 opacity-30" />
          <p className="text-sm font-medium">Recycle bin is empty</p>
          <p className="text-xs">Deleted items will appear here for 30 days</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800/50"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700">
                  <ArchiveRestore className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {item.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium dark:bg-slate-700">
                      {item.entityType?.replace(/_/g, ' ')}
                    </span>
                    {isAdmin && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Deleted by <strong className="ml-0.5 text-slate-700 dark:text-slate-200">{item.deletedBy}</strong>
                      </span>
                    )}
                    <span>
                      {new Date(item.deletedAt).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                    <Daysbadge days={item.daysRemaining} />
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => setConfirm({ type: 'restore', item })}
                  className="flex items-center gap-1.5 rounded-xl border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300"
                >
                  <ArchiveRestore className="h-3.5 w-3.5" />
                  Restore
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setConfirm({ type: 'purge', item })}
                    className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Forever
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm modal */}
      <ConfirmModal
        open={!!confirm}
        title={
          confirm?.type === 'restore'
            ? 'Restore Item?'
            : confirm?.type === 'purge'
            ? 'Delete Forever?'
            : 'Empty Recycle Bin?'
        }
        message={
          confirm?.type === 'restore'
            ? `"${confirm.item?.title}" will be restored and returned to the system.`
            : confirm?.type === 'purge'
            ? `"${confirm.item?.title}" will be permanently deleted and cannot be recovered.`
            : 'All items in the recycle bin will be permanently deleted. This cannot be undone.'
        }
        confirmLabel={
          confirm?.type === 'restore' ? 'Restore' : confirm?.type === 'purge' ? 'Delete Forever' : 'Empty All'
        }
        confirmClass={
          confirm?.type === 'restore'
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-red-600 hover:bg-red-700'
        }
        onConfirm={() => {
          if (confirm?.type === 'restore') handleRestore(confirm.item);
          else if (confirm?.type === 'purge') handlePurge(confirm.item);
          else handleEmpty();
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
