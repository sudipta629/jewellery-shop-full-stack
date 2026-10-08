import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAuthApi } from '../api/services';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await adminAuthApi.login(email.trim().toLowerCase(), password);
      const data = (res as any).data.data;
      login(data);
      toast.success(`Welcome, ${data.admin.full_name}!`);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-800 flex items-center justify-center px-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, #c9a96e 0%, transparent 50%), radial-gradient(circle at 75% 75%, #c9a96e 0%, transparent 50%)' }}
      />

      <div className="relative w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-10">
          <Crown size={36} className="text-gold-500 mx-auto mb-3" />
          <h1 className="font-display text-3xl text-cream tracking-widest">
            Jew<span className="text-gold-500">é</span>lia
          </h1>
          <p className="text-cream/30 text-xs font-sans mt-1 uppercase tracking-[0.2em]">
            Admin Panel
          </p>
        </div>

        {/* Card */}
        <div className="admin-card p-8">
          <h2 className="text-xl font-serif text-cream mb-1">Sign In</h2>
          <p className="text-cream/40 text-xs font-sans mb-6">
            Admin access only. Unauthorized access is prohibited.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-cream/50 text-[10px] uppercase tracking-widest mb-1.5 font-sans">
                Email Address
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className="admin-input"
              />
            </div>
            <div>
              <label className="block text-cream/50 text-[10px] uppercase tracking-widest mb-1.5 font-sans">
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="admin-input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/30 hover:text-cream/60"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button
              id="admin-login-btn"
              type="submit"
              disabled={loading}
              className="admin-btn w-full justify-center mt-2"
            >
              {loading ? 'Signing in…' : 'Sign In to Admin Panel'}
            </button>
          </form>
        </div>

        <p className="text-center text-cream/20 text-xs mt-6 font-sans">
          Customer website?{' '}
          <a href={import.meta.env.VITE_USER_WEBSITE_URL ?? 'http://localhost:5173'} className="text-gold-500/50 hover:text-gold-500">
            Visit storefront →
          </a>
        </p>
      </div>
    </div>
  );
}
