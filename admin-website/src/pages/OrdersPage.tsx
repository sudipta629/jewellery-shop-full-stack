import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../api/services';
import toast from 'react-hot-toast';
import {
  ShoppingBag, Search, ChevronLeft, ChevronRight, X,
  Clock, CheckCircle, Truck, Package, XCircle, RefreshCw,
  User, MapPin, CreditCard, ChevronDown
} from 'lucide-react';

interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  customer_email: string | null;
  status: string;
  payment_method: string;
  payment_status: string;
  total_amount: string;
  placed_at: string;
}

interface OrderDetail extends Order {
  customer_name: string | null;
  customer_phone: string | null;
  subtotal: string;
  discount_amount: string;
  coupon_code: string | null;
  shipping_charge: string;
  tax_amount: string;
  address_snapshot: Record<string, string>;
  notes: string | null;
  updated_at: string;
  items: {
    id: number;
    product_id: number;
    product_name: string;
    product_sku: string;
    metal_type: string;
    purity: string;
    quantity: number;
    unit_price: string;
    line_total: string;
  }[];
  status_history: {
    status: string;
    note: string | null;
    changed_by: string | null;
    created_at: string;
  }[];
}

const ORDER_STATUSES = [
  'placed', 'confirmed', 'processing', 'hallmarking', 'shipped', 'delivered', 'cancelled', 'refunded',
] as const;

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  placed:      { label: 'Placed',      color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',     icon: <Clock size={11} /> },
  confirmed:   { label: 'Confirmed',   color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',     icon: <CheckCircle size={11} /> },
  processing:  { label: 'Processing',  color: 'text-purple-400 bg-purple-400/10 border-purple-400/20', icon: <RefreshCw size={11} /> },
  hallmarking: { label: 'Hallmarking', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',  icon: <Package size={11} /> },
  shipped:     { label: 'Shipped',     color: 'text-gold-500 bg-gold-500/10 border-gold-500/20',     icon: <Truck size={11} /> },
  delivered:   { label: 'Delivered',   color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: <CheckCircle size={11} /> },
  cancelled:   { label: 'Cancelled',   color: 'text-red-400 bg-red-400/10 border-red-400/20',        icon: <XCircle size={11} /> },
  refunded:    { label: 'Refunded',    color: 'text-pink-400 bg-pink-400/10 border-pink-400/20',     icon: <RefreshCw size={11} /> },
};

const paymentStatusConfig: Record<string, string> = {
  pending: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  paid:    'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  failed:  'text-red-400 bg-red-400/10 border-red-400/20',
  refunded:'text-pink-400 bg-pink-400/10 border-pink-400/20',
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] || { label: status, color: 'text-cream/50 bg-cream/5 border-cream/10', icon: null };
  return (
    <span className={`status-badge border gap-1 ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

export default function OrdersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, search, statusFilter],
    queryFn: () =>
      ordersApi.list({ page, per_page: 15, q: search || undefined, status: statusFilter || undefined }),
  });

  const orderDetailQuery = useQuery({
    queryKey: ['order-detail', selectedOrder?.id],
    queryFn: () => ordersApi.get(selectedOrder!.id),
    enabled: false,
  });

  const openOrder = async (order: Order) => {
    try {
      const detail = await ordersApi.get(order.id);
      setSelectedOrder(detail as OrderDetail);
      setNewStatus(detail.status);
      setStatusNote('');
    } catch {
      toast.error('Failed to load order details.');
    }
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: number; status: string; note: string }) =>
      ordersApi.updateStatus(id, status, note),
    onSuccess: (_, vars) => {
      toast.success(`Order status updated to "${statusConfig[vars.status]?.label || vars.status}"!`);
      qc.invalidateQueries({ queryKey: ['orders'] });
      if (selectedOrder) {
        setSelectedOrder({ ...selectedOrder, status: vars.status });
      }
      setShowStatusDropdown(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update status.');
    },
  });

  const orders: Order[] = data?.items || [];
  const pagination = data?.pagination;

  const handleStatusUpdate = () => {
    if (!selectedOrder || !newStatus) return;
    if (newStatus === selectedOrder.status) return toast.error('Please select a different status.');
    updateStatusMutation.mutate({ id: selectedOrder.id, status: newStatus, note: statusNote });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-cream">Orders</h1>
          <p className="text-cream/40 text-sm font-sans mt-0.5">
            View, manage and update customer orders.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-card flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48">
          <Search size={14} className="text-cream/30" />
          <input
            type="text"
            placeholder="Search by order number…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 bg-transparent text-sm text-cream placeholder:text-cream/25 outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')}><X size={13} className="text-cream/30 hover:text-cream/60" /></button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setStatusFilter(''); setPage(1); }}
            className={`px-3 py-1.5 text-xs rounded-sm border transition-all ${!statusFilter ? 'border-gold-500/40 bg-gold-500/10 text-gold-500' : 'border-gold-500/10 text-cream/40 hover:border-gold-500/20'}`}
          >
            All
          </button>
          {ORDER_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 text-xs rounded-sm border transition-all ${
                statusFilter === s
                  ? statusConfig[s]?.color.replace('bg-', 'border-') + ' ' + statusConfig[s]?.color
                  : 'border-gold-500/10 text-cream/40 hover:border-gold-500/20'
              }`}
            >
              {statusConfig[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="admin-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Amount</th>
                <th>Placed At</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j}><div className="skeleton h-4 w-20 rounded" /></td>
                      ))}
                    </tr>
                  ))
                : orders.length === 0
                ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-cream/30">
                        <ShoppingBag size={32} className="mx-auto mb-2 opacity-30" />
                        No orders found.
                      </td>
                    </tr>
                  )
                : orders.map((order) => (
                    <tr key={order.id} className="cursor-pointer" onClick={() => openOrder(order)}>
                      <td className="font-mono text-xs font-semibold text-gold-500">{order.order_number}</td>
                      <td className="text-cream/70 text-xs">{order.customer_email || '—'}</td>
                      <td><StatusBadge status={order.status} /></td>
                      <td>
                        <div className="space-y-1">
                          <span className={`status-badge border text-xs ${paymentStatusConfig[order.payment_status] || ''}`}>
                            {order.payment_status}
                          </span>
                          <div className="text-cream/30 text-xs uppercase">{order.payment_method}</div>
                        </div>
                      </td>
                      <td className="font-semibold text-cream">₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</td>
                      <td className="text-cream/40 text-xs">
                        {new Date(order.placed_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); openOrder(order); }}
                          className="admin-btn-ghost py-1 px-3 text-xs"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gold-500/10">
            <span className="text-xs text-cream/40">
              Showing {orders.length} of {pagination.total} orders
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                className="p-1.5 text-cream/40 hover:text-gold-500 disabled:opacity-30">
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-cream/60">Page {page} of {pagination.pages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page === pagination.pages}
                className="p-1.5 text-cream/40 hover:text-gold-500 disabled:opacity-30">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 backdrop-blur-sm overflow-y-auto py-8 px-4">
          <div className="bg-dark-800 border border-gold-500/20 rounded-sm w-full max-w-2xl shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gold-500/10">
              <div>
                <h2 className="text-lg font-display text-cream">
                  Order <span className="text-gold-500 font-mono">#{selectedOrder.order_number}</span>
                </h2>
                <p className="text-xs text-cream/40 mt-0.5">
                  Placed {new Date(selectedOrder.placed_at).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}
                </p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-cream/40 hover:text-cream">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Status + Update */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gold-500/5 border border-gold-500/10 rounded-sm">
                  <p className="text-xs text-cream/40 mb-1">Current Status</p>
                  <StatusBadge status={selectedOrder.status} />
                </div>
                <div className="p-3 bg-gold-500/5 border border-gold-500/10 rounded-sm">
                  <p className="text-xs text-cream/40 mb-1">Payment</p>
                  <div className="flex items-center gap-2">
                    <span className={`status-badge border ${paymentStatusConfig[selectedOrder.payment_status] || ''}`}>
                      {selectedOrder.payment_status}
                    </span>
                    <span className="text-xs text-cream/30 uppercase">{selectedOrder.payment_method}</span>
                  </div>
                </div>
              </div>

              {/* Update Status Panel */}
              <div className="border border-gold-500/15 rounded-sm p-4 space-y-3 bg-gold-500/3">
                <h3 className="text-sm font-medium text-cream flex items-center gap-2">
                  <RefreshCw size={14} className="text-gold-500" />
                  Update Order Status
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <label className="text-xs text-cream/40 mb-1 block">New Status</label>
                    <div className="relative">
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="admin-input appearance-none pr-8"
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>{statusConfig[s]?.label || s}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/30 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-cream/40 mb-1 block">Note (optional)</label>
                    <input
                      type="text"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="e.g. Dispatched via BlueDart"
                      className="admin-input"
                    />
                  </div>
                </div>
                <button
                  onClick={handleStatusUpdate}
                  disabled={updateStatusMutation.isPending || newStatus === selectedOrder.status}
                  className="admin-btn"
                >
                  {updateStatusMutation.isPending ? 'Updating…' : 'Update Status'}
                </button>
              </div>

              {/* Customer + Address */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gold-500/5 border border-gold-500/10 rounded-sm">
                  <p className="text-xs text-cream/40 mb-2 flex items-center gap-1"><User size={11} /> Customer</p>
                  <p className="text-sm text-cream font-medium">{selectedOrder.customer_name || '—'}</p>
                  <p className="text-xs text-cream/50">{selectedOrder.customer_email || '—'}</p>
                  <p className="text-xs text-cream/50">{selectedOrder.customer_phone || '—'}</p>
                </div>
                <div className="p-3 bg-gold-500/5 border border-gold-500/10 rounded-sm">
                  <p className="text-xs text-cream/40 mb-2 flex items-center gap-1"><MapPin size={11} /> Delivery Address</p>
                  {selectedOrder.address_snapshot && (
                    <div className="text-xs text-cream/70 space-y-0.5">
                      <p className="font-medium text-cream">{selectedOrder.address_snapshot.full_name}</p>
                      <p>{selectedOrder.address_snapshot.line1}</p>
                      {selectedOrder.address_snapshot.line2 && <p>{selectedOrder.address_snapshot.line2}</p>}
                      <p>{selectedOrder.address_snapshot.city}, {selectedOrder.address_snapshot.state} - {selectedOrder.address_snapshot.pincode}</p>
                      <p className="text-cream/40">📞 {selectedOrder.address_snapshot.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-sm font-medium text-cream mb-2 flex items-center gap-2">
                  <Package size={14} className="text-gold-500" />
                  Order Items
                </h3>
                <div className="border border-gold-500/10 rounded-sm overflow-hidden">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Metal</th>
                        <th className="text-center">Qty</th>
                        <th className="text-right">Unit Price</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <p className="font-medium text-cream text-xs">{item.product_name}</p>
                            <p className="text-cream/30 text-xs font-mono">{item.product_sku}</p>
                          </td>
                          <td className="text-xs text-cream/50">{item.metal_type} {item.purity}</td>
                          <td className="text-center text-cream">{item.quantity}</td>
                          <td className="text-right text-cream text-xs">₹{parseFloat(item.unit_price).toLocaleString('en-IN')}</td>
                          <td className="text-right font-semibold text-cream text-xs">₹{parseFloat(item.line_total).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Price Summary */}
              <div className="p-4 bg-gold-500/5 border border-gold-500/10 rounded-sm">
                <h3 className="text-sm font-medium text-cream mb-3 flex items-center gap-2">
                  <CreditCard size={14} className="text-gold-500" />
                  Price Summary
                </h3>
                <div className="space-y-1.5 text-sm">
                  {[
                    ['Subtotal', selectedOrder.subtotal],
                    ...(parseFloat(selectedOrder.discount_amount) > 0
                      ? [['Discount' + (selectedOrder.coupon_code ? ` (${selectedOrder.coupon_code})` : ''), '-' + selectedOrder.discount_amount]]
                      : []),
                    ['Shipping', selectedOrder.shipping_charge],
                    ['Tax (GST)', selectedOrder.tax_amount],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between text-cream/60">
                      <span>{label}</span>
                      <span>₹{parseFloat(String(val).replace('-', '')).toLocaleString('en-IN')}{String(val).startsWith('-') ? ' (discount)' : ''}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold text-cream border-t border-gold-500/10 pt-2 mt-2">
                    <span>Total</span>
                    <span className="text-gold-500">₹{parseFloat(selectedOrder.total_amount).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Status History */}
              {selectedOrder.status_history?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-cream mb-2 flex items-center gap-2">
                    <Clock size={14} className="text-gold-500" />
                    Status History
                  </h3>
                  <div className="space-y-2">
                    {[...selectedOrder.status_history].reverse().map((h, i) => (
                      <div key={i} className="flex items-start gap-3 p-2.5 bg-gold-500/5 border border-gold-500/5 rounded-sm">
                        <div className="mt-0.5"><StatusBadge status={h.status} /></div>
                        <div className="flex-1 min-w-0">
                          {h.note && <p className="text-xs text-cream/60">{h.note}</p>}
                          <p className="text-xs text-cream/30">
                            {h.changed_by ? `By ${h.changed_by} · ` : ''}
                            {new Date(h.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
