import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ListOrdered, UserPlus, RefreshCw, Clock, Stethoscope, AlertTriangle } from 'lucide-react';
import { queueService } from '../../services/queueService';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { formatTime, waitingMinutes } from '../../utils/format';

const STATUSES = [
  { key: '', label: 'All' },
  { key: 'waiting', label: 'Waiting' },
  { key: 'called', label: 'Called' },
  { key: 'in_consultation', label: 'In Consultation' },
  { key: 'completed', label: 'Completed' },
];

function initials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

const AVATAR_COLORS = [
  'from-teal-500 to-cyan-600',
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-500',
  'from-emerald-500 to-green-600',
];

function getAvatarColor(name = '') {
  const code = name.charCodeAt(0) || 0;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function WaitChip({ minutes, status }) {
  if (status === 'completed') return <span className="text-xs text-slate-300 dark:text-slate-600">—</span>;
  if (minutes < 10) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
      <Clock className="h-3 w-3" />{minutes}m
    </span>
  );
  if (minutes < 30) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
      <Clock className="h-3 w-3" />{minutes}m
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
      <Clock className="h-3 w-3" />{minutes}m
    </span>
  );
}

function PriorityBadge({ priority = 'NORMAL' }) {
  if (priority === 'EMERGENCY') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm shadow-rose-500/30">
        <AlertTriangle className="h-2.5 w-2.5" /> Emergency
      </span>
    );
  }
  if (priority === 'URGENT') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm shadow-amber-500/30">
        Urgent
      </span>
    );
  }
  return null;
}

function QueueCard({ entry, onAction, actionLabel, navigate }) {
  const { t } = useTranslation();
  const mins = waitingMinutes(entry.time);
  const color = getAvatarColor(entry.patientName);

  return (
    <div
      className={[
        'group relative flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-soft hover:border-slate-300/80',
        'dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700',
        'cursor-pointer animate-fade-up animation-fill-both',
      ].join(' ')}
      onClick={() => navigate(`/patients/${entry.patientId}`)}
    >
      {/* Priority strip */}
      {entry.priority === 'EMERGENCY' && (
        <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-rose-500 to-pink-500" />
      )}
      {entry.priority === 'URGENT' && (
        <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-amber-500 to-orange-400" />
      )}

      <div className="flex items-start justify-between gap-3">
        {/* Avatar + Name */}
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white shadow-md ${color}`}>
            {initials(entry.patientName)}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{entry.patientName}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">{entry.patientId} · Visit {entry.visitNumber}</p>
          </div>
        </div>

        {/* Queue number chip */}
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xs font-bold text-brand-700 ring-1 ring-brand-200 dark:bg-brand-900/20 dark:text-brand-300 dark:ring-brand-800">
          #{entry.queueNumber}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={entry.status} />
        <WaitChip minutes={mins} status={entry.status} />
        <PriorityBadge priority={entry.priority} />
        <span className="ml-auto text-xs text-slate-400">{t(entry.service)}</span>
      </div>

      <div className="flex items-center gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
        <span className="text-xs text-slate-400">{formatTime(entry.time)}</span>
        <div className="ml-auto flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Link
            to={`/opd/consultation/${entry.visitId}`}
            className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-300"
          >
            <Stethoscope className="h-3 w-3" /> {t('Open')}
          </Link>
          {actionLabel && (
            <button
              onClick={() => onAction()}
              className="rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-brand-700 active:scale-95"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QueuePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [filter, setFilter] = useState('');
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const d = await queueService.list(filter || undefined);
      setQueue(d.queue || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 45s
  useEffect(() => {
    const id = setInterval(() => load(true), 45000);
    return () => clearInterval(id);
  }, [load]);

  const updateStatus = async (entry, status) => {
    try {
      const { message } = await queueService.updateStatus(entry.id, status);
      toast.success(message || t('Queue status updated.'));
      load(true);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const nextStatus = (entry) => {
    if (entry.status === 'waiting') return { to: 'called', label: t('Call') };
    if (entry.status === 'called') return { to: 'in_consultation', label: t('Start') };
    if (entry.status === 'in_consultation') return { to: 'completed', label: t('Complete') };
    return null;
  };

  // Stats
  const waiting = queue.filter((q) => q.status === 'waiting').length;
  const active = queue.filter((q) => ['called', 'in_consultation'].includes(q.status)).length;
  const done = queue.filter((q) => q.status === 'completed').length;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('Queue Management')}
        subtitle={t("Today's patient queue — all services")}
        icon={ListOrdered}
        badge={queue.length > 0 ? `${queue.length} patients` : undefined}
        actions={
          <button className="btn-primary" onClick={() => navigate('/patients')}>
            <UserPlus className="h-4 w-4" /> {t('Add Patient')}
          </button>
        }
      />

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t('Waiting'), count: waiting, color: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/10' },
          { label: t('In Progress'), count: active, color: 'bg-brand-500', bg: 'bg-brand-50 dark:bg-brand-900/10' },
          { label: t('Completed'), count: done, color: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
        ].map((s) => (
          <div key={s.label} className={`flex items-center gap-3 rounded-2xl border border-slate-200/80 ${s.bg} px-4 py-3 shadow-card dark:border-slate-800`}>
            <div className={`h-2.5 w-2.5 rounded-full ${s.color} shadow-sm`} />
            <div>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{s.count}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter pills + refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s.key}
              onClick={() => setFilter(s.key)}
              className={`rounded-xl px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${
                filter === s.key
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-300 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800'
              }`}
            >
              {t(s.label)}
            </button>
          ))}
        </div>
        <button
          onClick={() => load(true)}
          className={`flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-500 shadow-sm transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 ${refreshing ? 'opacity-60' : ''}`}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {t('Refresh')}
        </button>
      </div>

      {/* Queue cards grid */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-200/60 dark:bg-slate-800/60" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <div className="py-12 text-center text-sm text-rose-600">{error}</div>
        </Card>
      ) : queue.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-600">
              <ListOrdered className="h-7 w-7" />
            </div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{t('Queue is empty')}</p>
            <p className="text-xs text-slate-400">{t('Patients added to the queue will appear here.')}</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {queue.map((entry, idx) => {
            const next = nextStatus(entry);
            return (
              <div key={entry.id} style={{ animationDelay: `${Math.min(idx * 40, 400)}ms` }}>
                <QueueCard
                  entry={entry}
                  navigate={navigate}
                  actionLabel={next?.label}
                  onAction={() => updateStatus(entry, next.to)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
