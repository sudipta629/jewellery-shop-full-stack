import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, X, Upload, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { productsApi, categoriesApi, uploadApi, inventoryApi } from '../api/services';

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const { data, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => productsApi.list()
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list()
  });

  const products = data?.items || [];

  const defaultForm = {
    name: '', sku: '', category_id: '', metal_type: 'gold', purity: '22K',
    gross_weight: '', net_weight: '', description: '', images: [] as string[],
    stock: '0'
  };
  const [formData, setFormData] = useState(defaultForm);
  const [stockEditItem, setStockEditItem] = useState<{id: number; name: string; stock: number} | null>(null);
  const [quickStock, setQuickStock] = useState('');

  const addMutation = useMutation({
    mutationFn: (newProd: any) => productsApi.create(newProd),
    onSuccess: () => {
      toast.success('Product created');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Error creating product')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => productsApi.update(id, data),
    onSuccess: () => {
      toast.success('Product updated');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Error updating product')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.archive(id),
    onSuccess: () => {
      toast.success('Product deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Error deleting product')
  });

  const stockMutation = useMutation({
    mutationFn: ({ id, qty }: { id: number; qty: number }) =>
      inventoryApi.setQuantity(id, qty, 'Updated from Products page'),
    onSuccess: (_, vars) => {
      toast.success(`Stock set to ${vars.qty}!`);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setStockEditItem(null);
      setQuickStock('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update stock'),
  });

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingId(null);
    setFormData(defaultForm);
  };

  const handleEdit = (product: any) => {
    setFormData({
      name: product.name || '',
      sku: product.sku || '',
      category_id: product.category_id || '',
      metal_type: product.metal_type || 'gold',
      purity: product.purity || '',
      gross_weight: product.gross_weight || '',
      net_weight: product.net_weight || '',
      description: product.description || '',
      images: product.images ? product.images.map((img: any) => img.url) : [],
      stock: String(product.stock ?? 0),
    });
    setEditingId(product.id);
    setIsAddModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);
    try {
      const file = e.target.files[0];
      const res = await uploadApi.image(file);
      setFormData(prev => ({ ...prev, images: [...prev.images, res.url] }));
      toast.success('Image uploaded');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => {
      const newImages = [...prev.images];
      newImages.splice(index, 1);
      return { ...prev, images: newImages };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      category_id: Number(formData.category_id),
      gross_weight: Number(formData.gross_weight),
      net_weight: Number(formData.net_weight),
      stock: Number(formData.stock),
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      addMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-cream">Products</h1>
          <p className="text-cream/40 text-sm font-sans mt-0.5">Manage your jewellery catalog</p>
        </div>
        <button onClick={() => { setEditingId(null); setFormData(defaultForm); setIsAddModalOpen(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="admin-card overflow-x-auto p-4">
        {isLoading ? (
          <p className="text-cream/40">Loading products...</p>
        ) : (
          <table className="w-full text-left font-sans text-sm">
            <thead>
              <tr className="border-b border-gold-500/10 text-cream/40">
                <th className="pb-3 px-2 font-medium">Image</th>
                <th className="pb-3 px-2 font-medium">SKU</th>
                <th className="pb-3 px-2 font-medium">Name</th>
                <th className="pb-3 px-2 font-medium">Metal</th>
                <th className="pb-3 px-2 font-medium">Category</th>
                <th className="pb-3 px-2 font-medium">Stock</th>
                <th className="pb-3 px-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-cream/40">No products found.</td></tr>}
              {products.map((p: any) => (
                <tr key={p.id} className="border-b border-gold-500/5 hover:bg-dark-600/30">
                  <td className="py-2 px-2">
                    {p.images && p.images.length > 0 ? (
                      <img src={p.images[0].url} alt={p.name} className="w-10 h-10 object-cover rounded border border-gold-500/20" />
                    ) : (
                      <div className="w-10 h-10 bg-dark-600 rounded flex items-center justify-center text-cream/20 text-xs">No img</div>
                    )}
                  </td>
                  <td className="py-3 px-2 text-gold-400 font-mono text-xs">{p.sku}</td>
                  <td className="py-3 px-2 text-cream">{p.name}</td>
                  <td className="py-3 px-2 text-cream/70">{p.metal_type} {p.purity}</td>
                  <td className="py-3 px-2 text-cream/70">{p.category?.name}</td>
                  <td className="py-3 px-2">
                    <button
                      onClick={() => { setStockEditItem({ id: p.id, name: p.name, stock: p.stock ?? 0 }); setQuickStock(String(p.stock ?? 0)); }}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold transition-all border ${
                        (p.stock ?? 0) === 0
                          ? 'text-red-400 border-red-400/20 bg-red-400/8 hover:bg-red-400/15'
                          : (p.stock ?? 0) <= 5
                          ? 'text-amber-400 border-amber-400/20 bg-amber-400/8 hover:bg-amber-400/15'
                          : 'text-emerald-400 border-emerald-400/20 bg-emerald-400/8 hover:bg-emerald-400/15'
                      }`}
                      title="Click to edit stock"
                    >
                      <Package size={11} />
                      {p.stock ?? 0}
                    </button>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <button onClick={() => handleEdit(p)} className="text-cream/40 hover:text-gold-400 p-1"><Edit size={14} /></button>
                    <button onClick={() => handleDelete(p.id)} className="text-cream/40 hover:text-red-400 p-1 ml-2"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-dark-700 border border-gold-500/20 w-full max-w-2xl rounded p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-display text-cream">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={closeModal} className="text-cream/40 hover:text-cream"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4 font-sans text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-cream/60 mb-1">Product Name</label>
                  <input required type="text" className="admin-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-cream/60 mb-1">SKU</label>
                  <input required type="text" className="admin-input" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                </div>
                <div>
                  <label className="block text-cream/60 mb-1">Category</label>
                  <select required className="admin-input" value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})}>
                    <option value="">Select Category</option>
                    {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-cream/60 mb-1">Metal Type</label>
                  <select required className="admin-input" value={formData.metal_type} onChange={e => setFormData({...formData, metal_type: e.target.value})}>
                    <option value="gold">Gold</option>
                    <option value="silver">Silver</option>
                    <option value="platinum">Platinum</option>
                  </select>
                </div>
                <div>
                  <label className="block text-cream/60 mb-1">Purity</label>
                  <input required type="text" className="admin-input" placeholder="e.g. 22K" value={formData.purity} onChange={e => setFormData({...formData, purity: e.target.value})} />
                </div>
                <div>
                  <label className="block text-cream/60 mb-1">Gross Wt. (g)</label>
                  <input required type="number" step="0.01" className="admin-input" value={formData.gross_weight} onChange={e => setFormData({...formData, gross_weight: e.target.value})} />
                </div>
                <div>
                  <label className="block text-cream/60 mb-1">Net Wt. (g)</label>
                  <input required type="number" step="0.01" className="admin-input" value={formData.net_weight} onChange={e => setFormData({...formData, net_weight: e.target.value})} />
                </div>
              </div>

              {/* Stock quantity (only for new product) */}
              {!editingId && (
                <div>
                  <label className="block text-cream/60 mb-1">Initial Stock Quantity</label>
                  <input type="number" min="0" className="admin-input" value={formData.stock}
                    onChange={e => setFormData({...formData, stock: e.target.value})} placeholder="0" />
                </div>
              )}

              <div>
                <label className="block text-cream/60 mb-2">Product Images</label>
                <div className="flex flex-wrap gap-3 mb-3">
                  {formData.images.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt="upload" className="w-16 h-16 object-cover rounded border border-gold-500/30" />
                      <button type="button" onClick={() => removeImage(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <label className="w-16 h-16 flex flex-col items-center justify-center border border-dashed border-gold-500/30 rounded cursor-pointer hover:bg-gold-500/5 transition-colors">
                    <Upload size={16} className="text-cream/40 mb-1" />
                    <span className="text-[9px] text-cream/40">{isUploading ? '...' : 'Upload'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-cream/60 mb-1">Description</label>
                <textarea className="admin-input" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gold-500/10">
                <button type="button" onClick={closeModal} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={addMutation.isPending || updateMutation.isPending || isUploading} className="btn-primary">
                  {addMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Quick Stock Edit Modal ─── */}
      {stockEditItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-dark-800 border border-gold-500/20 rounded-sm w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gold-500/10">
              <div>
                <h3 className="text-base font-display text-cream">Update Stock</h3>
                <p className="text-xs text-cream/40 mt-0.5 max-w-[220px] truncate">{stockEditItem.name}</p>
              </div>
              <button onClick={() => setStockEditItem(null)} className="text-cream/30 hover:text-cream transition-colors">
                <X size={17} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="flex items-center gap-4 p-3 bg-gold-500/5 border border-gold-500/10 rounded-sm">
                <Package size={18} className="text-gold-500" />
                <div>
                  <p className="text-[10px] text-cream/35 uppercase tracking-wider">Current Stock</p>
                  <p className={`text-2xl font-bold tabular-nums ${
                    stockEditItem.stock === 0 ? 'text-red-400' : stockEditItem.stock <= 5 ? 'text-amber-400' : 'text-cream'
                  }`}>{stockEditItem.stock}</p>
                </div>
              </div>
              <div>
                <label className="text-xs text-cream/45 mb-1.5 block">Set new quantity *</label>
                <input
                  type="number"
                  min="0"
                  autoFocus
                  value={quickStock}
                  onChange={(e) => setQuickStock(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const qty = parseInt(quickStock);
                      if (!isNaN(qty) && qty >= 0) stockMutation.mutate({ id: stockEditItem.id, qty });
                    }
                  }}
                  placeholder="e.g. 20"
                  className="admin-input text-lg font-semibold"
                />
              </div>
              {quickStock !== '' && !isNaN(parseInt(quickStock)) && (
                <div className="flex items-center gap-2 p-2 rounded-sm text-xs bg-purple-400/8 border border-purple-400/15 text-purple-200">
                  <Package size={11} />
                  {stockEditItem.stock} → <strong className="text-white">{parseInt(quickStock)}</strong>
                  <span className="text-cream/30 ml-1">
                    ({parseInt(quickStock) - stockEditItem.stock >= 0 ? '+' : ''}{parseInt(quickStock) - stockEditItem.stock})
                  </span>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStockEditItem(null)} className="admin-btn-ghost flex-1 justify-center">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const qty = parseInt(quickStock);
                    if (isNaN(qty) || qty < 0) return toast.error('Enter a valid quantity.');
                    stockMutation.mutate({ id: stockEditItem.id, qty });
                  }}
                  disabled={stockMutation.isPending || quickStock === '' || isNaN(parseInt(quickStock)) || parseInt(quickStock) < 0}
                  className="admin-btn flex-1 justify-center"
                >
                  {stockMutation.isPending ? 'Saving…' : 'Update Stock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
