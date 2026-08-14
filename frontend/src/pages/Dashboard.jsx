import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  UserCheck,
  Clock,
  Stethoscope,
  FlaskConical,
  ClipboardList,
  CheckCircle2,
  Syringe,
  Pill,
  CalendarPlus,
  Activity,
} from 'lucide-react';
import { reportService } from '../services/reportService';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader } from '../components/ui/Card';
import { LoadingState, ErrorState } from '../components/ui/States';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const PIE_COLORS = ['#f59e0b', '#0d9488', '#10b981'];

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    reportService
      .dashboard()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!data) return <LoadingState label="Loading clinic dashboard…" />;

  const s = data.stats;

  const quickActions =
    user.role === 'receptionist'
      ? [
          { label: 'Register Patient', to: '/patients/new', icon: UserPlus },
          { label: 'Search Patients', to: '/patients', icon: Users },
          { label: 'New Visit', to: '/visits', icon: CalendarPlus },
          { label: 'Manage Queue', to: '/queue', icon: ClipboardList },
        ]
      : user.role === 'doctor'
      ? [
          { label: 'OPD Queue', to: '/opd', icon: Stethoscope },
          { label: 'Patients', to: '/patients', icon: Users },
          { label: 'Prescriptions', to: '/prescriptions', icon: Pill },
        ]
      : user.role === 'laboratory'
      ? [
          { label: 'Lab Worklist', to: '/laboratory', icon: FlaskConical },
          { label: 'Requests', to: '/laboratory/requests', icon: ClipboardList },
        ]
      : user.role === 'procedure'
      ? [
          { label: 'Procedures', to: '/procedures', icon: Syringe },
          { label: 'Pending Procedures', to: '/procedures', icon: ClipboardList },
        ]
      : [
          { label: 'Patients', to: '/patients', icon: Users },
          { label: 'Reports', to: '/reports', icon: Activity },
          { label: 'System', to: '/admin/system', icon: ClipboardList },
        ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-lg font-bold text-slate-800">Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user.name.split(' ')[0]}.</h2>
        <p className="text-sm text-slate-500">Here is an overview of clinic activity.</p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard icon={Users} label="Total Patients" value={s.totalPatients} tone="brand" />
        <StatCard icon={UserPlus} label="New Patients Today" value={s.newPatientsToday} tone="sky" />
        <StatCard icon={UserCheck} label="Returning Patients" value={s.returningPatients} tone="violet" />
        <StatCard icon={Clock} label="Waiting in Queue" value={s.waitingPatients} tone="amber" />
        <StatCard icon={Stethoscope} label="OPD Consultations Today" value={s.opdConsultations} tone="emerald" />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard icon={FlaskConical} label="Lab Requests" value={s.laboratoryRequests} tone="sky" />
        <StatCard icon={ClipboardList} label="Pending Lab Tests" value={s.pendingLaboratoryTests} tone="amber" />
        <StatCard icon={CheckCircle2} label="Completed Results" value={s.completedResults} tone="emerald" />
        <StatCard icon={Syringe} label="Procedures" value={s.procedures} tone="rose" />
        <StatCard icon={Pill} label="Prescriptions" value={s.prescriptions} tone="violet" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Clinic Activity — Last 7 Days" subtitle="Patients, consultations and laboratory requests per day" icon={Activity} />
          <div className="h-72 px-4 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.last7Days} barSize={18}>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="patients" name="Patients" fill="#0d9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="consultations" name="Consultations" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="laboratory" name="Lab Requests" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Queue Status Today" icon={ClipboardList} />
          <div className="h-56 px-4 py-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Waiting', value: data.queueByStatus.waiting },
                    { name: 'In Consultation', value: data.queueByStatus.in_consultation },
                    { name: 'Completed', value: data.queueByStatus.completed },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {PIE_COLORS.map((c, i) => (
                    <Cell key={i} fill={c} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-2 px-4 pb-4 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5" /> {s.visitsToday} visits registered today
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title="Quick Actions" subtitle="Jump to your most common tasks" />
        <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
          {quickActions.map((a) => (
            <Link
              key={a.label}
              to={a.to}
              className="flex flex-col items-start gap-2 rounded-xl border border-slate-200 p-4 transition hover:border-brand-400 hover:bg-brand-50/50"
            >
              <a.icon className="h-5 w-5 text-brand-600" />
              <span className="text-sm font-medium text-slate-700">{a.label}</span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
