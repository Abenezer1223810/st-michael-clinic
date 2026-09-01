import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Layers,
  FlaskConical,
  Pill,
  Scissors,
  Building,
  Plus,
  Trash2,
  Edit2,
  Check,
  Search,
} from 'lucide-react';
import { catalogService } from '../../services/catalogService';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/States';

const CATALOG_TABS = [
  { key: 'lab_tests', label: 'Lab Tests & Panels', icon: FlaskConical },
  { key: 'medicines', label: 'Medicines & Formulary', icon: Pill },
  { key: 'procedures', label: 'Procedure Types & Pricing', icon: Scissors },
  { key: 'departments', label: 'Clinical Departments', icon: Building },
];

export default function AdminCatalog() {
  const { t } = useTranslation();
  const toast = useToast();

  const [tab, setTab] = useState('lab_tests');
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Add modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    catalogService
      .catalog()
      .then((data) => setCatalog(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (tab === 'lab_tests') {
        await catalogService.createLabTest(formData);
        toast.success(t('Lab test added to clinic catalog.'));
      } else if (tab === 'medicines') {
        await catalogService.createMedicine(formData);
        toast.success(t('Medicine added to clinic formulary.'));
      } else if (tab === 'procedures') {
        await catalogService.createProcedureType(formData);
        toast.success(t('Procedure type added.'));
      } else if (tab === 'departments') {
        await catalogService.createDepartment(formData.name);
        toast.success(t('Department added.'));
      }
      setAddModalOpen(false);
      setFormData({});
      load();
    } catch (err) {
      toast.error(err.message || t('Operation failed.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (idOrName) => {
    if (!window.confirm(t('Are you sure you want to remove this item from the catalog?'))) return;
    try {
      if (tab === 'lab_tests') await catalogService.deleteLabTest(idOrName);
      else if (tab === 'medicines') await catalogService.deleteMedicine(idOrName);
      else if (tab === 'procedures') await catalogService.deleteProcedureType(idOrName);
      else if (tab === 'departments') await catalogService.deleteDepartment(idOrName);
      toast.success(t('Item removed from catalog.'));
      load();
    } catch (err) {
      toast.error(err.message || t('Delete failed.'));
    }
  };

  const q = search.trim().toLowerCase();

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('Master Catalog & Service Pricing')}
        subtitle={t('Manage laboratory test panels, pharmacy formulary, procedure pricing, and departments')}
        icon={Layers}
        actions={
          <button className="btn-primary" onClick={() => { setFormData({}); setAddModalOpen(true); }}>
            <Plus className="h-4 w-4" /> {t('Add New Item')}
          </button>
        }
      />

      <Tabs tabs={CATALOG_TABS.map((tItem) => ({ ...tItem, label: t(tItem.label) }))} active={tab} onChange={setTab} />

      {loading ? (
        <SkeletonTable rows={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <Card>
          <CardHeader
            title={t(CATALOG_TABS.find((tItem) => tItem.key === tab)?.label || 'Catalog')}
            subtitle={t('Live clinic pricing and parameters')}
            icon={Layers}
            actions={
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  className="input !py-1 !pl-8 text-xs"
                  placeholder={t('Filter items…')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            }
          />

          <div className="overflow-x-auto">
            {tab === 'lab_tests' && (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left dark:border-slate-800 dark:bg-slate-800/50">
                    <th className="th"># Code</th>
                    <th className="th">{t('Test Name')}</th>
                    <th className="th">{t('Diagnostic Group')}</th>
                    <th className="th">{t('Specimen Type')}</th>
                    <th className="th">{t('Unit')}</th>
                    <th className="th">{t('Reference Range')}</th>
                    <th className="th">{t('Price (ETB)')}</th>
                    <th className="th text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(catalog?.labTests || [])
                    .filter((tItem) => !q || tItem.name?.toLowerCase().includes(q) || tItem.code?.toLowerCase().includes(q))
                    .map((tItem) => (
                      <tr key={tItem.id}>
                        <td className="td font-mono font-bold text-brand-700 dark:text-brand-400">{tItem.code}</td>
                        <td className="td font-semibold text-slate-800 dark:text-slate-200">{tItem.name}</td>
                        <td className="td text-slate-600 dark:text-slate-400">{tItem.group}</td>
                        <td className="td text-slate-500">{tItem.specimenType}</td>
                        <td className="td text-slate-500">{tItem.unit || '—'}</td>
                        <td className="td text-slate-500">{tItem.referenceRange || '—'}</td>
                        <td className="td font-bold text-emerald-600 dark:text-emerald-400">{tItem.price} ETB</td>
                        <td className="td text-right">
                          <button
                            className="rounded p-1 text-slate-400 hover:text-rose-600"
                            onClick={() => handleDelete(tItem.id)}
                            title={t('Delete')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {tab === 'medicines' && (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left dark:border-slate-800 dark:bg-slate-800/50">
                    <th className="th">{t('Medicine Name')}</th>
                    <th className="th">{t('Form')}</th>
                    <th className="th">{t('Default Dosage')}</th>
                    <th className="th">{t('Route')}</th>
                    <th className="th">{t('Price (ETB)')}</th>
                    <th className="th text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(catalog?.medicines || [])
                    .filter((m) => !q || m.name?.toLowerCase().includes(q))
                    .map((m) => (
                      <tr key={m.id}>
                        <td className="td font-semibold text-slate-800 dark:text-slate-200">{m.name}</td>
                        <td className="td text-slate-600 dark:text-slate-400">{m.form}</td>
                        <td className="td text-slate-500">{m.defaultDosage}</td>
                        <td className="td text-slate-500">{m.defaultRoute}</td>
                        <td className="td font-bold text-emerald-600 dark:text-emerald-400">{m.price} ETB</td>
                        <td className="td text-right">
                          <button
                            className="rounded p-1 text-slate-400 hover:text-rose-600"
                            onClick={() => handleDelete(m.id)}
                            title={t('Delete')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {tab === 'procedures' && (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left dark:border-slate-800 dark:bg-slate-800/50">
                    <th className="th">{t('Procedure Name')}</th>
                    <th className="th">{t('Price (ETB)')}</th>
                    <th className="th text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(catalog?.procedureTypes || [])
                    .filter((p) => !q || p.name?.toLowerCase().includes(q))
                    .map((p) => (
                      <tr key={p.id}>
                        <td className="td font-semibold text-slate-800 dark:text-slate-200">{p.name}</td>
                        <td className="td font-bold text-emerald-600 dark:text-emerald-400">{p.price} ETB</td>
                        <td className="td text-right">
                          <button
                            className="rounded p-1 text-slate-400 hover:text-rose-600"
                            onClick={() => handleDelete(p.id)}
                            title={t('Delete')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {tab === 'departments' && (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left dark:border-slate-800 dark:bg-slate-800/50">
                    <th className="th">{t('Department Name')}</th>
                    <th className="th text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(catalog?.departments || [])
                    .filter((d) => !q || d.toLowerCase().includes(q))
                    .map((d) => (
                      <tr key={d}>
                        <td className="td font-semibold text-slate-800 dark:text-slate-200">{t(d)}</td>
                        <td className="td text-right">
                          <button
                            className="rounded p-1 text-slate-400 hover:text-rose-600"
                            onClick={() => handleDelete(d)}
                            title={t('Delete')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}

      {/* Add Item Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-base font-bold text-slate-900 dark:text-slate-100">
              {t('Add New')} {t(CATALOG_TABS.find((tItem) => tItem.key === tab)?.label || 'Item')}
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">{t('Name')} *</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input mt-1"
                />
              </div>

              {tab === 'lab_tests' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">{t('Test Code')} *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. HGB"
                        value={formData.code || ''}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className="input mt-1 uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">{t('Group / Category')}</label>
                      <input
                        type="text"
                        placeholder="e.g. Hematology"
                        value={formData.group || ''}
                        onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                        className="input mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">{t('Unit')}</label>
                      <input
                        type="text"
                        placeholder="e.g. g/dL"
                        value={formData.unit || ''}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="input mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">{t('Reference Range')}</label>
                      <input
                        type="text"
                        placeholder="e.g. 12.0 – 16.0"
                        value={formData.referenceRange || ''}
                        onChange={(e) => setFormData({ ...formData, referenceRange: e.target.value })}
                        className="input mt-1"
                      />
                    </div>
                  </div>
                </>
              )}

              {tab === 'medicines' && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">{t('Form')}</label>
                    <input
                      type="text"
                      placeholder="Tablet / Injection"
                      value={formData.form || ''}
                      onChange={(e) => setFormData({ ...formData, form: e.target.value })}
                      className="input mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">{t('Default Dosage')}</label>
                    <input
                      type="text"
                      placeholder="500 mg"
                      value={formData.defaultDosage || ''}
                      onChange={(e) => setFormData({ ...formData, defaultDosage: e.target.value })}
                      className="input mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">{t('Route')}</label>
                    <input
                      type="text"
                      placeholder="Oral / IM / IV"
                      value={formData.defaultRoute || ''}
                      onChange={(e) => setFormData({ ...formData, defaultRoute: e.target.value })}
                      className="input mt-1"
                    />
                  </div>
                </div>
              )}

              {tab !== 'departments' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">{t('Price (ETB)')} *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="input mt-1 font-bold text-emerald-600"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" className="btn-secondary" onClick={() => setAddModalOpen(false)} disabled={saving}>
                  {t('Cancel')}
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? t('Saving…') : t('Save Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

