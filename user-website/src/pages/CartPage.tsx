import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Trash2, ArrowRight, ArrowLeft, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { cartApi, type Cart, type CartItem } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useCartStore } from '../store/cartStore';

function CartItemRow({ item, onUpdate, onRemove }: {
  item: CartItem;
  onUpdate: (id: number, qty: number) => void;
  onRemove: (id: number) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      className="flex gap-4 py-5 border-b border-gold-500/10"
    >
      {/* Image */}
      <div className="flex-shrink-0 w-20 h-24 sm:w-24 sm:h-28 bg-dark-700 border border-gold-500/10 overflow-hidden">
        {item.primary_image_url
          ? <img src={item.primary_image_url} alt={item.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><span className="text-gold-500/20 text-2xl font-display">J</span></div>}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <Link to={`/product/${item.product_id}`} className="block">
          <p className="text-gold-500/60 text-[10px] font-sans uppercase tracking-widest mb-1">{item.metal_type}{item.purity ? ` · ${item.purity}` : ''}</p>
          <h3 className="text-cream font-serif text-sm sm:text-base font-medium hover:text-gold-500 transition-colors line-clamp-2">{item.name}</h3>
        </Link>
        <p className="text-gold-500 font-semibold font-sans text-sm sm:text-base mt-2">₹{parseFloat(item.unit_price).toLocaleString('en-IN')}</p>
        <p className="text-cream/30 text-[10px] font-sans mt-0.5">per piece · {item.stock} in stock</p>

        {/* Qty controls */}
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center border border-gold-500/20">
            <button
              onClick={() => item.quantity > 1 && onUpdate(item.cart_item_id, item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="w-8 h-8 flex items-center justify-center text-cream/60 hover:text-gold-500 disabled:opacity-30 transition-colors"
            >−</button>
            <span className="w-10 text-center text-cream font-sans text-sm">{item.quantity}</span>
            <button
              onClick={() => item.quantity < item.stock && onUpdate(item.cart_item_id, item.quantity + 1)}
              disabled={item.quantity >= item.stock}
              className="w-8 h-8 flex items-center justify-center text-cream/60 hover:text-gold-500 disabled:opacity-30 transition-colors"
            >+</button>
          </div>
          <button onClick={() => onRemove(item.cart_item_id)} className="text-cream/30 hover:text-red-400 transition-colors p-1">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Line total */}
      <div className="text-right flex-shrink-0">
        <p className="text-cream font-semibold font-sans text-sm sm:text-base">₹{parseFloat(item.line_total).toLocaleString('en-IN')}</p>
      </div>
    </motion.div>
  );
}

export default function CartPage() {
  const { isAuthenticated } = useAuth();
  const { setCartCount } = useCartStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.get,
    enabled: isAuthenticated,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, qty }: { id: number; qty: number }) => cartApi.updateItem(id, qty),
    onSuccess: (newCart) => { queryClient.setQueryData(['cart'], newCart); setCartCount((newCart as Cart).item_count); },
    onError: () => toast.error('Could not update quantity'),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => cartApi.removeItem(id),
    onSuccess: (newCart) => { queryClient.setQueryData(['cart'], newCart); setCartCount((newCart as Cart).item_count); toast.success('Item removed'); },
    onError: () => toast.error('Could not remove item'),
  });

  const clearMutation = useMutation({
    mutationFn: cartApi.clear,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cart'] }); setCartCount(0); toast.success('Cart cleared'); },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark-800 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <ShoppingBag size={48} className="text-gold-500/20 mx-auto mb-6" />
          <h1 className="font-display text-3xl text-cream mb-3">Your Cart</h1>
          <p className="text-cream/40 font-sans text-sm mb-8">Sign in to view your cart and checkout.</p>
          <Link to="/login" className="btn-primary">Sign In</Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-800 px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="skeleton h-8 w-48 mb-8" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 py-5 border-b border-gold-500/10">
              <div className="skeleton w-24 h-28 flex-shrink-0" />
              <div className="flex-1 space-y-3"><div className="skeleton h-4 w-3/4" /><div className="skeleton h-5 w-1/2" /><div className="skeleton h-8 w-32" /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const cartData = cart as Cart | undefined;
  const items = cartData?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-dark-800 flex items-center justify-center px-4 page-enter">
        <div className="text-center max-w-md">
          <ShoppingBag size={48} className="text-gold-500/20 mx-auto mb-6" />
          <h1 className="font-display text-3xl text-cream mb-3">Your Cart is Empty</h1>
          <p className="text-cream/40 font-sans text-sm mb-8">Discover our beautiful jewellery collection and add pieces you love.</p>
          <Link to="/shop" className="btn-primary">Browse Shop</Link>
        </div>
      </div>
    );
  }

  const subtotal = parseFloat(cartData?.subtotal ?? '0');

  return (
    <div className="min-h-screen bg-dark-800 page-enter">
      <div className="border-b border-gold-500/10 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-2 text-xs font-sans text-cream/30">
          <Link to="/" className="hover:text-gold-500 transition-colors">Home</Link><span>/</span>
          <span className="text-gold-500">Cart</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-cream">Shopping Cart</h1>
            <p className="text-cream/40 text-sm font-sans mt-1">{items.length} item{items.length !== 1 ? 's' : ''}</p>
          </div>
          {items.length > 0 && (
            <button onClick={() => clearMutation.mutate()} className="text-cream/30 hover:text-red-400 text-xs font-sans flex items-center gap-1.5 transition-colors">
              <X size={13} /> Clear All
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Items */}
          <div className="lg:col-span-2">
            <AnimatePresence>
              {items.map(item => (
                <CartItemRow
                  key={item.cart_item_id}
                  item={item}
                  onUpdate={(id, qty) => updateMutation.mutate({ id, qty })}
                  onRemove={(id) => removeMutation.mutate(id)}
                />
              ))}
            </AnimatePresence>
            <Link to="/shop" className="btn-text mt-6 inline-flex">
              <ArrowLeft size={14} /> Continue Shopping
            </Link>
          </div>

          {/* Summary */}
          <div className="card p-6 sticky top-24">
            <h2 className="font-serif text-cream font-semibold mb-5">Order Summary</h2>
            <div className="space-y-3 border-b border-gold-500/10 pb-4 mb-4">
              <div className="flex justify-between text-sm font-sans">
                <span className="text-cream/50">Subtotal ({items.length} items)</span>
                <span className="text-cream">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm font-sans">
                <span className="text-cream/50">Shipping</span>
                <span className="text-emerald-400">Calculated at checkout</span>
              </div>
            </div>
            <div className="flex justify-between font-semibold font-sans mb-6">
              <span className="text-cream">Total</span>
              <span className="text-gold-500 text-xl">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              className="btn-primary w-full justify-center text-sm"
            >
              Proceed to Checkout <ArrowRight size={16} />
            </button>
            <p className="text-cream/20 text-[10px] font-sans text-center mt-4 leading-relaxed">
              Final price including taxes and delivery will be confirmed at checkout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}