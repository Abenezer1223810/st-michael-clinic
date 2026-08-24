import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useLocation, useNavigate, Outlet, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CalendarPlus,
  ListOrdered,
  Stethoscope,
  FlaskConical,
  Syringe,
  Pill,
  BarChart3,
  Settings,
  LogOut,
  HeartPulse,
  Menu,
  X,
  Sun,
  Moon,
  Contrast,
  Keyboard,
  ChevronRight,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useDemo } from '../../context/DemoContext';
import { DemoBanner } from '../demo/DemoBanner';
import { DemoPanel } from '../demo/DemoPanel';
import { ShortcutsModal } from './ShortcutsModal';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { ErrorBoundary } from '../ErrorBoundary';
import { StethoscopePattern } from '../ui/StethoscopePattern';
import { LanguageSwitcher } from '../LanguageSwitcher';

const NAV = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, roles: ['administrator', 'receptionist', 'doctor', 'laboratory', 'procedure'] },
  { label: 'Patients', to: '/patients', icon: Users, roles: ['administrator', 'receptionist', 'doctor', 'laboratory'] },
  {
    label: 'Reception',
    roles: ['administrator', 'receptionist'],
    children: [
      { label: 'New Patient', to: '/patients/new', icon: UserPlus },
      { label: 'Visits', to: '/visits', icon: CalendarPlus },
      { label: 'Queue', to: '/queue', icon: ListOrdered },
    ],
  },
  { label: 'OPD', to: '/opd', icon: Stethoscope, roles: ['administrator', 'doctor'] },
  { label: 'Laboratory', to: '/laboratory', icon: FlaskConical, roles: ['administrator', 'laboratory'] },
  { label: 'Procedures', to: '/procedures', icon: Syringe, roles: ['administrator', 'procedure'] },
  { label: 'Prescriptions', to: '/prescriptions', icon: Pill, roles: ['administrator', 'doctor'] },
  { label: 'Reports', to: '/reports', icon: BarChart3, roles: ['administrator', 'receptionist', 'doctor', 'laboratory', 'procedure'] },
  {
    label: 'Administration',
    roles: ['administrator'],
    children: [
      { label: 'Users & Roles', to: '/admin', icon: Users },
      { label: 'System', to: '/admin/system', icon: Settings },
    ],
  },
];

const ROLE_LABEL = {
  administrator: 'Administrator',
  receptionist: 'Receptionist',
  doctor: 'Doctor',
  laboratory: 'Laboratory Staff',
  procedure: 'Procedure Staff',
};

