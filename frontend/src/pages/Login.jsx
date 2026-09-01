import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HeartPulse,
  LogIn,
  ShieldCheck,
  Stethoscope,
  User,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  Activity,
  DatabaseBackup,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/ui/States';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

const FEATURES = [
  { label: 'Secure & Reliable', icon: ShieldCheck },
  { label: 'Role Based Access', icon: UserCheck },
  { label: 'Patient Centered Care', icon: HeartPulse },
  { label: 'Real-time Reports', icon: Activity },
  { label: 'Data Backup & Recovery', icon: DatabaseBackup },
];

const CORRIDOR_IMG = 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&q=80';
const NURSE_IMG = 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=900&q=80';

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const doLogin = async (u, p) => {
    setError('');
    setLoading(true);
    try {
      const user = await login(u, p);
      toast.success(t('Welcome, {{name}}', { name: user.name.split(' ')[0] }));
      navigate('/dashboard', { replace: true });
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError(t('Please enter your username and password.'));
      return;
    }
    doLogin(username.trim(), password);
  };

  const inputCls =
    'w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20';

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
        {/* ============ LEFT PANEL ============ */}
        <div className="relative hidden min-h-screen overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-800 lg:block">
          {/* Hospital corridor background */}
          <img src={CORRIDOR_IMG} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
          {/* Teal gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-brand-900/75 via-brand-800/65 to-brand-900/90" />
          {/* Secondary nurse, blurred in the background */}
          <img
            src={NURSE_IMG}
            alt=""
            className="absolute right-8 top-1/4 h-[55%] w-auto object-cover opacity-25 blur-md"
          />
          {/* Primary doctor icon in the foreground */}
          <div className="pointer-events-none absolute bottom-10 right-10 hidden lg:block">
            <div className="flex h-60 w-60 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white shadow-2xl shadow-brand-950/30 backdrop-blur-md xl:h-72 xl:w-72">
              <Stethoscope className="h-32 w-32 xl:h-40 xl:w-40" />
            </div>
          </div>
          {/* Bottom fade for depth */}
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-brand-900/85 to-transparent" />

          {/* Left panel content */}
          <div className="relative z-10 flex min-h-screen flex-col justify-between p-10 lg:p-12">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/25 backdrop-blur">
                <HeartPulse className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-bold text-white">{t('St. Michael Hospital')}</p>
                <p className="text-xs font-medium text-teal-100/80">{t('Healthcare Management System')}</p>
              </div>
            </div>

            {/* Heading + description + features */}
            <div>
              <h2 className="mb-4 max-w-md text-4xl font-bold leading-[1.15] text-white">
                {t('St. Michael Hospital Management System')}
              </h2>
              <p className="mb-8 max-w-md text-sm leading-relaxed text-teal-50/85">
                {t('A complete solution for managing patients, appointments, laboratory, pharmacy, billing and more.')}
              </p>
              <ul className="grid max-w-md grid-cols-2 gap-x-6 gap-y-3.5">
                {FEATURES.map((f) => (
                  <li key={f.label} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20">
                      <f.icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium text-white">{t(f.label)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Security card */}
            <div className="max-w-md rounded-2xl border border-white/20 bg-white/10 p-5 shadow-lg shadow-brand-950/20 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t('Your data is safe with us')}</p>
                  <p className="text-xs text-teal-50/80">{t('We comply with healthcare security standards.')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============ RIGHT PANEL ============ */}
        <div className="relative flex flex-col justify-center bg-white px-6 py-10 sm:px-10 lg:px-14 lg:py-12">
          <div className="absolute right-4 top-4">
            <LanguageSwitcher compact />
          </div>
          <div className="mx-auto w-full max-w-md">
            {/* Logo */}
            <div className="mb-8 flex justify-center">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-700 to-brand-500 text-white shadow-lg shadow-brand-600/25">
                  <HeartPulse className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <p className="text-base font-bold text-slate-900">{t('St. Michael Hospital')}</p>
                  <p className="text-xs font-medium text-brand-600">{t('Medium Clinic')}</p>
                </div>
              </div>
            </div>

            <h1 className="text-center text-3xl font-bold tracking-tight text-slate-900">{t('Welcome Back')}</h1>
            <p className="mt-2 text-center text-sm text-slate-500">{t('Sign in to continue to your account')}</p>

            {error && (
              <div className="mt-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {t(error)}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              {/* Username */}
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('Enter your username or email')}
                  autoComplete="username"
                  className={inputCls}
                  required
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('Enter your password')}
                  autoComplete="current-password"
                  className={`${inputCls} pr-11`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t('Hide password') : t('Show password')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Options row */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-slate-600">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 accent-brand-700"
                  />
                  {t('Remember me')}
                </label>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="font-medium text-brand-700 transition hover:text-brand-500"
                >
                  {t('Forgot password?')}
                </a>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-700 to-brand-500 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:shadow-xl hover:shadow-brand-600/30 disabled:opacity-60"
              >
                {loading ? (
                  <Spinner />
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    {t('Log In')}
                  </>
                )}
              </button>
            </form>

            <p className="mt-12 text-center text-xs text-slate-400">
              {t('Need help? Contact your system administrator.')}
            </p>
          </div>

          <div className="mt-8 text-center text-[11px] text-slate-300">
            {t('Powered By')} <span className="font-semibold">Gravity Technologies PLC</span>
          </div>
        </div>
      </div>
    </div>
  );
}
