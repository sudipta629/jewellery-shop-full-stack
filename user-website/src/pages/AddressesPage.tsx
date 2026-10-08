import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Trash2, Edit3, Star, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { customerApi, type Address } from '../api/services';
import { useAuth } from '../context/AuthContext';

const EMPTY_FORM = { label: '', full_name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'India', is_default: false };

function AddressForm({ initial, onSave, onCancel }: {
  initial?: Partial<Address>;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const fields = [
    { key: 'label', label: 'Label', placeholder: 'Home / Office / Other', type: 'text', half: true },
    { key: 'full_name', label: 'Full Name', placeholder: 'Recipient name', type: 'text', half: true },
    { key: 'phone', label: 'Phone', placeholder: '+91 00000 00000', type: 'tel', half: true },
    { key: 'line1', label: 'Address Line 1', placeholder: 'House no, street, area', type: 'text', half: false },
    { key: 'line2', label: 'Address Line 2', placeholder: 'Landmark (optional)', type: 'text', half: false },
    { key: 'city', label: 'City', placeholder: 'City', type: 'text', half: true },
    { key: 'state', label: 'State', placeholder: 'State', type: 'text', half: true },
    { key: 'pincode', label: 'Pincode', placeholder: '000000', type: 'text', half: true },
    { key: 'country', label: 'Country', placeholder: 'Country', type: 'text', half: true },
  ];

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="card p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {fields.map(f => (
          <div key={f.key} className={f.half ? '' : 'sm:col-span-2'}>
            <label className="block text-cream/50 text-xs font-sans uppercase tracking-widest mb-1.5">{f.label}</label>
            <input type={f.type} value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} className="input w-full" />
          </div>
        ))}
      </div>
      <label className="flex items-center gap-3 cursor-pointer mb-6">
        <div onClick={() => set('is_default', !form.is_default)} className={`w-5 h-5 border flex items-center justify-center transition-all ${form.is_default ? 'bg-gold-500 border-gold-500' : 'border-gold-500/30'}`}>
          {form.is_default && <X size={10} className="text-dark-800" strokeWidth={3} />}
        </div>
        <span className="text-cream/60 text-sm font-sans">Set as default address</span>
      </label>
      <div className="flex gap-3">
        <button onClick={() => onSave(form)} className="btn-primary">Save Address</button>
        <button onClick={onCancel} className="btn-ghost">Cancel</button>
      </div>
    </motion.div>
  );
}

export default function AddressesPage() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: addresses = [], isLoading } = useQuery({ queryKey: ['addresses'], queryFn: customerApi.getAddresses, enabled: isAuthenticated });

  const createMutation = useMutation({
    mutationFn: (data: any) => customerApi.createAddress(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['addresses'] }); setShowAddForm(false); toast.success('Address added'); },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Could not add address'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => customerApi.updateAddress(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['addresses'] }); setEditingId(null); toast.success('Address updated'); },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Could not update address'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => customerApi.deleteAddress(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['addresses'] }); toast.success('Address removed'); },
    onError: () => toast.error('Could not remove address'),
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: number) => customerApi.setDefaultAddress(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['addresses'] }); toast.success('Default address updated'); },
  });

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-dark-800 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <MapPin size={48} className="text-gold-500/20 mx-auto mb-6" />
        <h1 className="font-display text-3xl text-cream mb-3">My Addresses</h1>
        <p className="text-cream/40 font-sans text-sm mb-8">Sign in to manage your delivery addresses.</p>
        <Link to="/login" className="btn-primary">Sign In</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-800 page-enter">
      <div className="bg-dark-900/60 border-b border-gold-500/10 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="section-subtitle mb-2">Account</p>
          <h1 className="section-title">My Addresses</h1>
          <div className="gold-divider-left mt-3" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <p className="text-cream/40 text-sm font-sans">{addresses.length} saved address{addresses.length !== 1 ? 'es' : ''}</p>
          {!showAddForm && (
            <button onClick={() => setShowAddForm(true)} className="btn-primary text-sm"><Plus size={15} /> Add New Address</button>
          )}
        </div>

        <AnimatePresence>
          {showAddForm && <AddressForm onSave={(data) => createMutation.mutate(data)} onCancel={() => setShowAddForm(false)} />}
        </AnimatePresence>

        {isLoading ? (
          <div className="space-y-4 mt-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card p-5"><div className="skeleton h-4 w-1/2 mb-3" /><div className="skeleton h-3 w-3/4" /></div>)}</div>
        ) : addresses.length === 0 && !showAddForm ? (
          <div className="text-center py-16">
            <MapPin size={40} className="text-gold-500/20 mx-auto mb-4" />
            <p className="text-cream/40 font-sans text-sm">No saved addresses yet.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <AnimatePresence>
              {addresses.map(addr => (
                <motion.div key={addr.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  {editingId === addr.id ? (
                    <AddressForm initial={addr} onSave={(data) => updateMutation.mutate({ id: addr.id, data })} onCancel={() => setEditingId(null)} />
                  ) : (
                    <div className={`card p-5 transition-colors ${addr.is_default ? 'border-gold-500/40' : ''}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {addr.label && <span className="text-cream/40 text-[10px] font-sans uppercase tracking-widest border border-cream/10 px-2 py-0.5">{addr.label}</span>}
                            {addr.is_default && <span className="badge-gold text-[10px]"><Star size={10} className="inline" /> Default</span>}
                            <p className="text-cream font-semibold text-sm">{addr.full_name}</p>
                          </div>
                          <p className="text-cream/60 text-xs font-sans leading-relaxed">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                          <p className="text-cream/60 text-xs font-sans">{addr.city}, {addr.state} – {addr.pincode}, {addr.country}</p>
                          <p className="text-gold-500/60 text-xs font-sans mt-1.5">📞 {addr.phone}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!addr.is_default && (
                            <button onClick={() => setDefaultMutation.mutate(addr.id)} className="text-cream/30 hover:text-gold-500 transition-colors" title="Set as default">
                              <Star size={15} />
                            </button>
                          )}
                          <button onClick={() => setEditingId(addr.id)} className="text-cream/30 hover:text-gold-500 transition-colors">
                            <Edit3 size={15} />
                          </button>
                          <button onClick={() => deleteMutation.mutate(addr.id)} className="text-cream/30 hover:text-red-400 transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}