function SidebarContent({ user, logout, onNavigate, collapsed = false }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const light = theme === 'light';
  const items = NAV.map((item) => {
    if (item.children) {
      const allowedChildren = item.children.filter((c) => item.roles.includes(user.role));
      if (allowedChildren.length === 0) return null;
      return { ...item, children: allowedChildren };
    }
    return item.roles.includes(user.role) ? item : null;
  }).filter(Boolean);

  return (
    <div className="relative flex h-full flex-col">
      {/* Stethoscope pattern overlay */}
      <div className="pointer-events-none absolute inset-0">
        <StethoscopePattern stroke={light ? '#94a3b8' : 'white'} opacity={light ? 0.14 : 0.06} id="sidebar-pattern" />
      </div>

      {/* Decorative glows */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-brand-400/10 blur-3xl" />

      <div className={`relative flex items-center gap-3 border-b px-5 py-5 ${light ? 'border-slate-200' : 'border-white/10'} ${collapsed ? 'justify-center px-0' : ''}`}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-blue-600 text-white shadow-lg shadow-brand-500/40 ring-1 ring-white/20">
          <HeartPulse className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className={`truncate text-sm font-bold ${light ? 'text-slate-900' : 'text-white'}`}>{t('St. Michael')}</p>
            <p className={`truncate text-xs ${light ? 'text-brand-700' : 'text-cyan-200/70'}`}>{t('Medium Clinic')}</p>
          </div>
        )}
      </div>

      <nav className="relative flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) =>
          item.children ? (
            <div key={item.label}>
              {!collapsed && (
                <p className={`px-2 pb-1.5 pt-3 text-[10px] font-semibold uppercase tracking-widest ${light ? 'text-slate-400' : 'text-white/40'}`}>
                  {t(item.label)}
                </p>
              )}
              {item.children.map((child) => (
                <NavLink
                  key={child.to}
                  to={child.to}
                  onClick={onNavigate}
                  title={t(child.label)}
                  aria-label={t(child.label)}
                  className={({ isActive }) =>
                    `mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                      collapsed ? 'justify-center' : ''
                    } ${
                      isActive
                        ? 'bg-gradient-to-r from-brand-500/90 to-cyan-600/90 text-white shadow-lg shadow-brand-500/25'
                        : light
                          ? 'text-slate-600 hover:bg-brand-50 hover:text-slate-900'
                          : 'text-slate-200 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <child.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && t(child.label)}
                </NavLink>
              ))}
            </div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              title={t(item.label)}
              aria-label={t(item.label)}
              className={({ isActive }) =>
                `mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  collapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-500/90 to-cyan-600/90 text-white shadow-lg shadow-brand-500/25'
                    : light
                      ? 'text-slate-600 hover:bg-brand-50 hover:text-slate-900'
                      : 'text-slate-200 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && t(item.label)}
            </NavLink>
          )
        )}
      </nav>

      <div className={`relative border-t px-4 py-4 ${light ? 'border-slate-200' : 'border-white/10'}`}>
        <div className={`mb-3 flex items-center gap-3 rounded-xl p-2.5 ring-1 ${light ? 'bg-slate-100 ring-slate-200' : 'bg-white/5 ring-white/10'} ${collapsed ? 'justify-center p-1.5' : ''}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-blue-600 text-sm font-bold text-white shadow-md">
            {user.name.charAt(0)}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className={`truncate text-sm font-medium ${light ? 'text-slate-800' : 'text-white'}`}>{user.name}</p>
              <p className={`truncate text-xs ${light ? 'text-slate-500' : 'text-cyan-200/70'}`}>{t(ROLE_LABEL[user.role])}</p>
            </div>
          )}
        </div>
        <button
          onClick={logout}
          title={t('Logout')}
          aria-label={t('Logout')}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
            collapsed ? 'justify-center px-0' : ''
          } ${
            light ? 'text-slate-500 hover:bg-rose-50 hover:text-rose-600' : 'text-slate-300 hover:bg-rose-500/15 hover:text-rose-300'
          }`}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && t('Logout')}
        </button>
      </div>
    </div>
  );
}

