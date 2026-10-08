import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Package, ArrowRight, ShoppingBag } from 'lucide-react';
import { orderApi, type Order } from '../api/services';
import { useAuth } from '../context/AuthContext';

const STATUS_STYLE: Record<string, string> = {
  placed: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  confirmed: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  processing: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  shipped: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  delivered: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
};

function OrderCard({ order }: { order: Order }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-5 hover:border-gold-500/30 transition-colors">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-gold-500 font-mono text-sm font-semibold">#{order.order_number}</p>
          <p className="text-cream/40 text-xs font-sans mt-0.5">{new Date(order.placed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <span className={`badge border text-[10px] ${STATUS_STYLE[order.status] ?? 'bg-cream/10 text-cream/40 border-cream/20'}`}>{order.status}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm font-sans">
          <span className="text-cream/50">Total: </span>
          <span className="text-cream font-semibold">₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</span>
          <span className="text-cream/30 text-xs ml-2">via {order.payment_method.toUpperCase()}</span>
        </div>
        <Link to={`/orders/${order.id}`} className="btn-text text-xs">
          View Details <ArrowRight size={13} />
        </Link>
      </div>
    </motion.div>
  );
}

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page],
    queryFn: () => orderApi.list({ page, per_page: 10 }),
    enabled: isAuthenticated,
  });

  const orders = data?.items ?? [];
  const pagination = data?.pagination;

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-dark-800 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <Package size={48} className="text-gold-500/20 mx-auto mb-6" />
        <h1 className="font-display text-3xl text-cream mb-3">My Orders</h1>
        <p className="text-cream/40 font-sans text-sm mb-8">Sign in to view your order history.</p>
        <Link to="/login" className="btn-primary">Sign In</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-800 page-enter">
      <div className="bg-dark-900/60 border-b border-gold-500/10 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="section-subtitle mb-2">Account</p>
          <h1 className="section-title">My Orders</h1>
          <div className="gold-divider-left mt-3" />
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-10">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="card p-5"><div className="skeleton h-5 w-1/3 mb-3" /><div className="skeleton h-4 w-1/2" /></div>)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-24">
            <ShoppingBag size={48} className="text-gold-500/20 mx-auto mb-6" />
            <h2 className="font-serif text-cream text-2xl mb-3">No orders yet</h2>
            <p className="text-cream/40 font-sans text-sm mb-8">Your order history will appear here once you make a purchase.</p>
            <Link to="/shop" className="btn-primary">Start Shopping</Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {orders.map(order => <OrderCard key={order.id} order={order} />)}
            </div>
            {pagination && pagination.total_pages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost px-4 py-2 text-xs disabled:opacity-30">← Prev</button>
                {Array.from({ length: Math.min(pagination.total_pages, 5) }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 text-sm border transition-all ${p === page ? 'bg-gold-500 text-dark-800 border-gold-500' : 'border-gold-500/20 text-cream/60 hover:border-gold-500'}`}>{p}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))} disabled={page === pagination.total_pages} className="btn-ghost px-4 py-2 text-xs disabled:opacity-30">Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}