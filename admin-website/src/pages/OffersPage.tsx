import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, X, Power, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { offersApi, categoriesApi, productsApi } from '../api/services';

export default function OffersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: offers, isLoading } = useQuery({
    queryKey: ['admin-offers'],
    queryFn: () => offersApi.list()
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list()
  });

  // Fetch some products just for the dropdown, ideally this should be a search/autocomplete
  const { data: productsData } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => productsApi.list({ limit: 100 })
  });
  const products = productsData?.items || [];

  const defaultForm = {
    title: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    applies_to: 'all',
    category_id: '',
    product_id: '',
    is_active: true,
    starts_at: '',
    ends_at: ''
  };
  const [formData, setFormData] = useState(defaultForm);

  const addMutation = useMutation({
    mutationFn: (newOffer: any) => offersApi.create(newOffer),
    onSuccess: () => {
      toast.success('Offer created');
      queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Error creating offer')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => offersApi.update(id, data),
    onSuccess: () => {
      toast.success('Offer updated');
      queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Error updating offer')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => offersApi.delete(id),
    onSuccess: () => {
      toast.success('Offer deactivated');
      queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Error deactivating offer')
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(defaultForm);
  };

  const handleEdit = (offer: any) => {
    setFormData({
      title: offer.title || '',
      description: offer.description || '',
      discount_type: offer.discount_type || 'percentage',
      discount_value: offer.discount_value || '',
      applies_to: offer.applies_to || 'all',
      category_id: offer.category_id || '',
      product_id: offer.product_id || '',
      is_active: offer.is_active,
      starts_at: offer.starts_at ? offer.starts_at.slice(0, 16) : '',
      ends_at: offer.ends_at ? offer.ends_at.slice(0, 16) : ''
    });
    setEditingId(offer.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to deactivate this offer?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      ...formData,
      discount_value: Number(formData.discount_value),
    };
    if (payload.applies_to === 'category') payload.category_id = Number(payload.category_id);
    else payload.category_id = null;
    
    if (payload.applies_to === 'product') payload.product_id = Number(payload.product_id);
    else payload.product_id = null;
    
    // Formatting dates
    if (payload.starts_at) payload.starts_at = new Date(payload.starts_at).toISOString();
    else payload.starts_at = null;
    if (payload.ends_at) payload.ends_at = new Date(payload.ends_at).toISOString();
    else payload.ends_at = null;

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      addMutation.mutate(payload);
    }
  };

  const toggleStatus = (offer: any) => {
    updateMutation.mutate({ id: offer.id, data: { is_active: !offer.is_active } });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-cream">Offers</h1>
          <p className="text-cream/40 text-sm font-sans mt-0.5">Manage promotions and discounts</p>
        </div>
        <button onClick={() => { setEditingId(null); setFormData(defaultForm); setIsModalOpen(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Offer
        </button>
      </div>

      <div className="admin-card overflow-x-auto p-4">
        {isLoading ? (
          <p className="text-cream/40">Loading offers...</p>
        ) : (
          <table className="w-full text-left font-sans text-sm">
            <thead>
              <tr className="border-b border-gold-500/10 text-cream/40">
                <th className="pb-3 px-2 font-medium">Title</th>
                <th className="pb-3 px-2 font-medium">Discount</th>
                <th className="pb-3 px-2 font-medium">Applies To</th>
                <th className="pb-3 px-2 font-medium">Status</th>
                <th className="pb-3 px-2 font-medium">Valid Until</th>
                <th className="pb-3 px-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!offers || offers.length === 0 ? (
                <tr><td colSpan={6} className="py-6 text-center text-cream/40">No offers found.</td></tr>
              ) : (
                offers.map((o: any) => (
                  <tr key={o.id} className="border-b border-gold-500/5 hover:bg-dark-600/30">
                    <td className="py-3 px-2 text-cream font-medium">
                      <div className="flex flex-col">
                        <span>{o.title}</span>
                        {o.description && <span className="text-xs text-cream/40 truncate max-w-[200px]">{o.description}</span>}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-gold-400 font-mono">
                      {o.discount_type === 'percentage' ? `${o.discount_value}%` : `₹${o.discount_value}`}
                    </td>
                    <td className="py-3 px-2 text-cream/70 capitalize">
                      <div className="flex items-center gap-1.5">
                        <Tag size={12} className="text-gold-500/50" />
                        {o.applies_to}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => toggleStatus(o)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase transition-colors border ${
                          o.is_active 
                            ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10 hover:bg-emerald-400/20' 
                            : 'text-cream/30 border-cream/10 bg-cream/5 hover:bg-cream/10'
                        }`}
                      >
                        {o.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3 px-2 text-cream/50 text-xs">
                      {o.ends_at ? new Date(o.ends_at).toLocaleDateString() : 'No expiry'}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button onClick={() => handleEdit(o)} className="text-cream/40 hover:text-gold-400 p-1"><Edit size={14} /></button>
                      <button onClick={() => handleDelete(o.id)} className="text-cream/40 hover:text-red-400 p-1 ml-1" title="Deactivate"><Power size={14} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-dark-700 border border-gold-500/20 w-full max-w-2xl rounded p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-display text-cream">{editingId ? 'Edit Offer' : 'Add New Offer'}</h2>
              <button onClick={closeModal} className="text-cream/40 hover:text-cream"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4 font-sans text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-cream/60 mb-1">Offer Title</label>
                  <input required type="text" className="admin-input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                
                <div>
                  <label className="block text-cream/60 mb-1">Discount Type</label>
                  <select required className="admin-input" value={formData.discount_type} onChange={e => setFormData({...formData, discount_type: e.target.value})}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-cream/60 mb-1">Discount Value</label>
                  <input required type="number" step="0.01" className="admin-input" value={formData.discount_value} onChange={e => setFormData({...formData, discount_value: e.target.value})} />
                </div>

                <div>
                  <label className="block text-cream/60 mb-1">Applies To</label>
                  <select required className="admin-input" value={formData.applies_to} onChange={e => setFormData({...formData, applies_to: e.target.value})}>
                    <option value="all">All Products</option>
                    <option value="category">Specific Category</option>
                    <option value="product">Specific Product</option>
                  </select>
                </div>
                
                {formData.applies_to === 'category' && (
                  <div>
                    <label className="block text-cream/60 mb-1">Select Category</label>
                    <select required className="admin-input" value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})}>
                      <option value="">Select Category</option>
                      {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
                
                {formData.applies_to === 'product' && (
                  <div>
                    <label className="block text-cream/60 mb-1">Select Product</label>
                    <select required className="admin-input" value={formData.product_id} onChange={e => setFormData({...formData, product_id: e.target.value})}>
                      <option value="">Select Product</option>
                      {products?.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                    </select>
                  </div>
                )}
                {formData.applies_to === 'all' && <div />}

                <div>
                  <label className="block text-cream/60 mb-1">Starts At (Optional)</label>
                  <input type="datetime-local" className="admin-input" value={formData.starts_at} onChange={e => setFormData({...formData, starts_at: e.target.value})} />
                </div>
                <div>
                  <label className="block text-cream/60 mb-1">Ends At (Optional)</label>
                  <input type="datetime-local" className="admin-input" value={formData.ends_at} onChange={e => setFormData({...formData, ends_at: e.target.value})} />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-cream/60 mb-1">Description (Optional)</label>
                  <textarea className="admin-input" rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>

                <div className="md:col-span-2 flex items-center gap-2 mt-2">
                  <input 
                    type="checkbox" 
                    id="is_active" 
                    checked={formData.is_active} 
                    onChange={e => setFormData({...formData, is_active: e.target.checked})} 
                    className="w-4 h-4 accent-gold-500 bg-dark-900 border-gold-500/30 rounded"
                  />
                  <label htmlFor="is_active" className="text-cream/80 cursor-pointer">Offer is active</label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gold-500/10">
                <button type="button" onClick={closeModal} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={addMutation.isPending || updateMutation.isPending} className="btn-primary">
                  {addMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
