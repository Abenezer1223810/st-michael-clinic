import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Shield, UserPlus, RefreshCw, Ban, UserCheck, Trash2, UserRound } from 'lucide-react';
import { catalogService } from '../../services/catalogService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { Field } from '../../components/ui/Field';
import { Spinner } from '../../components/ui/States';

const ROLE_LABELS = {
  administrator: 'Administrator',
  receptionist: 'Receptionist',
  doctor: 'Doctor',
  laboratory: 'Laboratory Technician',
  procedure: 'Procedure Nurse',
};

const ROLE_TONES = {
  administrator: 'brand',
  doctor: 'emerald',
  receptionist: 'sky',
  laboratory: 'violet',
  procedure: 'amber',
};

const ROLES = Object.keys(ROLE_LABELS);

export default function AdminUsers() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [form, setForm] = useState({ name: '', username: '', title: '', role: 'receptionist', password: '' });
  const [formErrors, setFormErrors] = useState({});

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

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setFormErrors((prev) => ({ ...prev, [key]: null }));
  };

  const validateForm = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = t('Full name is required.');
    if (!form.username.trim()) errs.username = t('Username is required.');
    if (!form.role) errs.role = t('Select a role.');
    if (form.password.length < 6) errs.password = t('Password must be at least 6 characters.');
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const openAdd = () => {
    setForm({ name: '', username: '', title: '', role: 'receptionist', password: '' });
    setFormErrors({});
    setAddOpen(true);
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const { message } = await catalogService.createUser(form);
      toast.success(message || t('User created.'));
      setAddOpen(false);
      load();
    } catch (e) {
      toast.error(e.message);
      setFormErrors((prev) => ({ ...prev, username: e.message }));
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (u, role) => {
    if (role === u.role) return;
    try {
      await catalogService.updateUser(u.id, { role });
      toast.success(t('{{name}} is now {{role}}.', { name: u.name, role: t(ROLE_LABELS[role]).toLowerCase() }));
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleBanToggle = async (u) => {
    try {
      await catalogService.updateUser(u.id, { banned: !u.banned });
      toast.success(u.banned ? t('{{name}} can sign in again.', { name: u.name }) : t('{{name}} has been suspended.', { name: u.name }));
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (u) => {
    if (confirmDelete !== u.id) {
      setConfirmDelete(u.id);
      setTimeout(() => setConfirmDelete((c) => (c === u.id ? null : c)), 3000);
      return;
    }
    try {
      const { message } = await catalogService.deleteUser(u.id);
      toast.success(message || t('User removed.'));
      setConfirmDelete(null);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const columns = [
    { key: 'name', header: t('Name'), render: (u) => <span className="font-medium text-slate-800 dark:text-slate-100">{u.name}</span> },
    { key: 'title', header: t('Title'), render: (u) => <span className="text-slate-500 dark:text-slate-400">{u.title}</span> },
    { key: 'username', header: t('Username'), render: (u) => <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{u.username}</code> },
    {
      key: 'role',
      header: t('Role'),
      render: (u) => (
        <div className="flex items-center gap-2">
          <StatusBadge tone={ROLE_TONES[u.role]}>{t(ROLE_LABELS[u.role] || u.role)}</StatusBadge>
          <select
            value={u.role}
            onChange={(e) => handleRoleChange(u, e.target.value)}
            disabled={u.id === currentUser.id}
            title={u.id === currentUser.id ? t('You cannot change your own role') : t('Change role')}
            aria-label={t('Change role for {{name}}', { name: u.name })}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{t(ROLE_LABELS[r])}</option>
            ))}
          </select>
        </div>
      ),
    },
    {
      key: 'status',
      header: t('Status'),
      render: (u) => (
        <StatusBadge tone={u.banned ? 'danger' : 'success'}>{u.banned ? t('Banned') : t('Active')}</StatusBadge>
      ),
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (u) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleBanToggle(u)}
            disabled={u.id === currentUser.id}
            title={u.id === currentUser.id ? t('You cannot ban your own account') : u.banned ? t('Reinstate user') : t('Ban user')}
            aria-label={u.banned ? t('Reinstate {{name}}', { name: u.name }) : t('Ban {{name}}', { name: u.name })}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-amber-50 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-400 dark:hover:bg-amber-500/10"
          >
            {u.banned ? <UserCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
          </button>
          <button
            onClick={() => handleDelete(u)}
            disabled={u.id === currentUser.id}
            title={u.id === currentUser.id ? t('You cannot delete your own account') : t('Delete user')}
            aria-label={t('Delete {{name}}', { name: u.name })}
            className={`rounded-lg p-1.5 transition disabled:cursor-not-allowed disabled:opacity-30 ${
              confirmDelete === u.id
                ? 'bg-rose-600 px-2.5 text-xs font-semibold text-white'
                : 'text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-500/10'
            }`}
          >
            {confirmDelete === u.id ? t('Sure?') : <Trash2 className="h-4 w-4" />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('System Users')}
        subtitle={t('Staff accounts and their roles in the clinic')}
        icon={Users}
        actions={
          <>
            <button className="btn-secondary" onClick={load}>
              <RefreshCw className="h-4 w-4" /> {t('Refresh')}
            </button>
            <button className="btn-primary" onClick={openAdd}>
              <UserPlus className="h-4 w-4" /> {t('Add User')}
            </button>
          </>
        }
      />

      <Card>
        <CardHeader title={t('User Accounts')} subtitle={t('Add staff, change roles, suspend or remove accounts')} icon={UserRound} />
        <DataTable
          columns={columns}
          rows={users}
          loading={loading}
          error={error}
          onRetry={load}
          emptyTitle={t('No users found')}
          emptyDescription={t('Add a staff member to grant them access to the clinic system.')}
        />
      </Card>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={t('Add User')}
        subtitle={t('Create a staff account to access the clinic system')}
        icon={UserPlus}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setAddOpen(false)}>{t('Cancel')}</button>
            <button className="btn-primary" onClick={handleCreate} disabled={saving}>
              {saving ? <Spinner /> : t('Create User')}
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('Full Name')} required error={formErrors.name} className="sm:col-span-2">
            <input className="input" value={form.name} onChange={set('name')} placeholder={t('e.g. Sara Mohammed')} />
          </Field>
          <Field label={t('Username')} required error={formErrors.username} hint={t('Used to sign in')}>
            <input className="input" value={form.username} onChange={set('username')} placeholder={t('e.g. sara')} />
          </Field>
          <Field label={t('Password')} required error={formErrors.password} hint={t('At least 6 characters')}>
            <input className="input" type="password" value={form.password} onChange={set('password')} placeholder="••••••••" />
          </Field>
          <Field label={t('Title')} hint={t('e.g. Nurse')}>
            <input className="input" value={form.title} onChange={set('title')} placeholder={t('Job title')} />
          </Field>
          <Field label={t('Role')} required error={formErrors.role}>
            <select className="input" value={form.role} onChange={set('role')}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{t(ROLE_LABELS[r])}</option>
              ))}
            </select>
          </Field>
        </div>
      </Modal>
    </div>
  );
}