export function AppLayout() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, toggle, contrast, toggleContrast } = useTheme();
  const demo = useDemo();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('stm_sidebar_collapsed') === 'true'
  );

  useEffect(() => {
    localStorage.setItem('stm_sidebar_collapsed', String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useKeyboardShortcuts({
    onShortcuts: () => setShortcutsOpen(true),
    onTheme: toggle,
    onContrast: toggleContrast,
    onNavigate: (to) => navigate(to),
  });

  const handleSidebarToggle = () => {
    if (window.innerWidth >= 1024) setCollapsed((c) => !c);
    else setMobileOpen(true);
  };

  if (!user) return null;

  const flatNav = NAV.flatMap((n) => (n.children ? n.children : [n]));

  const pageTitle =
    flatNav.find((n) => n.to && location.pathname.startsWith(n.to))?.label || 'Dashboard';

  const crumbs = [
    { label: 'Home', to: '/dashboard' },
    ...flatNav
      .filter((n) => n.to && location.pathname.startsWith(n.to))
      .map((n) => ({ label: n.label, to: n.to })),
  ];  if (location.pathname !== crumbs[crumbs.length - 1]?.to) {
    const tail = location.pathname.split('/').filter(Boolean).pop();
    crumbs.push({ label: decodeURIComponent(tail || ''), to: location.pathname });
  }

  return (
    <div className="min-h-screen bg-slate-100 transition-colors duration-300 dark:bg-slate-950">
      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden transition-[width] duration-300 lg:block ${
          collapsed ? 'w-16' : 'w-64'
        } ${
          theme === 'dark'
            ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-brand-950'
            : 'border-r border-slate-200 bg-gradient-to-b from-white via-slate-50 to-brand-50'
        }`}
      >
        <SidebarContent user={user} logout={logout} onNavigate={() => {}} collapsed={collapsed} />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setMobileOpen(false)} />
          <aside
            className={`absolute inset-y-0 left-0 w-64 shadow-2xl ${
              theme === 'dark'
                ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-brand-950'
                : 'bg-gradient-to-b from-white via-slate-50 to-brand-50'
            }`}
          >
            <button
              className={`absolute right-3 top-3 z-10 rounded-md p-1 ${
                theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent user={user} logout={logout} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className={`transition-[padding] duration-300 ${collapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/95 sm:px-6">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-brand-500 via-cyan-500 to-blue-600" />
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:border lg:border-slate-200 lg:bg-white lg:shadow-sm lg:dark:border-slate-700 lg:dark:bg-slate-800 lg:dark:text-slate-300"
              onClick={handleSidebarToggle}
              aria-label={collapsed ? t('Expand sidebar') : t('Collapse sidebar')}
              title={t('Toggle sidebar')}
            >
              <Menu className="h-5 w-5 lg:hidden" />
              {collapsed ? (
                <PanelLeftOpen className="hidden h-5 w-5 lg:block" />
              ) : (
                <PanelLeftClose className="hidden h-5 w-5 lg:block" />
              )}
            </button>
            <div>
              <h1 className="text-base font-bold text-slate-800 dark:text-slate-100">{t(pageTitle)}</h1>
              <p className="hidden text-xs text-slate-400 dark:text-slate-500 sm:block">
                {new Date().toLocaleDateString(i18n.language === 'am' ? 'am-ET' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <button
              onClick={() => setShortcutsOpen(true)}
              aria-label={t('Keyboard shortcuts')}
              title={t('Keyboard shortcuts (?)')}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-brand-500 dark:hover:text-brand-400"
            >
              <Keyboard className="h-4 w-4" />
            </button>
            <button
              onClick={toggleContrast}
              aria-label={contrast === 'high' ? t('Disable high contrast mode') : t('Enable high contrast mode')}
              title={contrast === 'high' ? t('High contrast on (h)') : t('High contrast off (h)')}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border shadow-sm transition dark:border-slate-700 dark:bg-slate-800 ${
                contrast === 'high'
                  ? 'border-brand-500 bg-brand-500 text-white dark:border-brand-400 dark:bg-brand-500'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-brand-300 hover:text-brand-600 dark:text-slate-300 dark:hover:border-brand-500 dark:hover:text-brand-400'
              }`}
            >
              <Contrast className="h-4 w-4" />
            </button>
            <button
              onClick={toggle}
              aria-label={theme === 'dark' ? t('Switch to light mode') : t('Switch to dark mode')}
              title={t('Toggle light / dark (t)')}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-brand-500 dark:hover:text-brand-400"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <span className="hidden rounded-full bg-gradient-to-r from-brand-500 to-cyan-600 px-3 py-1 text-xs font-semibold text-white shadow-sm shadow-brand-500/25 sm:inline-flex">
              {t(ROLE_LABEL[user.role])}
            </span>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {demo.active && <DemoBanner />}
          <nav aria-label={t('Breadcrumb')} className="mb-4 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="h-3 w-3" />}
                {i === 0 && <Home className="h-3 w-3" />}
                {i === crumbs.length - 1 ? (
                  <span className="font-semibold capitalize text-slate-600 dark:text-slate-300">{t(c.label)}</span>
                ) : (
                  <Link to={c.to} className="transition hover:text-brand-600 dark:hover:text-brand-400">
                    {t(c.label)}
                  </Link>
                )}
              </span>
            ))}
          </nav>
          <div key={location.pathname} className="animate-in fade-in">
            <ErrorBoundary key={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>

        <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-400 transition-colors duration-300 dark:border-slate-800 dark:text-slate-600">
          {t('Powered By')} <span className="font-semibold">Gravity Technologies PLC</span> · {t('St. Michael Medium Clinic')}
        </footer>
      </div>

      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      {demo.active && demo.panelOpen && <DemoPanel />}
    </div>
  );
}
