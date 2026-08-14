import { useState, useEffect } from 'react';
import { NavLink, useLocation, Outlet } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, roles: ['administrator', 'receptionist', 'doctor', 'laboratory', 'procedure'] },
  {
    label: 'Reception',
    roles: ['administrator', 'receptionist'],
    children: [
      { label: 'Patients', to: '/patients', icon: Users },
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

function SidebarContent({ user, logout, onNavigate }) {
  const items = NAV.map((item) => {
    if (item.children) {
      const allowedChildren = item.children.filter((c) => item.roles.includes(user.role));
      if (allowedChildren.length === 0) return null;
      return { ...item, children: allowedChildren };
    }
    return item;
  }).filter(Boolean);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
          <HeartPulse className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">St. Michael</p>
          <p className="truncate text-xs text-slate-400">Medium Clinic</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) =>
          item.children ? (
            <div key={item.label}>
              <p className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {item.label}
              </p>
              {item.children.map((child) => (
                <NavLink
                  key={child.to}
                  to={child.to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'bg-brand-500/15 text-brand-300'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <child.icon className="h-4 w-4" />
                  {child.label}
                </NavLink>
              ))}
            </div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-500/15 text-brand-300'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          )
        )}
      </nav>

      <div className="border-t border-slate-800 px-4 py-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-white">
            {user.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            <p className="truncate text-xs text-slate-400">{ROLE_LABEL[user.role]}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-rose-500/10 hover:text-rose-300"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (!user) return null;

  const pageTitle =
    NAV.flatMap((n) => (n.children ? n.children : [n]))
      .find((n) => n.to && location.pathname.startsWith(n.to))?.label || 'Dashboard';

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-slate-900 lg:block">
        <SidebarContent user={user} logout={logout} onNavigate={() => {}} />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-slate-900 shadow-2xl">
            <button
              className="absolute right-3 top-3 rounded-md p-1 text-slate-400 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent user={user} logout={logout} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-slate-800">{pageTitle}</h1>
              <p className="hidden text-xs text-slate-400 sm:block">
                {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 sm:inline-flex">
              {ROLE_LABEL[user.role]}
            </span>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div key={location.pathname} className="animate-in fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
