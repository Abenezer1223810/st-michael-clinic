import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  UserPlus,
  CalendarPlus,
  ListOrdered,
  Clock,
  CheckCircle2,
  FlaskConical,
  Syringe,
  Activity,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { reportService } from '../../services/reportService';
import { queueService } from '../../services/queueService';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { QueueWidget } from '../../components/ui/QueueWidget';
import { ErrorState } from '../../components/ui/States';
import { DashboardSkeleton } from '../../components/ui/Skeleton';

export default function ReceptionDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [queue, setQueue] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([reportService.dashboard(), queueService.list('')])
      .then(([d, q]) => {
        setStats(d.stats);
        setQueue(q.queue);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!stats) return <DashboardSkeleton />;

  const waitingList = queue.filter((x) => x.status === 'waiting' || x.status === 'called');
  const completedCount = queue.filter((x) => x.status === 'completed').length;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('Reception Dashboard')}
        subtitle={
          <span className="flex items-center gap-2">
            <Activity className="h-4 w-4 animate-pulse text-emerald-300" />
            {t("Today's activity and quick actions · Real-time updates")}
          </span>
        }
        icon={Users}
        image="https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=1600&q=80"
        actions={
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary group" onClick={() => navigate('/patients')}>
              <Users className="h-4 w-4 transition-transform group-hover:scale-110" /> 
              {t('Search Patient')}
            </button>
            <button className="btn-primary group relative overflow-hidden" onClick={() => navigate('/patients/new')}>
              <UserPlus className="h-4 w-4 transition-transform group-hover:scale-110" /> 
              {t('New Patient')}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
            </button>
          </div>
        }
      />

      {/* Enhanced Stats Grid with Animations */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">{t("Today's Overview")}</h3>
          <div className="flex items-center gap-2 text-xs text-emerald-600">
            <TrendingUp className="h-3 w-3" />
            <span className="font-medium">{t('Live Data')}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="group animate-fade-in-up rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 to-white p-4 dark:from-blue-500/10 dark:to-slate-900 shadow-sm transition-all hover:scale-105 hover:shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">{t('Today')}</div>
            </div>
            <p className="mb-1 text-3xl font-bold text-slate-800 dark:text-slate-100">{stats.visitsToday}</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t("Today's Patients")}</p>
          </div>

          <div className="group animate-fade-in-up rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50 to-white p-4 dark:from-amber-500/10 dark:to-slate-900 shadow-sm transition-all hover:scale-105 hover:shadow-lg animation-delay-100">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg">
                <Clock className="h-6 w-6 animate-pulse text-white" />
              </div>
              <div className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">{t('Active')}</div>
            </div>
            <p className="mb-1 text-3xl font-bold text-slate-800 dark:text-slate-100">{stats.waitingPatients}</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('Waiting Patients')}</p>
          </div>

          <div className="group animate-fade-in-up rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-white p-4 dark:from-emerald-500/10 dark:to-slate-900 shadow-sm transition-all hover:scale-105 hover:shadow-lg animation-delay-200">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{t('Done')}</div>
            </div>
            <p className="mb-1 text-3xl font-bold text-slate-800 dark:text-slate-100">{completedCount}</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('Completed Visits')}</p>
          </div>

          <div className="group animate-fade-in-up rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-50 to-white p-4 dark:from-sky-500/10 dark:to-slate-900 shadow-sm transition-all hover:scale-105 hover:shadow-lg animation-delay-300">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 shadow-lg">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <div className="rounded-full bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">{t('New')}</div>
            </div>
            <p className="mb-1 text-3xl font-bold text-slate-800 dark:text-slate-100">{stats.newPatientsToday}</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('New Patients')}</p>
          </div>
        </div>
      </div>

      {/* Medical Services Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-2">
        <div className="group animate-fade-in-up rounded-2xl border border-slate-200 bg-gradient-to-br from-violet-50 to-white p-4 dark:from-violet-500/10 dark:to-slate-900 shadow-sm transition-all hover:scale-105 hover:shadow-lg animation-delay-400">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-lg">
              <FlaskConical className="h-6 w-6 text-white" />
            </div>
            <TrendingUp className="h-4 w-4 text-violet-600" />
          </div>
          <p className="mb-1 text-3xl font-bold text-slate-800 dark:text-slate-100">{stats.laboratoryRequests}</p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('Lab Requests Today')}</p>
        </div>

        <div className="group animate-fade-in-up rounded-2xl border border-slate-200 bg-gradient-to-br from-rose-50 to-white p-4 dark:from-rose-500/10 dark:to-slate-900 shadow-sm transition-all hover:scale-105 hover:shadow-lg animation-delay-500">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg">
              <Syringe className="h-6 w-6 text-white" />
            </div>
            <TrendingUp className="h-4 w-4 text-rose-600" />
          </div>
          <p className="mb-1 text-3xl font-bold text-slate-800 dark:text-slate-100">{stats.procedures}</p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('Procedures Today')}</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Enhanced Queue Card */}
        <Card className="animate-fade-in-up lg:col-span-2 animation-delay-600">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                {t('Current Queue')}
                {waitingList.length > 0 && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white animate-pulse">
                    {waitingList.length}
                  </span>
                )}
              </span>
            }
            subtitle={t('Patients waiting to be seen · Real-time updates')}
            icon={ListOrdered}
            action={
              <Link 
                to="/queue" 
                className="group flex items-center gap-1 text-sm font-medium text-brand-700 transition hover:text-brand-800"
              >
                {t('Manage queue')}
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </Link>
            }
          />
          <QueueWidget
            items={waitingList}
            max={6}
            emptyTitle={t('No patients waiting right now')}
            emptyMessage={t('Queue is clear! Great job team 🎉')}
          />
        </Card>

        {/* Enhanced Quick Actions Card */}
        <Card className="animate-fade-in-up animation-delay-700">
          <CardHeader 
            title={t('Quick Actions')} 
            subtitle={t('Common tasks')} 
            icon={UserPlus} 
          />
          <div className="grid grid-cols-1 gap-3 p-4">
            <button 
              className="group relative overflow-hidden rounded-xl border-2 border-brand-500 bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-4 text-left font-semibold text-white shadow-lg shadow-brand-500/30 transition-all hover:scale-105 hover:shadow-xl" 
              onClick={() => navigate('/patients/new')}
            >
              <div className="relative z-10 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                  <UserPlus className="h-5 w-5" />
                </div>
                <span>{t('New Patient')}</span>
              </div>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
            </button>

            <button 
              className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left font-medium text-slate-700 transition-all hover:scale-105 hover:border-brand-300 hover:bg-brand-50 hover:shadow-md" 
              onClick={() => navigate('/visits?new=1')}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 transition group-hover:bg-brand-100">
                <CalendarPlus className="h-5 w-5 transition group-hover:text-brand-600" />
              </div>
              <span>{t('New Visit')}</span>
            </button>

            <button 
              className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left font-medium text-slate-700 transition-all hover:scale-105 hover:border-brand-300 hover:bg-brand-50 hover:shadow-md" 
              onClick={() => navigate('/patients')}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 transition group-hover:bg-brand-100">
                <Users className="h-5 w-5 transition group-hover:text-brand-600" />
              </div>
              <span>{t('Search Patient')}</span>
            </button>

            <button 
              className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left font-medium text-slate-700 transition-all hover:scale-105 hover:border-brand-300 hover:bg-brand-50 hover:shadow-md" 
              onClick={() => navigate('/queue')}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 transition group-hover:bg-brand-100">
                <ListOrdered className="h-5 w-5 transition group-hover:text-brand-600" />
              </div>
              <span>{t('Manage Queue')}</span>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
