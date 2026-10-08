import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle, Package, ShoppingBag, Home } from 'lucide-react';
import { orderApi } from '../api/services';
import { useAuth } from '../context/AuthContext';

export default function OrderSuccessPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();

  const { data: orderData } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderApi.get(Number(id)),
    enabled: !!id && isAuthenticated,
  });
  const order: any = orderData;

  const orderNumber = (order as any)?.order_number ?? `#${id}`;

  return (
    <div className="min-h-screen bg-dark-800 flex items-center justify-center px-4 page-enter">
      <div className="max-w-lg w-full text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="mb-8"
        >
          <div className="w-24 h-24 bg-gold-500/10 border border-gold-500/30 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={44} className="text-gold-500" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <p className="section-subtitle mb-2">Thank You!</p>
          <h1 className="section-title mb-4">Order Placed Successfully</h1>
          <div className="gold-divider mb-6" />

          <div className="card p-6 mb-8 text-left">
            <div className="flex items-center justify-between mb-4">
              <span className="text-cream/50 text-sm font-sans">Order Number</span>
              <span className="text-gold-500 font-mono font-semibold">{orderNumber}</span>
            </div>
            {order && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-cream/50 text-sm font-sans">Status</span>
                  <span className="badge-gold text-[10px]">{(order as any).status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-cream/50 text-sm font-sans">Total Paid</span>
                  <span className="text-cream font-semibold">₹{parseFloat((order as any).total_amount).toLocaleString('en-IN')}</span>
                </div>
              </>
            )}
          </div>

          <p className="text-cream/40 font-sans text-sm leading-relaxed mb-8">
            Your order has been received and is being processed. You'll receive updates on your order status.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={`/orders/${id}`} className="btn-primary"><Package size={16} /> Track Order</Link>
            <Link to="/shop" className="btn-ghost"><ShoppingBag size={16} /> Continue Shopping</Link>
            <Link to="/" className="btn-ghost"><Home size={16} /> Home</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}