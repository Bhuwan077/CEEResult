import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, User, Key, AlertCircle, ArrowLeft, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function AdminLogin() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@CEE2024');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-slate-100/60">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#0f2942] text-white flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-6 h-6 text-blue-200" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Admin Controller Login</h1>
          <p className="text-xs text-slate-500">
            CEE Nepal Examination Results Management Portal
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
              <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl font-semibold text-white bg-[#0f2942] hover:bg-[#163b5f] focus:outline-none focus:ring-4 focus:ring-blue-500/20 shadow-md disabled:opacity-50 transition"
          >
            {submitting ? 'Authenticating...' : 'Sign In as Administrator'}
          </button>
        </form>

        {/* Development Seed Hint */}
        <div className="pt-4 border-t border-slate-100 p-3 rounded-xl bg-blue-50/60 text-[11px] text-blue-900 space-y-1">
          <div className="font-semibold flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-blue-700" /> Default Testing Credentials:
          </div>
          <p>Username: <code className="font-mono font-bold bg-white px-1 py-0.5 rounded border border-blue-200">admin</code></p>
          <p>Password: <code className="font-mono font-bold bg-white px-1 py-0.5 rounded border border-blue-200">Admin@CEE2024</code></p>
        </div>
      </div>
    </div>
  );
}
