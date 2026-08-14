import { useEffect, useState } from 'react';
import { Users, Shield, UserRound } from 'lucide-react';
import { catalogService } from '../../services/catalogService';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';

const ROLE_LABELS = {
  administrator: 'Administrator',
  receptionist: 'Receptionist',
  doctor: 'Doctor',
  laboratory: 'Laboratory Technician',
  procedure: 'Procedure Nurse',
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    catalogService
      .users()
      .then((d) => setUsers(d.users))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const columns = [
    { key: 'name', header: 'Name', render: (u) => <span className="font-medium text-slate-800">{u.name}</span> },
    { key: 'title', header: 'Title', render: (u) => <span className="text-slate-500">{u.title}</span> },
    { key: 'username', header: 'Username', render: (u) => <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{u.username}</code> },
    {
      key: 'role',
      header: 'Role',
      render: (u) => (
        <StatusBadge
          tone={u.role === 'administrator' ? 'brand' : u.role === 'doctor' ? 'emerald' : u.role === 'receptionist' ? 'sky' : u.role === 'laboratory' ? 'violet' : 'amber'}
        >
          {ROLE_LABELS[u.role] || u.role}
        </StatusBadge>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="System Users"
        subtitle="Staff accounts and their roles in the clinic"
        icon={Users}
        actions={
          <button className="btn-secondary" onClick={load}>
            <Shield className="h-4 w-4" /> Refresh
          </button>
        }
      />

      <Card>
        <CardHeader title="User Accounts" subtitle="All system users with access to the clinic management system" icon={UserRound} />
        <DataTable
          columns={columns}
          rows={users}
          loading={loading}
          error={error}
          onRetry={load}
          emptyTitle="No users found"
          emptyDescription="User accounts are managed by the system administrator."
        />
      </Card>
    </div>
  );
}
