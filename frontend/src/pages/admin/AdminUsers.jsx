import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Shield,
  UserPlus,
  RefreshCw,
  Ban,
  UserCheck,
  Trash2,
  UserRound,
  History,
  RotateCcw,
  Clock,
  ArchiveRestore,
  AlertTriangle,
} from 'lucide-react';
import { catalogService } from '../../services/catalogService';
import api from '../../services/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { Field } from '../../components/ui/Field';
import { Spinner } from '../../components/ui/States';
import { formatDateTime } from '../../utils/format';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

const ROLE_LABELS = {
  administrator: 'Administrator',
  receptionist: 'Receptionist',
  doctor: 'Doctor',
  laboratory: 'Laboratory Technician',
  procedure: 'Procedure Nurse',
  pharmacy: 'Lead Pharmacist',
};

const ROLE_TONES = {
  administrator: 'brand',
  doctor: 'emerald',
  receptionist: 'sky',
  laboratory: 'violet',
  procedure: 'amber',
  pharmacy: 'indigo',
};

const ROLES = Object.keys(ROLE_LABELS);

export default function AdminUsers() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    tabParam === 'recycle' ? 'recycle' : tabParam === 'audit' ? 'audit' : 'users'
  );

  useEffect(() => {
    if (tabParam && ['users', 'audit', 'recycle'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'users' ? {} : { tab });
  };
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [recycleItems, setRecycleItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(false);
  const [recycleLoading, setRecycleLoading] = useState(false);
  const [error, setError] = useState(null);

  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Deletion from active users
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Recycle bin operations
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [purgeTarget, setPurgeTarget] = useState(null);
  const [purgeLoading, setPurgeLoading] = useState(false);
  const [emptyRecycleOpen, setEmptyRecycleOpen] = useState(false);
  const [emptyLoading, setEmptyLoading] = useState(false);

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

  const loadAuditLogs = () => {
    setAuditLoading(true);
    api
      .get('/admin/audit-logs?limit=50')
      .then((d) => setAuditLogs(d.auditLogs || []))
      .catch((e) => toast.error(e.message))
      .finally(() => setAuditLoading(false));
  };

  const loadRecycleBin = () => {
    setRecycleLoading(true);
    catalogService
      .recycleBin()
      .then((d) => setRecycleItems(d.items || []))
      .catch((e) => toast.error(e.message))
      .finally(() => setRecycleLoading(false));
  };

  const refreshAll = () => {
    load();
    loadAuditLogs();
    loadRecycleBin();
  };

  useEffect(() => {
    refreshAll();
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
      refreshAll();
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
      refreshAll();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleBanToggle = async (u) => {
    try {
      await catalogService.updateUser(u.id, { banned: !u.banned });
      toast.success(u.banned ? t('{{name}} can sign in again.', { name: u.name }) : t('{{name}} has been suspended.', { name: u.name }));
      refreshAll();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const confirmDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const { message } = await catalogService.deleteUser(deleteTarget.id);
      toast.success(message || t('User moved to Recycle Bin.'));
      setDeleteTarget(null);
      refreshAll();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const confirmRestoreItem = async () => {
    if (!restoreTarget) return;
    setRestoreLoading(true);
    try {
      const { message } = await catalogService.restoreRecycleItem(restoreTarget.id);
      toast.success(message || t('Item restored successfully.'));
      setRestoreTarget(null);
      refreshAll();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setRestoreLoading(false);
    }
  };

  const confirmPurgeItem = async () => {
    if (!purgeTarget) return;
    setPurgeLoading(true);
    try {
      const { message } = await catalogService.purgeRecycleItem(purgeTarget.id);
      toast.success(message || t('Item permanently deleted.'));
      setPurgeTarget(null);
      refreshAll();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setPurgeLoading(false);
    }
  };

  const confirmEmptyRecycle = async () => {
    setEmptyLoading(true);
    try {
      const { message } = await catalogService.emptyRecycleBin();
      toast.success(message || t('Recycle bin emptied.'));
      setEmptyRecycleOpen(false);
      refreshAll();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setEmptyLoading(false);
    }
  };

  // Columns for Staff Accounts
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
            onClick={() => setDeleteTarget(u)}
            disabled={u.id === currentUser.id}
            title={u.id === currentUser.id ? t('You cannot delete your own account') : t('Delete user')}
            aria-label={t('Delete {{name}}', { name: u.name })}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-400 dark:hover:bg-rose-500/10 transition"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  // Columns for Audit Log
  const auditColumns = [
    {
      key: 'createdAt',
      header: t('Date & Time'),
      render: (l) => <span className="text-xs text-slate-500">{formatDateTime(l.createdAt)}</span>,
    },
    { key: 'userName', header: t('User'), render: (l) => <span className="font-semibold text-slate-800 dark:text-slate-200">{l.userName || 'System'}</span> },
    {
      key: 'action',
      header: t('Action'),
      render: (l) => (
        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {l.action}
        </span>
      ),
    },
    {
      key: 'entity',
      header: t('Target Entity'),
      render: (l) => (
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {l.entityType} ({l.entityId || '—'})
        </span>
      ),
    },
    {
      key: 'details',
      header: t('Details'),
      render: (l) => (
        <span className="truncate text-xs text-slate-500 dark:text-slate-400 max-w-xs inline-block">
          {typeof l.details === 'object' ? JSON.stringify(l.details) : String(l.details || '')}
        </span>
      ),
    },
  ];

  // Columns for Recycle Bin
  const recycleColumns = [
    {
      key: 'entityType',
      header: t('Type'),
      render: (r) => (
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {r.entityType}
        </span>
      ),
    },
    {
      key: 'title',
      header: t('Record Title / Details'),
      render: (r) => (
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-100">{r.title}</span>
          <p className="text-[11px] text-slate-400">ID: {r.entityId}</p>
        </div>
      ),
    },
    {
      key: 'deletedBy',
      header: t('Deleted By'),
      render: (r) => <span className="text-xs text-slate-600 dark:text-slate-300">{r.deletedBy || 'Admin'}</span>,
    },
    {
      key: 'deletedAt',
      header: t('Deleted Date'),
      render: (r) => <span className="text-xs text-slate-500">{formatDateTime(r.deletedAt)}</span>,
    },
    {
      key: 'retention',
      header: t('Auto-Purge'),
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          <Clock className="h-3.5 w-3.5" />
          {t('{{days}} days remaining', { days: r.daysRemaining ?? 30 })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (r) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRestoreTarget(r)}
            className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 transition"
            title={t('Restore Record')}
          >
            <RotateCcw className="h-3.5 w-3.5" /> {t('Restore')}
          </button>
          <button
            onClick={() => setPurgeTarget(r)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition"
            title={t('Permanently Delete')}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('System Users & Security')}
        subtitle={t('Staff accounts, role permissions, audit log stream, and 30-day recycle bin')}
        icon={Users}
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-secondary" onClick={refreshAll}>
              <RefreshCw className="h-4 w-4" /> {t('Refresh')}
            </button>
            <button className="btn-primary" onClick={openAdd}>
              <UserPlus className="h-4 w-4" /> {t('Add User')}
            </button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => handleTabChange('users')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'users'
              ? 'bg-brand-600 text-white shadow'
              : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300'
          }`}
        >
          <UserRound className="h-4 w-4" /> {t('Staff Accounts')} ({users.length})
        </button>
        <button
          onClick={() => handleTabChange('audit')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'audit'
              ? 'bg-brand-600 text-white shadow'
              : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300'
          }`}
        >
          <History className="h-4 w-4" /> {t('Audit Log')} ({auditLogs.length})
        </button>
        <button
          onClick={() => handleTabChange('recycle')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'recycle'
              ? 'bg-brand-600 text-white shadow'
              : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300'
          }`}
        >
          <ArchiveRestore className="h-4 w-4" /> {t('Recycle Bin')} ({recycleItems.length})
        </button>
      </div>

      {activeTab === 'users' && (
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
      )}

      {activeTab === 'audit' && (
        <Card>
          <CardHeader title={t('System Audit Log')} subtitle={t('Immutable log of clinical actions, logins, registrations, and updates')} icon={History} />
          <DataTable
            columns={auditColumns}
            rows={auditLogs}
            loading={auditLoading}
            error={null}
            onRetry={loadAuditLogs}
            emptyTitle={t('No audit records yet')}
            emptyDescription={t('System actions will appear here as users interact with the clinic system.')}
          />
        </Card>
      )}

      {activeTab === 'recycle' && (
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <ArchiveRestore className="h-5 w-5 text-amber-600" />
                {t('Recycle Bin & 30-Day Recovery')}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {t('Deleted staff accounts and records are retained for 30 days before being automatically purged.')}
              </p>
            </div>
            {recycleItems.length > 0 && (
              <button
                type="button"
                onClick={() => setEmptyRecycleOpen(true)}
                className="btn-secondary !text-rose-600 hover:!bg-rose-50 dark:hover:!bg-rose-950/40 text-xs shrink-0"
              >
                <Trash2 className="h-4 w-4" /> {t('Empty Recycle Bin')}
              </button>
            )}
          </div>
          <DataTable
            columns={recycleColumns}
            rows={recycleItems}
            loading={recycleLoading}
            error={null}
            onRetry={loadRecycleBin}
            emptyTitle={t('Recycle bin is empty')}
            emptyDescription={t('Deleted data will appear here and can be restored within 30 days.')}
          />
        </Card>
      )}

      {/* Add User Modal */}
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

      {/* Delete User to Recycle Bin Modal */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteUser}
        loading={deleteLoading}
        title={t('Move to Recycle Bin?')}
        message={
          deleteTarget
            ? t('Are you sure you want to delete {{name}} ({{username}})? It will be moved to the Recycle Bin and can be restored within 30 days.', {
                name: deleteTarget.name,
                username: deleteTarget.username,
              })
            : ''
        }
        confirmText={t('Yes, Delete')}
        tone="danger"
      />

      {/* Restore Item Confirmation */}
      <ConfirmDialog
        open={Boolean(restoreTarget)}
        onClose={() => setRestoreTarget(null)}
        onConfirm={confirmRestoreItem}
        loading={restoreLoading}
        title={t('Restore Record?')}
        message={
          restoreTarget
            ? t('Are you sure you want to restore "{{title}}"? It will become active immediately.', {
                title: restoreTarget.title,
              })
            : ''
        }
        confirmText={t('Yes, Restore')}
        tone="brand"
      />

      {/* Purge Item Confirmation */}
      <ConfirmDialog
        open={Boolean(purgeTarget)}
        onClose={() => setPurgeTarget(null)}
        onConfirm={confirmPurgeItem}
        loading={purgeLoading}
        title={t('Permanently Delete Record?')}
        message={
          purgeTarget
            ? t('Are you sure you want to permanently delete "{{title}}"? This cannot be recovered from the recycle bin.', {
                title: purgeTarget.title,
              })
            : ''
        }
        confirmText={t('Yes, Delete Permanently')}
        tone="danger"
      />

      {/* Empty Recycle Bin Confirmation */}
      <ConfirmDialog
        open={emptyRecycleOpen}
        onClose={() => setEmptyRecycleOpen(false)}
        onConfirm={confirmEmptyRecycle}
        loading={emptyLoading}
        title={t('Empty Recycle Bin?')}
        message={t('Are you sure you want to permanently delete all items in the Recycle Bin? This action cannot be undone.')}
        confirmText={t('Yes, Empty All')}
        tone="danger"
      />
    </div>
  );
}
