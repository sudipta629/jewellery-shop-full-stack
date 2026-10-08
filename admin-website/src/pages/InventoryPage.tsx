import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../api/services';
import toast from 'react-hot-toast';
import {
  Package, AlertTriangle, Search, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, History, X, RefreshCw, Edit3, Hash,
  CheckCircle, AlertCircle
} from 'lucide-react';

interface InventoryItem {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  quantity: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
  updated_at: string;
}

interface HistoryEntry {
  id: number;
  action: string;
  quantity_change: number;
  quantity_after: number;
  reason: string | null;
  performed_by: string | null;
  created_at: string;
}

type Tab = 'stock_in' | 'stock_out' | 'set';

export default function InventoryPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [outOfStockOnly, setOutOfStockOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('stock_in');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [setQty, setSetQty] = useState('');
  const [setReason, setSetReason] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['inventory', page, search, lowStockOnly, outOfStockOnly],
    queryFn: () =>
      inventoryApi.list({
        page,
        per_page: 15,
        q: search || undefined,
        low_stock: lowStockOnly ? 'true' : undefined,
        out_of_stock: outOfStockOnly ? 'true' : undefined,
      }),
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['inventory-history', historyItem?.product_id],
    queryFn: () => inventoryApi.history(historyItem!.product_id),
    enabled: !!historyItem,
  });

  const openModal = (item: InventoryItem) => {
    setSelectedItem(item);
    // If out of stock, default to 'set' tab for convenience
    setActiveTab(item.quantity === 0 ? 'set' : 'stock_in');
    setAdjustQty('');
    setAdjustReason('');
    setSetQty(String(item.quantity));
    setSetReason('');
  };

  const adjustMutation = useMutation({
    mutationFn: ({ product_id, payload }: { product_id: number; payload: any }) =>
      inventoryApi.adjust(product_id, payload),
    onSuccess: (updated: any) => {
      toast.success(`Stock updated! New quantity: ${updated.quantity}`);
      qc.invalidateQueries({ queryKey: ['inventory'] });
      // Update local state so the preview refreshes
      if (selectedItem) setSelectedItem({ ...selectedItem, quantity: updated.quantity });
      setAdjustQty('');
      setAdjustReason('');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || err?.response?.data?.message || 'Failed to update inventory.';
      toast.error(msg);
    },
  });

  const setMutation = useMutation({
    mutationFn: ({ product_id, quantity, reason }: { product_id: number; quantity: number; reason?: string }) =>
      inventoryApi.setQuantity(product_id, quantity, reason),
    onSuccess: (updated: any) => {
      toast.success(`Stock set to ${updated.quantity}!`);
      qc.invalidateQueries({ queryKey: ['inventory'] });
      if (selectedItem) setSelectedItem({ ...selectedItem, quantity: updated.quantity });
      setSetReason('');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || err?.response?.data?.message || 'Failed to set stock.';
      toast.error(msg);
    },
  });

  const items: InventoryItem[] = data?.items || [];
  const pagination = data?.pagination;

  const handleAdjust = () => {
    const qty = parseInt(adjustQty);
    if (!qty || qty < 1) return toast.error('Enter a valid quantity (minimum 1).');
    if (!selectedItem) return;
    adjustMutation.mutate({
      product_id: selectedItem.product_id,
      payload: { action: activeTab, quantity: qty, reason: adjustReason || undefined },
    });
  };

  const handleSet = () => {
    const qty = parseInt(setQty);
    if (isNaN(qty) || qty < 0) return toast.error('Enter a valid quantity (0 or more).');
    if (!selectedItem) return;
    setMutation.mutate({ product_id: selectedItem.product_id, quantity: qty, reason: setReason || undefined });
  };

  // preview after adjustment
  const previewQty = () => {
    if (!selectedItem || !adjustQty || parseInt(adjustQty) < 1) return null;
    const n = parseInt(adjustQty);
    if (activeTab === 'stock_in') return selectedItem.quantity + n;
    if (activeTab === 'stock_out') return Math.max(0, selectedItem.quantity - n);
    return null;
  };

  const stockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) return { label: 'Out of Stock', cls: 'text-red-400 bg-red-400/10 border border-red-400/25' };
    if (item.is_low_stock) return { label: 'Low Stock', cls: 'text-amber-400 bg-amber-400/10 border border-amber-400/25' };
    return { label: 'In Stock', cls: 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/25' };
  };

  const actionColor: Record<string, string> = {
    stock_in: 'text-emerald-400',
    stock_out: 'text-red-400',
    sale: 'text-amber-400',
    return: 'text-blue-400',
    adjustment: 'text-purple-400',
  };

  const isPending = adjustMutation.isPending || setMutation.isPending;

  // counts
  const outOfStock = items.filter(i => i.quantity === 0).length;
  const lowStock = items.filter(i => i.is_low_stock && i.quantity > 0).length;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-cream">Inventory</h1>
          <p className="text-cream/40 text-sm font-sans mt-0.5">
            Manage product stock levels — add, remove or set exact quantities.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="admin-btn-ghost p-2"
          title="Refresh"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Quick-filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setOutOfStockOnly(false); setLowStockOnly(false); setPage(1); }}
          className={`px-3 py-1.5 text-xs border rounded-sm transition-all font-medium ${
            !outOfStockOnly && !lowStockOnly
              ? 'border-gold-500/40 bg-gold-500/10 text-gold-500'
              : 'border-gold-500/10 text-cream/40 hover:border-gold-500/20'
          }`}
        >
          All Products
        </button>
        <button
          onClick={() => { setOutOfStockOnly(false); setLowStockOnly(!lowStockOnly); setPage(1); }}
          className={`px-3 py-1.5 text-xs border rounded-sm transition-all font-medium flex items-center gap-1.5 ${
            lowStockOnly
              ? 'border-amber-400/40 bg-amber-400/10 text-amber-400'
              : 'border-gold-500/10 text-cream/40 hover:border-amber-400/20 hover:text-amber-400'
          }`}
        >
          <AlertTriangle size={11} /> Low Stock
        </button>
        <button
          onClick={() => { setLowStockOnly(false); setOutOfStockOnly(!outOfStockOnly); setPage(1); }}
          className={`px-3 py-1.5 text-xs border rounded-sm transition-all font-medium flex items-center gap-1.5 ${
            outOfStockOnly
              ? 'border-red-400/40 bg-red-400/10 text-red-400'
              : 'border-gold-500/10 text-cream/40 hover:border-red-400/20 hover:text-red-400'
          }`}
        >
          <AlertCircle size={11} /> Out of Stock
        </button>
      </div>

      {/* Search */}
      <div className="admin-card flex items-center gap-3 py-3">
        <Search size={14} className="text-cream/30 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search by product name or SKU…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 bg-transparent text-sm text-cream placeholder:text-cream/25 outline-none"
        />
        {search && (
          <button onClick={() => setSearch('')}>
            <X size={13} className="text-cream/30 hover:text-cream/60" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="admin-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Quantity</th>
                <th>Min Threshold</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th className="text-right pr-5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j}><div className="skeleton h-4 w-20 rounded" /></td>
                      ))}
                    </tr>
                  ))
                : items.length === 0
                ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-cream/25">
                        <Package size={36} className="mx-auto mb-3 opacity-20" />
                        <p className="text-sm">No inventory records found.</p>
                      </td>
                    </tr>
                  )
                : items.map((item) => {
                    const { label, cls } = stockStatus(item);
                    return (
                      <tr key={item.id}>
                        <td className="font-medium text-cream max-w-[200px] truncate" title={item.product_name}>
                          {item.product_name}
                        </td>
                        <td className="font-mono text-xs text-gold-500/70">{item.sku}</td>
                        <td>
                          <span className={`text-xl font-bold tabular-nums ${
                            item.quantity === 0 ? 'text-red-400' : item.is_low_stock ? 'text-amber-400' : 'text-cream'
                          }`}>
                            {item.quantity}
                          </span>
                        </td>
                        <td className="text-cream/40 text-sm">{item.low_stock_threshold}</td>
                        <td>
                          <span className={`status-badge border text-[10px] ${cls}`}>{label}</span>
                        </td>
                        <td className="text-cream/35 text-xs">
                          {new Date(item.updated_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="text-right pr-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setHistoryItem(item)}
                              title="View Stock History"
                              className="p-1.5 text-cream/30 hover:text-gold-500 transition-colors rounded"
                            >
                              <History size={14} />
                            </button>
                            <button
                              onClick={() => openModal(item)}
                              className={`admin-btn-ghost py-1 px-3 text-xs flex items-center gap-1 ${
                                item.quantity === 0 ? 'border-red-400/30 text-red-400 hover:border-red-400 hover:bg-red-400/5' : ''
                              }`}
                            >
                              <Edit3 size={11} />
                              {item.quantity === 0 ? 'Restock' : 'Manage Stock'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gold-500/10">
            <span className="text-xs text-cream/35">
              {pagination.total} total items
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
                className="p-1.5 text-cream/40 hover:text-gold-500 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-cream/60 tabular-nums">
                {page} / {pagination.pages}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page === pagination.pages}
                className="p-1.5 text-cream/40 hover:text-gold-500 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ──── Manage Stock Modal ──── */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-dark-800 border border-gold-500/20 rounded-sm w-full max-w-md shadow-2xl">

            {/* Modal header */}
            <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gold-500/10">
              <div>
                <h2 className="text-base font-display text-cream">Manage Stock</h2>
                <p className="text-xs text-cream/40 font-sans mt-0.5 max-w-[260px] truncate">{selectedItem.product_name}</p>
              </div>
              <button onClick={() => setSelectedItem(null)} className="text-cream/30 hover:text-cream transition-colors ml-4 mt-0.5">
                <X size={17} />
              </button>
            </div>

            {/* Current stock info */}
            <div className="mx-6 mt-4 flex items-center gap-4 p-3 bg-gold-500/5 border border-gold-500/10 rounded-sm">
              <div className="flex-1">
                <p className="text-[10px] text-cream/35 uppercase tracking-wider mb-0.5">Current Stock</p>
                <p className={`text-3xl font-bold tabular-nums ${
                  selectedItem.quantity === 0 ? 'text-red-400' :
                  selectedItem.is_low_stock ? 'text-amber-400' : 'text-cream'
                }`}>
                  {selectedItem.quantity}
                </p>
              </div>
              <div className="text-right text-xs text-cream/30">
                <p>SKU: <span className="font-mono text-cream/50">{selectedItem.sku}</span></p>
                <p className="mt-0.5">Threshold: {selectedItem.low_stock_threshold}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex mx-6 mt-4 border border-gold-500/15 rounded-sm overflow-hidden">
              {([
                ['stock_in',  <TrendingUp size={13} />,   'Stock In',        'hover:text-emerald-400'],
                ['stock_out', <TrendingDown size={13} />, 'Stock Out',       'hover:text-red-400'],
                ['set',       <Hash size={13} />,         'Set Quantity',    'hover:text-purple-400'],
              ] as const).map(([tab, icon, label, hvr]) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-all duration-150 ${
                    activeTab === tab
                      ? tab === 'stock_in'
                        ? 'bg-emerald-400/15 text-emerald-400 border-b-2 border-emerald-400'
                        : tab === 'stock_out'
                        ? 'bg-red-400/15 text-red-400 border-b-2 border-red-400'
                        : 'bg-purple-400/15 text-purple-400 border-b-2 border-purple-400'
                      : `bg-transparent text-cream/40 ${hvr}`
                  }`}
                >
                  {icon} {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="px-6 pb-6 pt-4 space-y-3">
              {activeTab !== 'set' ? (
                /* Stock In / Stock Out */
                <>
                  <div>
                    <label className="text-xs text-cream/45 mb-1.5 block">
                      Quantity to {activeTab === 'stock_in' ? 'add' : 'remove'} *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={adjustQty}
                      onChange={(e) => setAdjustQty(e.target.value)}
                      placeholder="e.g. 10"
                      className="admin-input text-lg font-semibold"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-xs text-cream/45 mb-1.5 block">Reason <span className="text-cream/25">(optional)</span></label>
                    <input
                      type="text"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      placeholder={activeTab === 'stock_in' ? 'e.g. New shipment received' : 'e.g. Damaged / returned goods'}
                      className="admin-input"
                    />
                  </div>

                  {previewQty() !== null && (
                    <div className={`flex items-center gap-2 p-2.5 rounded-sm text-xs ${
                      activeTab === 'stock_in'
                        ? 'bg-emerald-400/8 border border-emerald-400/15 text-emerald-300'
                        : 'bg-red-400/8 border border-red-400/15 text-red-300'
                    }`}>
                      <CheckCircle size={12} />
                      Stock after update:{' '}
                      <strong className="text-white text-sm">{previewQty()}</strong>
                    </div>
                  )}

                  {activeTab === 'stock_out' && adjustQty && parseInt(adjustQty) > selectedItem.quantity && (
                    <div className="flex items-center gap-2 p-2.5 rounded-sm text-xs bg-red-400/10 border border-red-400/20 text-red-300">
                      <AlertCircle size={12} />
                      Cannot remove more than current stock ({selectedItem.quantity}).
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setSelectedItem(null)} className="admin-btn-ghost flex-1 justify-center">
                      Cancel
                    </button>
                    <button
                      onClick={handleAdjust}
                      disabled={
                        isPending || !adjustQty || parseInt(adjustQty) < 1 ||
                        (activeTab === 'stock_out' && parseInt(adjustQty) > selectedItem.quantity)
                      }
                      className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                        activeTab === 'stock_in'
                          ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                          : 'bg-red-500 text-white hover:bg-red-400'
                      }`}
                    >
                      {isPending
                        ? 'Updating…'
                        : activeTab === 'stock_in'
                        ? <><TrendingUp size={14} /> Add Stock</>
                        : <><TrendingDown size={14} /> Remove Stock</>
                      }
                    </button>
                  </div>
                </>
              ) : (
                /* Set Exact Quantity */
                <>
                  <div>
                    <label className="text-xs text-cream/45 mb-1.5 block">
                      New exact quantity (0 = Out of Stock) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={setQty}
                      onChange={(e) => setSetQty(e.target.value)}
                      placeholder="e.g. 25"
                      className="admin-input text-lg font-semibold"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-xs text-cream/45 mb-1.5 block">Reason <span className="text-cream/25">(optional)</span></label>
                    <input
                      type="text"
                      value={setReason}
                      onChange={(e) => setSetReason(e.target.value)}
                      placeholder="e.g. Stock count correction, physical audit"
                      className="admin-input"
                    />
                  </div>

                  {setQty !== '' && !isNaN(parseInt(setQty)) && (
                    <div className="flex items-center gap-2 p-2.5 rounded-sm text-xs bg-purple-400/8 border border-purple-400/15 text-purple-200">
                      <Hash size={12} />
                      Will set stock from{' '}
                      <strong className="text-white">{selectedItem.quantity}</strong>
                      {' → '}
                      <strong className="text-white">{parseInt(setQty)}</strong>
                      {' '}
                      ({parseInt(setQty) - selectedItem.quantity >= 0 ? '+' : ''}{parseInt(setQty) - selectedItem.quantity})
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setSelectedItem(null)} className="admin-btn-ghost flex-1 justify-center">
                      Cancel
                    </button>
                    <button
                      onClick={handleSet}
                      disabled={isPending || setQty === '' || isNaN(parseInt(setQty)) || parseInt(setQty) < 0}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-purple-600 text-white hover:bg-purple-500 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isPending ? 'Saving…' : <><Hash size={14} /> Set Quantity</>}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ──── History Modal ──── */}
      {historyItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-dark-800 border border-gold-500/20 rounded-sm w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gold-500/10 flex-shrink-0">
              <div>
                <h2 className="text-base font-display text-cream">Stock History</h2>
                <p className="text-xs text-cream/40 font-sans mt-0.5 truncate max-w-xs">{historyItem.product_name}</p>
              </div>
              <button onClick={() => setHistoryItem(null)} className="text-cream/30 hover:text-cream transition-colors">
                <X size={17} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              {historyLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="skeleton h-14 w-full rounded" />
                  ))}
                </div>
              ) : (historyData as HistoryEntry[] | undefined)?.length === 0 ? (
                <p className="text-center text-cream/25 py-10 text-sm">No transactions recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {(historyData as HistoryEntry[] | undefined)?.map((h) => (
                    <div key={h.id} className="flex items-center justify-between p-3 bg-gold-500/5 border border-gold-500/5 rounded-sm">
                      <div className="flex flex-col gap-0.5">
                        <span className={`text-xs font-semibold uppercase tracking-wider ${actionColor[h.action] || 'text-cream/40'}`}>
                          {h.action.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-cream/35">{h.reason || '—'}</span>
                        {h.performed_by && (
                          <span className="text-[10px] text-cream/25">by {h.performed_by}</span>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className={`text-sm font-bold tabular-nums ${h.quantity_change > 0 ? 'text-emerald-400' : h.quantity_change < 0 ? 'text-red-400' : 'text-cream/50'}`}>
                          {h.quantity_change > 0 ? '+' : ''}{h.quantity_change}
                        </p>
                        <p className="text-xs text-cream/30">→ {h.quantity_after} units</p>
                        <p className="text-[10px] text-cream/20 mt-0.5">
                          {new Date(h.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
