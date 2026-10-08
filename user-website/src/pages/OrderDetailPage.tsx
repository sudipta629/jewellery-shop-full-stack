import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { orderApi } from '../api/services';
import { useAuth } from '../context/AuthContext';

const STATUS_STYLE: Record<string, string> = {
  placed: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  confirmed: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  processing: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  shipped: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  delivered: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cancelConfirm, setCancelConfirm] = useState(false);

  const { data: orderData, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderApi.get(Number(id)),
    enabled: !!id && isAuthenticated,
  });
  const order: any = orderData;

  const cancelMutation = useMutation({
    mutationFn: () => orderApi.cancel(Number(id)),
    onSuccess: () => { toast.success('Order cancelled'); queryClient.invalidateQueries({ queryKey: ['order', id] }); setCancelConfirm(false); },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Could not cancel order'),
  });

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-dark-800 flex items-center justify-center px-4">
      <div className="text-center"><h1 className="font-display text-2xl text-cream mb-4">Sign in required</h1><Link to="/login" className="btn-primary">Sign In</Link></div>
    </div>
  );

  if (isLoading) return (
    <div className="min-h-screen bg-dark-800 px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="skeleton h-6 w-48" /><div className="skeleton h-40 w-full" /><div className="skeleton h-32 w-full" />
      </div>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-dark-800 flex items-center justify-center"><div className="text-center"><h2 className="font-serif text-cream text-xl mb-4">Order not found</h2><Link to="/orders" className="btn-ghost">My Orders</Link></div></div>
  );

  const addr = order.address_snapshot || {};
  const canCancel = ['placed', 'confirmed'].includes(order.status);

  return (
    <div className="min-h-screen bg-dark-800 page-enter">
      <div className="border-b border-gold-500/10 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-2 text-xs font-sans text-cream/30">
          <Link to="/orders" className="hover:text-gold-500 flex items-center gap-1 transition-colors"><ArrowLeft size={12} /> Orders</Link>
          <span>/</span><span className="text-gold-500">#{order.order_number}</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        {/* Header */}
        <div className="card p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-cream/40 text-xs font-sans mb-1">Order</p>
              <h1 className="font-display text-2xl text-cream">#{order.order_number}</h1>
              <p className="text-cream/40 text-xs font-sans mt-1">{new Date(order.placed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="text-right">
              <span className={`badge border ${STATUS_STYLE[order.status] ?? 'bg-cream/10 text-cream/40 border-cream/20'}`}>{order.status}</span>
              <p className="text-cream/30 text-xs font-sans mt-2">{order.payment_method.toUpperCase()} · {order.payment_status}</p>
            </div>
          </div>
          {canCancel && (
            <div className="border-t border-gold-500/10 pt-4">
              {!cancelConfirm ? (
                <button onClick={() => setCancelConfirm(true)} className="text-red-400/70 hover:text-red-400 text-xs font-sans flex items-center gap-1.5 transition-colors"><X size={13} /> Cancel Order</button>
              ) : (
                <div className="flex items-center gap-3">
                  <p className="text-cream/50 text-xs font-sans">Are you sure you want to cancel?</p>
                  <button onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending} className="text-red-400 text-xs font-semibold hover:underline disabled:opacity-50">{cancelMutation.isPending ? 'Cancelling…' : 'Yes, Cancel'}</button>
                  <button onClick={() => setCancelConfirm(false)} className="text-cream/40 text-xs hover:text-cream">No</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Items */}
        {order.items && (
          <div className="card p-6">
            <h2 className="font-serif text-cream font-semibold mb-4">Items Ordered</h2>
            <div className="space-y-4">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex gap-4 py-4 border-b border-gold-500/5 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-gold-500/60 text-[10px] font-sans uppercase tracking-widest mb-1">{item.metal_type}{item.purity ? ` · ${item.purity}` : ''} · SKU: {item.product_sku}</p>
                    <p className="text-cream font-serif text-sm">{item.product_name}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs font-sans text-cream/40">
                      <span>Qty: {item.quantity}</span>
                      <span>Unit: ₹{parseFloat(item.unit_price).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-cream font-semibold font-sans">₹{parseFloat(item.line_total).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Totals */}
            <div className="mt-4 space-y-2 pt-4 border-t border-gold-500/10">
              {[
                { label: 'Subtotal', value: order.subtotal },
                ...(parseFloat(order.discount_amount) > 0 ? [{ label: `Discount${order.coupon_code ? ` (${order.coupon_code})` : ''}`, value: `-${order.discount_amount}` }] : []),
                { label: 'Shipping', value: parseFloat(order.shipping_charge) === 0 ? 'Free' : `₹${parseFloat(order.shipping_charge).toLocaleString('en-IN')}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm font-sans">
                  <span className="text-cream/40">{label}</span>
                  <span className="text-cream/70">{typeof value === 'string' && value.startsWith('-') ? <span className="text-emerald-400">{value.replace('-', '-₹')}</span> : value}</span>
                </div>
              ))}
              <div className="flex justify-between font-semibold font-sans pt-2 border-t border-gold-500/10">
                <span className="text-cream">Total</span>
                <span className="text-gold-500">₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Address */}
        <div className="card p-6">
          <h2 className="font-serif text-cream font-semibold mb-4">Delivery Address</h2>
          <p className="text-cream font-semibold text-sm">{addr.full_name}</p>
          <p className="text-cream/60 text-sm mt-1">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
          <p className="text-cream/60 text-sm">{addr.city}, {addr.state} – {addr.pincode}</p>
          <p className="text-cream/60 text-sm">{addr.country}</p>
          <p className="text-gold-500/70 text-sm mt-2">📞 {addr.phone}</p>
        </div>

        {/* Status History */}
        {order.status_history && order.status_history.length > 0 && (
          <div className="card p-6">
            <h2 className="font-serif text-cream font-semibold mb-4">Order Timeline</h2>
            <div className="space-y-3">
              {order.status_history.map((sh: any, i: number) => (
                <div key={i} className="flex items-start gap-4">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${i === 0 ? 'bg-gold-500' : 'bg-dark-600 border border-gold-500/20'}`} />
                  <div>
                    <p className={`text-sm font-sans font-medium capitalize ${i === 0 ? 'text-gold-500' : 'text-cream/60'}`}>{sh.status}</p>
                    {sh.note && <p className="text-cream/30 text-xs mt-0.5">{sh.note}</p>}
                    <p className="text-cream/20 text-[10px] mt-0.5">{new Date(sh.created_at).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}