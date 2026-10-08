import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Package, MapPin, Heart, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { customerApi, authApi } from '../api/services';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { isAuthenticated, logout } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [editing, setEditing] = useState(false);

  const { data: profile, isLoading } = useQuery({ queryKey: ['profile'], queryFn: customerApi.getProfile, enabled: isAuthenticated });

  useEffect(() => {
    if (profile) { setName((profile as any).full_name || ''); setPhone((profile as any).phone || ''); }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: () => customerApi.updateProfile({ full_name: name.trim() || undefined, phone: phone.trim() || undefined }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['profile'] }); toast.success('Profile updated'); setEditing(false); },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Could not update profile'),
  });

  const handleLogout = async () => { try { await authApi.logout(); } catch {} logout(); };

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-dark-800 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <User size={48} className="text-gold-500/20 mx-auto mb-6" />
        <h1 className="font-display text-3xl text-cream mb-3">My Account</h1>
        <p className="text-cream/40 font-sans text-sm mb-8">Sign in to view your profile.</p>
        <Link to="/login" className="btn-primary">Sign In</Link>
      </div>
    </div>
  );

  const p = profile as any;

  return (
    <div className="min-h-screen bg-dark-800 page-enter">
      <div className="bg-dark-900/60 border-b border-gold-500/10 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="section-subtitle mb-2">Account</p>
          <h1 className="section-title">My Profile</h1>
          <div className="gold-divider-left mt-3" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Sidebar */}
        <div className="space-y-2">
          {[
            { icon: User, label: 'Profile', to: '/profile', active: true },
            { icon: Package, label: 'My Orders', to: '/orders', active: false },
            { icon: MapPin, label: 'Addresses', to: '/addresses', active: false },
            { icon: Heart, label: 'Wishlist', to: '/wishlist', active: false },
          ].map(({ icon: Icon, label, to, active }) => (
            <Link key={label} to={to} className={`flex items-center gap-3 px-4 py-3 border transition-all duration-200 ${active ? 'border-gold-500 bg-gold-500/10 text-gold-500' : 'border-gold-500/10 text-cream/60 hover:border-gold-500/40 hover:text-cream'}`}>
              <Icon size={16} /><span className="font-sans text-sm">{label}</span>
            </Link>
          ))}
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 border border-red-500/20 text-red-400/70 hover:text-red-400 hover:border-red-400 transition-all duration-200 w-full mt-4">
            <LogOut size={16} /><span className="font-sans text-sm">Sign Out</span>
          </button>
        </div>

        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account info */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-cream font-semibold">Account Information</h2>
              {!editing && (
                <button onClick={() => setEditing(true)} className="btn-text text-xs">Edit Profile</button>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-4"><div className="skeleton h-4 w-1/2" /><div className="skeleton h-4 w-1/3" /></div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-gold-500/10">
                  <div className="w-14 h-14 bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                    <span className="font-display text-gold-500 text-xl">{(name || p?.email || 'A')[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-cream font-semibold">{name || <span className="text-cream/30 italic">No name set</span>}</p>
                    <p className="text-gold-500/60 text-sm">{p?.email}</p>
                  </div>
                </div>

                {editing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-cream/50 text-xs font-sans uppercase tracking-widest mb-2">Full Name</label>
                      <input type="text" value={name} onChange={e => setName(e.target.value)} className="input w-full" placeholder="Your full name" />
                    </div>
                    <div>
                      <label className="block text-cream/50 text-xs font-sans uppercase tracking-widest mb-2">Phone</label>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="input w-full" placeholder="+91 00000 00000" />
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="btn-primary">{updateMutation.isPending ? 'Saving…' : 'Save Changes'}</button>
                      <button onClick={() => { setEditing(false); setName(p?.full_name || ''); setPhone(p?.phone || ''); }} className="btn-ghost">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[{ label: 'Email', value: p?.email, verified: p?.is_email_verified }, { label: 'Phone', value: p?.phone || 'Not set' }, { label: 'Member since', value: p?.created_at ? new Date(p.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—' }].map(({ label, value, verified }) => (
                      <div key={label} className="flex justify-between items-center text-sm font-sans py-2 border-b border-gold-500/5">
                        <span className="text-cream/40">{label}</span>
                        <span className="text-cream/80 flex items-center gap-2">
                          {value}
                          {verified !== undefined && <span className={`text-[10px] ${verified ? 'text-emerald-400' : 'text-amber-400'}`}>{verified ? '✓ Verified' : 'Unverified'}</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-4">
            <Link to="/orders" className="card p-5 hover:border-gold-500/40 transition-colors group">
              <Package size={22} className="text-gold-500/50 group-hover:text-gold-500 mb-3 transition-colors" />
              <p className="text-cream font-serif text-sm">My Orders</p>
              <p className="text-cream/30 text-xs font-sans mt-0.5">Track & manage</p>
            </Link>
            <Link to="/addresses" className="card p-5 hover:border-gold-500/40 transition-colors group">
              <MapPin size={22} className="text-gold-500/50 group-hover:text-gold-500 mb-3 transition-colors" />
              <p className="text-cream font-serif text-sm">Addresses</p>
              <p className="text-cream/30 text-xs font-sans mt-0.5">Delivery locations</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}