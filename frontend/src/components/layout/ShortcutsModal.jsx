import { Keyboard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';

const GROUPS = [
  {
    title: 'Navigation',
    items: [
      { keys: ['g', 'd'], label: 'Go to Dashboard' },
      { keys: ['g', 'p'], label: 'Go to Patients' },
      { keys: ['g', 'n'], label: 'New Patient' },
      { keys: ['g', 'v'], label: 'Go to Visits' },
      { keys: ['g', 'q'], label: 'Go to Queue' },
      { keys: ['g', 'o'], label: 'Go to OPD' },
      { keys: ['g', 'l'], label: 'Go to Laboratory' },
      { keys: ['g', 'c'], label: 'Go to Procedures' },
      { keys: ['g', 'r'], label: 'Go to Reports' },
      { keys: ['g', 'a'], label: 'Go to Administration' },
    ],
  },
  {
    title: 'Actions',
    items: [
      { keys: ['?'], label: 'Show this help panel' },
      { keys: ['t'], label: 'Toggle light / dark mode' },
      { keys: ['h'], label: 'Toggle high contrast mode' },
    ],
  },
];

export function ShortcutsModal({ open, onClose }) {
  const { t } = useTranslation();
  return (
    <Modal open={open} onClose={onClose} title={t('Keyboard Shortcuts')} subtitle={t('Move faster with the keyboard')} icon={Keyboard} size="md">
      <div className="space-y-5">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {t(group.title)}
            </h3>
            <ul className="space-y-1.5">
              {group.items.map((item) => (
                <li key={item.label} className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-600 dark:text-slate-300">{t(item.label)}</span>
                  <span className="flex items-center gap-1">
                    {item.keys.map((k, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <kbd className="rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                          {k}
                        </kbd>
                        {i < item.keys.length - 1 && <span className="text-xs text-slate-400">{t('then')}</span>}
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          {t('Shortcuts work anywhere in the app.')} {t('Press')} <kbd className="rounded border border-slate-300 px-1 text-[10px] font-semibold">g</kbd> {t('then a letter to navigate, or a single key for quick actions.')}
        </p>
      </div>
    </Modal>
  );
}
