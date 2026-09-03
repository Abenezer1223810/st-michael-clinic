import React, { useState, useMemo } from 'react';
import {
  Activity,
  Beaker,
  Search,
  FlaskConical,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Check,
  Tag,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import {
  LAB_CATEGORIES,
  LAB_TESTS,
  CLINICAL_PRESETS,
  calculateLabOrderBill,
} from '../../utils/labBilling';

const CATEGORY_THEMES = {
  Hematology: {
    border: 'border-rose-200 dark:border-rose-900/50',
    bgLight: 'bg-rose-50/70 dark:bg-rose-950/20',
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
    iconColor: 'text-rose-600 dark:text-rose-400',
    icon: Activity,
  },
  'Urinalysis & Microscopy': {
    border: 'border-amber-200 dark:border-amber-900/50',
    bgLight: 'bg-amber-50/70 dark:bg-amber-950/20',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    iconColor: 'text-amber-600 dark:text-amber-400',
    icon: Beaker,
  },
  'Stool Test': {
    border: 'border-emerald-200 dark:border-emerald-900/50',
    bgLight: 'bg-emerald-50/70 dark:bg-emerald-950/20',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    icon: Search,
  },
  Chemistry: {
    border: 'border-sky-200 dark:border-sky-900/50',
    bgLight: 'bg-sky-50/70 dark:bg-sky-950/20',
    badge: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
    iconColor: 'text-sky-600 dark:text-sky-400',
    icon: FlaskConical,
  },
  Serology: {
    border: 'border-purple-200 dark:border-purple-900/50',
    bgLight: 'bg-purple-50/70 dark:bg-purple-950/20',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    iconColor: 'text-purple-600 dark:text-purple-400',
    icon: ShieldCheck,
  },
};

export function LaboratoryOrderForm({
  selectedTests = [],
  onSelectionChange,
  onSubmit,
  isSubmitting = false,
  mode = 'order',
  results = {},
  onResultsChange,
  patient = null,
  showBilling = true,
  compact = false,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState('ALL');
  const [collapsedCategories, setCollapsedCategories] = useState({});

  const billingSummary = useMemo(() => {
    return calculateLabOrderBill(selectedTests);
  }, [selectedTests]);

  const filteredAndGrouped = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const groups = {};

    LAB_CATEGORIES.forEach((cat) => {
      groups[cat.name] = [];
    });

    LAB_TESTS.forEach((test) => {
      const matchSearch =
        !q ||
        test.name.toLowerCase().includes(q) ||
        test.code.toLowerCase().includes(q) ||
        (test.fullName && test.fullName.toLowerCase().includes(q)) ||
        test.category.toLowerCase().includes(q);

      const matchTab = activeCategoryTab === 'ALL' || test.category === activeCategoryTab;

      if (matchSearch && matchTab) {
        if (!groups[test.category]) groups[test.category] = [];
        groups[test.category].push(test);
      }
    });

    return groups;
  }, [searchTerm, activeCategoryTab]);

  const toggleTest = (testId) => {
    if (!onSelectionChange) return;
    if (selectedTests.includes(testId)) {
      onSelectionChange(selectedTests.filter((id) => id !== testId));
    } else {
      onSelectionChange([...selectedTests, testId]);
    }
  };

  const selectAllInCategory = (categoryName) => {
    if (!onSelectionChange) return;
    const catTests = LAB_TESTS.filter((t) => t.category === categoryName).map((t) => t.id);
    const combined = Array.from(new Set([...selectedTests, ...catTests]));
    onSelectionChange(combined);
  };

  const clearCategory = (categoryName) => {
    if (!onSelectionChange) return;
    const catTestIds = new Set(LAB_TESTS.filter((t) => t.category === categoryName).map((t) => t.id));
    onSelectionChange(selectedTests.filter((id) => !catTestIds.has(id)));
  };

  const applyPreset = (preset) => {
    if (!onSelectionChange) return;
    const presetTestIds = LAB_TESTS.filter((t) => preset.testCodes.includes(t.code)).map((t) => t.id);
    const combined = Array.from(new Set([...selectedTests, ...presetTestIds]));
    onSelectionChange(combined);
  };

  const toggleCategoryCollapse = (categoryName) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

  const handleResultChange = (testId, subKey, value) => {
    if (!onResultsChange) return;
    const current = results[testId] || {};
    if (subKey) {
      onResultsChange({
        ...results,
        [testId]: {
          ...current,
          subResults: {
            ...(current.subResults || {}),
            [subKey]: value,
          },
        },
      });
    } else {
      onResultsChange({
        ...results,
        [testId]: {
          ...current,
          value,
        },
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Search and Category Filter Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
              placeholder="Search tests by name, abbreviation (e.g., CBC, SGOT, T3, Widal), or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 text-xs md:pb-0">
            <button
              type="button"
              onClick={() => setActiveCategoryTab('ALL')}
              className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                activeCategoryTab === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-brand-600'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              All Tests ({LAB_TESTS.length})
            </button>
            {LAB_CATEGORIES.map((cat) => {
              const count = LAB_TESTS.filter((t) => t.category === cat.name).length;
              const isSelected = activeCategoryTab === cat.name;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategoryTab(cat.name)}
                  className={`rounded-lg px-2.5 py-1.5 font-medium transition ${
                    isSelected
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Clinical Presets */}
        <div className="mt-3.5 border-t border-slate-100 pt-3 dark:border-slate-800">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <Sparkles className="h-3 w-3 text-amber-500" /> Presets:
            </span>
            {CLINICAL_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-brand-950/40"
              >
                <span>{preset.name}</span>
                <span className="rounded bg-white px-1.5 py-0.2 text-[10px] font-semibold text-brand-700 ring-1 ring-slate-200/80 dark:bg-slate-900 dark:text-brand-300 dark:ring-slate-700">
                  {preset.badge}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className={`grid grid-cols-1 gap-6 ${showBilling ? 'lg:grid-cols-12' : ''}`}>
        {/* Left Column: Categorised Test Panels */}
        <div className={showBilling ? 'lg:col-span-8 space-y-5' : 'space-y-5'}>
          {LAB_CATEGORIES.map((cat) => {
            const testsInGroup = filteredAndGrouped[cat.name] || [];
            if (testsInGroup.length === 0) return null;

            const theme = CATEGORY_THEMES[cat.name] || CATEGORY_THEMES.Chemistry;
            const IconComponent = theme.icon;
            const isCollapsed = !!collapsedCategories[cat.name];
            const selectedCountInCat = testsInGroup.filter((t) => selectedTests.includes(t.id)).length;

            return (
              <div
                key={cat.id}
                className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all dark:bg-slate-900 ${theme.border}`}
              >
                <div
                  className={`flex cursor-pointer items-center justify-between px-5 py-3.5 ${theme.bgLight} border-b ${theme.border}`}
                  onClick={() => toggleCategoryCollapse(cat.name)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs dark:bg-slate-800 ${theme.iconColor}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800 dark:text-white">{cat.name}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${theme.badge}`}>
                          {testsInGroup.length} tests
                        </span>
                        {selectedCountInCat > 0 && (
                          <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-bold text-white">
                            {selectedCountInCat} selected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{cat.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => selectAllInCategory(cat.name)}
                      className="rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-xs ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700"
                    >
                      Select All
                    </button>
                    {selectedCountInCat > 0 && (
                      <button
                        type="button"
                        onClick={() => clearCategory(cat.name)}
                        className="rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-rose-600 shadow-xs ring-1 ring-rose-200 hover:bg-rose-50 dark:bg-slate-800 dark:text-rose-400 dark:ring-rose-900"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleCategoryCollapse(cat.name)}
                      className="ml-1 p-1 text-slate-400 hover:text-slate-600"
                      aria-label="Toggle category collapse"
                    >
                      {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="p-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {testsInGroup.map((test) => {
                        const isSelected = selectedTests.includes(test.id);

                        return (
                          <div
                            key={test.id}
                            onClick={() => toggleTest(test.id)}
                            className={`group relative flex cursor-pointer flex-col justify-between rounded-xl border p-3.5 transition-all ${
                              isSelected
                                ? 'border-brand-600 bg-brand-50/50 shadow-xs ring-2 ring-brand-500/20 dark:border-brand-500 dark:bg-brand-950/30'
                                : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2.5">
                                  <div
                                    className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border transition ${
                                      isSelected
                                        ? 'border-brand-600 bg-brand-600 text-white'
                                        : 'border-slate-300 bg-white group-hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800'
                                    }`}
                                  >
                                    {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                                  </div>
                                  <div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="font-bold text-slate-900 dark:text-white">
                                        {test.name}
                                      </span>
                                      {test.code && test.code !== test.name && (
                                        <span className="font-mono text-[11px] font-medium text-slate-400">
                                          ({test.code})
                                        </span>
                                      )}
                                    </div>
                                    {test.fullName && test.fullName !== test.name && (
                                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                        {test.fullName}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  {test.price > 0 ? (
                                    <span className="inline-flex items-center rounded-md bg-slate-900 px-2 py-0.5 text-xs font-bold text-white shadow-2xs dark:bg-slate-100 dark:text-slate-900">
                                      {test.price} ETB
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                      Included
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
                                {test.normalRange && (
                                  <div className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                    <span className="text-slate-400">Ref:</span>
                                    <span className="font-semibold">{test.normalRange}</span>
                                    {test.unit && test.unit !== 'Observation' && test.unit !== 'Panel' && (
                                      <span className="text-slate-500">{test.unit}</span>
                                    )}
                                  </div>
                                )}

                                {test.specimenType && (
                                  <span className="rounded bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500 ring-1 ring-slate-200/60 dark:bg-slate-800/60 dark:ring-slate-700">
                                    {test.specimenType}
                                  </span>
                                )}
                              </div>

                              {test.bundleNote && (
                                <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                                  <Tag className="h-3 w-3 shrink-0" />
                                  {test.bundleNote}
                                </p>
                              )}

                              {test.subParameters && test.subParameters.length > 0 && (
                                <div className="mt-2 rounded-lg bg-slate-50 p-2 text-[11px] text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
                                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                                    Includes {test.subParameters.length} parameters:
                                  </span>{' '}
                                  {test.subParameters.map((p) => p.name).join(', ')}
                                </div>
                              )}
                            </div>

                            {mode === 'entry' && isSelected && (
                              <div
                                className="mt-3.5 border-t border-brand-200/80 pt-3 dark:border-brand-800/60"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {test.subParameters && test.subParameters.length > 0 ? (
                                  <div className="space-y-2">
                                    <p className="text-xs font-bold text-brand-800 dark:text-brand-300">
                                      Enter Parameter Observations:
                                    </p>
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                      {test.subParameters.map((sub) => (
                                        <div key={sub.code} className="space-y-1">
                                          <div className="flex justify-between text-[11px]">
                                            <span className="font-semibold text-slate-700 dark:text-slate-300">{sub.name}</span>
                                            <span className="text-slate-400 font-mono">{sub.normalRange}</span>
                                          </div>
                                          {sub.options ? (
                                            <select
                                              className="w-full rounded-md border border-slate-300 bg-white p-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                                              value={results[test.id]?.subResults?.[sub.code] || ''}
                                              onChange={(e) => handleResultChange(test.id, sub.code, e.target.value)}
                                            >
                                              <option value="">-- Select --</option>
                                              {sub.options.map((opt) => (
                                                <option key={opt} value={opt}>{opt}</option>
                                              ))}
                                            </select>
                                          ) : (
                                            <input
                                              type={sub.inputType || 'text'}
                                              step="any"
                                              className="w-full rounded-md border border-slate-300 p-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                                              placeholder={`Result (${sub.unit})`}
                                              value={results[test.id]?.subResults?.[sub.code] || ''}
                                              onChange={(e) => handleResultChange(test.id, sub.code, e.target.value)}
                                            />
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                      <label className="font-bold text-brand-900 dark:text-brand-200">
                                        Clinical Result:
                                      </label>
                                      <span className="text-[11px] text-slate-500 font-mono">
                                        Range: {test.normalRange} {test.unit}
                                      </span>
                                    </div>

                                    {test.options && test.options.length > 0 ? (
                                      <select
                                        className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-800"
                                        value={results[test.id]?.value || ''}
                                        onChange={(e) => handleResultChange(test.id, null, e.target.value)}
                                      >
                                        <option value="">-- Select Observation --</option>
                                        {test.options.map((opt) => (
                                          <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                      </select>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <input
                                          type={test.inputType || 'text'}
                                          step="any"
                                          className="flex-1 rounded-lg border border-slate-300 bg-white p-2 text-sm font-bold text-slate-900 focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                          placeholder={`Enter ${test.name} value...`}
                                          value={results[test.id]?.value || ''}
                                          onChange={(e) => handleResultChange(test.id, null, e.target.value)}
                                        />
                                        {test.unit && (
                                          <span className="shrink-0 font-mono text-xs text-slate-500">
                                            {test.unit}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column: Order Summary & ETB Bill Calculation */}
        {showBilling && (
          <div className="lg:col-span-4">
            <div className="sticky top-20 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-brand-600" />
                  <h3 className="font-bold text-slate-800 dark:text-white">Lab Order Summary</h3>
                </div>
                <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-bold text-brand-800 dark:bg-brand-900/40 dark:text-brand-300">
                  {billingSummary.testCount} selected
                </span>
              </div>

              {patient && (
                <div className="rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60">
                  <p className="font-bold text-slate-800 dark:text-slate-100">{patient.fullName}</p>
                  <p className="text-slate-500">Card: {patient.id || patient.patientNumber} · {patient.gender}</p>
                </div>
              )}

              {billingSummary.itemizedPrices.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <Activity className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
                  <p>No tests selected yet.</p>
                  <p className="mt-1 text-[11px]">Click any test card or apply a preset above.</p>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs dark:divide-slate-800">
                  {billingSummary.itemizedPrices.map((item, idx) => (
                    <div key={item.id || idx} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-1.5">
                        {item.isBundle && (
                          <span className="rounded bg-amber-100 px-1 py-0.2 text-[9px] font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                            BUNDLE
                          </span>
                        )}
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {item.name}
                        </span>
                      </div>
                      <div className="text-right font-mono font-bold text-slate-900 dark:text-white">
                        {item.price.toFixed(2)} ETB
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {billingSummary.totalSavingsETB > 0 && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Tag className="h-4 w-4 text-emerald-600" />
                    Bundle Savings Applied: {billingSummary.totalSavingsETB.toFixed(2)} ETB
                  </div>
                  {billingSummary.appliedBundles.map((b) => (
                    <p key={b.bundleKey} className="mt-0.5 text-[11px] text-emerald-700 dark:text-emerald-400">
                      • {b.name}: {b.price} ETB (Saved {b.savings} ETB)
                    </p>
                  ))}
                </div>
              )}

              <div className="rounded-xl bg-slate-900 p-4 text-white dark:bg-slate-800">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Subtotal:</span>
                  <span>{billingSummary.originalSumETB.toFixed(2)} ETB</span>
                </div>
                {billingSummary.totalSavingsETB > 0 && (
                  <div className="flex justify-between text-xs text-emerald-400">
                    <span>Bundle Discount:</span>
                    <span>-{billingSummary.totalSavingsETB.toFixed(2)} ETB</span>
                  </div>
                )}
                <div className="mt-2 flex items-baseline justify-between border-t border-slate-700 pt-2">
                  <span className="text-sm font-semibold">Total Laboratory Fee:</span>
                  <span className="text-xl font-extrabold text-amber-400">
                    {billingSummary.totalETB.toFixed(2)} ETB
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                {onSubmit && (
                  <button
                    type="button"
                    onClick={() => onSubmit({ selectedTests, billing: billingSummary, results })}
                    disabled={isSubmitting || selectedTests.length === 0}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-bold text-white shadow-md hover:bg-brand-700 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Submitting Order...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Confirm & Request {billingSummary.testCount} Test{billingSummary.testCount !== 1 ? 's' : ''} ({billingSummary.totalETB.toFixed(0)} ETB)
                      </>
                    )}
                  </button>
                )}

                {selectedTests.length > 0 && onSelectionChange && (
                  <button
                    type="button"
                    onClick={() => onSelectionChange([])}
                    className="flex w-full items-center justify-center gap-1.5 py-1.5 text-xs text-slate-400 hover:text-slate-600"
                  >
                    <RotateCcw className="h-3 w-3" /> Reset all selections
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LaboratoryOrderForm;