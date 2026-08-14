import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, LogIn, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/ui/States';

const DEMO_ACCOUNTS = [
  { username: 'admin', password: 'admin123', label: 'Administrator', dot: 'bg-violet-500' },
  { username: 'reception', password: 'reception123', label: 'Receptionist', dot: 'bg-sky-500' },
  { username: 'doctor', password: 'doctor123', label: 'Doctor', dot: 'bg-brand-500' },
  { username: 'lab', password: 'lab123', label: 'Laboratory Staff', dot: 'bg-amber-500' },
  { username: 'procedure', password: 'procedure123', label: 'Procedure Staff', dot: 'bg-rose-500' },
];

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const doLogin = async (u, p) => {
    setError('');
    setLoading(true);
    try {
      const user = await login(u, p);
      toast.success(`Welcome, ${user.name.split(' ')[0]}`);
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
    doLogin(username.trim(), password);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-800 via-brand-700 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/20 backdrop-blur">
            <HeartPulse className="h-9 w-9" />
          </div>
          <h1 className="text-2xl font-bold text-white">St. Michael Medium Clinic</h1>
          <p className="mt-1 text-sm text-brand-200">Clinic Management System</p>
        </div>

        <div className="card p-6">
          <div className="mb-5 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand-600" />
            <h2 className="text-sm font-semibold text-slate-700">Sign in to your account</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. reception"
                autoFocus
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Spinner /> : <LogIn className="h-4 w-4" />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6">
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
              Demo accounts — one-click sign in
            </p>
            <div className="grid grid-cols-1 gap-2">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.username}
                  onClick={() => doLogin(a.username, a.password)}
                  disabled={loading}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-sm transition hover:border-brand-400 hover:bg-brand-50 disabled:opacity-50"
                >
                  <span className="flex items-center gap-2.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${a.dot}`} />
                    <span className="font-medium text-slate-700">{a.label}</span>
                  </span>
                  <span className="text-xs text-slate-400">{a.username}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-brand-200">
          Demo build for company presentation · All data is fictional
        </p>
      </div>
    </div>
  );
}
