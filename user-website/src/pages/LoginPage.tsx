import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, Mail, ArrowRight, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../api/services';
import { useAuth } from '../context/AuthContext';

type Step = 'email' | 'otp';

export default function LoginPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Countdown timer for resend cooldown
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await authApi.requestOtp(email.trim().toLowerCase());
      toast.success(`OTP sent to ${email}`);
      setStep('otp');
      setCooldown(60);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to send OTP';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return;
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(email.trim().toLowerCase(), otp.trim());
      const data = (res as any).data.data;
      login(data);
      toast.success(`Welcome back!`);
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Invalid OTP';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    try {
      await authApi.requestOtp(email.trim().toLowerCase());
      toast.success('New OTP sent');
      setCooldown(60);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-800 flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-dark-900 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle at 30% 70%, #c9a96e 0%, transparent 60%), radial-gradient(circle at 70% 30%, #c9a96e 0%, transparent 50%)'
          }}
        />
        <div className="relative z-10 text-center px-12">
          <Crown size={48} className="text-gold-500 mx-auto mb-6 animate-float" />
          <h1 className="font-display text-5xl text-cream font-bold leading-tight mb-4">
            Jew<span className="text-gold-500">é</span>lia
          </h1>
          <div className="gold-divider mb-6" />
          <p className="text-cream/50 font-serif text-xl italic leading-relaxed">
            "More than jewellery<br />— it's a feeling."
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <Crown size={22} className="text-gold-500" />
            <span className="font-display text-2xl text-cream tracking-widest">
              Jew<span className="text-gold-500">é</span>lia
            </span>
          </div>

          {step === 'email' ? (
            <>
              <p className="section-subtitle mb-2">Welcome Back</p>
              <h2 className="text-3xl font-display text-cream font-semibold mb-2">Sign In</h2>
              <p className="text-cream/50 text-sm font-sans mb-8">
                Enter your email to receive a one-time password.
              </p>

              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div>
                  <label className="block text-cream/60 text-xs font-sans uppercase tracking-widest mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/30" />
                    <input
                      id="email-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="input pl-10"
                    />
                  </div>
                </div>
                <button
                  id="send-otp-btn"
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center"
                >
                  {loading ? 'Sending OTP…' : 'Send OTP'}
                  {!loading && <ArrowRight size={16} />}
                </button>
              </form>
            </>
          ) : (
            <>
              <p className="section-subtitle mb-2">Verify OTP</p>
              <h2 className="text-3xl font-display text-cream font-semibold mb-2">Enter Code</h2>
              <p className="text-cream/50 text-sm font-sans mb-8">
                A 6-digit code was sent to <span className="text-gold-500">{email}</span>.
                It expires in 10 minutes.
              </p>

              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label className="block text-cream/60 text-xs font-sans uppercase tracking-widest mb-2">
                    One-Time Password
                  </label>
                  <input
                    id="otp-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • • • •"
                    required
                    className="input text-center tracking-[0.5em] text-xl"
                  />
                </div>
                <button
                  id="verify-otp-btn"
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="btn-primary w-full justify-center"
                >
                  {loading ? 'Verifying…' : 'Verify & Sign In'}
                </button>
              </form>

              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => setStep('email')}
                  className="text-cream/40 text-sm hover:text-cream transition-colors"
                >
                  ← Change email
                </button>
                <button
                  id="resend-otp-btn"
                  onClick={handleResend}
                  disabled={cooldown > 0 || loading}
                  className="flex items-center gap-1.5 text-sm text-gold-500/70 hover:text-gold-500
                             disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw size={13} />
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                </button>
              </div>
            </>
          )}

          <p className="mt-10 text-cream/30 text-xs font-sans text-center leading-relaxed">
            By signing in, you agree to our{' '}
            <Link to="/terms" className="text-gold-500/70 hover:text-gold-500">Terms</Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-gold-500/70 hover:text-gold-500">Privacy Policy</Link>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
