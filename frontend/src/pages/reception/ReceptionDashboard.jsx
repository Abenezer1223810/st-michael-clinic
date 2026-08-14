import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  CalendarPlus,
  ListOrdered,
  Clock,
  CheckCircle2,
  FlaskConical,
  Syringe,
} from 'lucide-react';
import { reportService } from '../../services/reportService';
import { queueService } from '../../services/queueService';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingState, ErrorState } from '../../components/ui/States';
import { formatTime, waitingMinutes } from '../../utils/format';

export default function ReceptionDashboard() {
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
  if (!stats) return <LoadingState label="Loading reception dashboard…" />;

  const waitingList = queue.filter((x) => x.status === 'waiting' || x.status === 'called');
  const completedCount = queue.filter((x) => x.status === 'completed').length;

  return (
    <div>
      <PageHeader
        title="Reception Dashboard"
        subtitle="Today's activity and quick actions"
        icon={Users}
        actions={
          <>
            <button className="btn-secondary" onClick={() => navigate('/patients')}>
              <Users className="h-4 w-4" /> Search Patient
            </button>
            <button className="btn-primary" onClick={() => navigate('/patients/new')}>
              <UserPlus className="h-4 w-4" /> New Patient
            </button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Users} label="Today's Patients" value={stats.visitsToday} tone="brand" />
        <StatCard icon={Clock} label="Waiting Patients" value={stats.waitingPatients} tone="amber" />
        <StatCard icon={CheckCircle2} label="Completed Visits" value={completedCount} tone="emerald" />
        <StatCard icon={UserPlus} label="New Patients Today" value={stats.newPatientsToday} tone="sky" />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={FlaskConical} label="Lab Requests" value={stats.laboratoryRequests} tone="violet" />
        <StatCard icon={Syringe} label="Procedures" value={stats.procedures} tone="rose" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Current Queue"
            subtitle="Patients waiting to be seen"
            icon={ListOrdered}
            action={
              <Link to="/queue" className="text-sm font-medium text-brand-700 hover:underline">
                Manage queue
              </Link>
            }
          />
          {waitingList.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-400">No patients waiting right now.</p>
          ) : (
            <ul className="divide-y divide-slate-100 px-2">
              {waitingList.slice(0, 6).map((q) => (
                <li key={q.id} className="flex items-center justify-between gap-3 px-3 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                      #{q.queueNumber}
                    </span>
                    <div>
                      <Link to={`/patients/${q.patientId}`} className="text-sm font-medium text-slate-800 hover:underline">
                        {q.patientName}
                      </Link>
                      <p className="text-xs text-slate-400">
                        {q.patientId} · {q.service} · {formatTime(q.time)} ({waitingMinutes(q.time)}m waiting)
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={q.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Quick Actions" icon={UserPlus} />
          <div className="grid grid-cols-1 gap-2 p-4">
            <button className="btn-primary w-full justify-start" onClick={() => navigate('/patients/new')}>
              <UserPlus className="h-4 w-4" /> New Patient
            </button>
            <button className="btn-secondary w-full justify-start" onClick={() => navigate('/visits?new=1')}>
              <CalendarPlus className="h-4 w-4" /> New Visit
            </button>
            <button className="btn-secondary w-full justify-start" onClick={() => navigate('/patients')}>
              <Users className="h-4 w-4" /> Search Patient
            </button>
            <button className="btn-secondary w-full justify-start" onClick={() => navigate('/queue')}>
              <ListOrdered className="h-4 w-4" /> Queue
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
