import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MapPin, CreditCard, Tag, Plus, ArrowRight, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { cartApi, customerApi, couponApi, orderApi, type Address, type Cart } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useCartStore } from '../store/cartStore';

function AddressCard({ address, selected, onSelect }: { address: Address; selected: boolean; onSelect: () => void }) {
  return (
    <div onClick={onSelect} className={`cursor-pointer border p-4 transition-all duration-200 ${selected ? 'border-gold-500 bg-gold-500/5' : 'border-gold-500/15 hover:border-gold-500/40'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-cream text-sm font-semibold">{address.full_name}</p>
            {address.is_default && <span className="badge-gold text-[10px]">Default</span>}
            {address.label && <span className="text-cream/40 text-[10px] font-sans uppercase">{address.label}</span>}
          </div>
          <p className="text-cream/60 text-xs font-sans leading-relaxed">{address.line1}{address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state} – {address.pincode}</p>
          <p className="text-gold-500/60 text-xs font-sans mt-1">📞 {address.phone}</p>
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${selected ? 'border-gold-500 bg-gold-500' : 'border-gold-500/30'}`}>
          {selected && <div className="w-2 h-2 rounded-full bg-dark-800" />}
        </div>
      </div>
    </div>
  );
}

const PAYMENT_METHODS = [
  { value: 'cod', label: 'Cash on Delivery', desc: 'Pay when your order arrives' },
  { value: 'upi', label: 'UPI / Net Banking', desc: 'QR code will be provided after order' },
];

export default function CheckoutPage() {
  const { isAuthenticated } = useAuth();
  const { setCartCount } = useCartStore();
  const navigate = useNavigate();

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<any>(null);
  const [notes, setNotes] = useState('');

  const { data: cart } = useQuery({ queryKey: ['cart'], queryFn: cartApi.get, enabled: isAuthenticated });
  const { data: addresses = [] } = useQuery({ queryKey: ['addresses'], queryFn: customerApi.getAddresses, enabled: isAuthenticated });

  // Auto-select default address
  React.useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const def = addresses.find(a => a.is_default) || addresses[0];
      setSelectedAddressId(def.id);
    }
  }, [addresses]);

  const validateCoupon = useMutation({
    mutationFn: () => couponApi.validate(couponCode, parseFloat((cart as Cart)?.subtotal ?? '0')),
    onSuccess: (data: any) => { setCouponApplied(data); toast.success(`Coupon applied! Saving ₹${data.discount_amount}`); },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Invalid coupon'),
  });

  const placeOrderMutation = useMutation({
    mutationFn: () => orderApi.place({
      address_id: selectedAddressId!,
      payment_method: paymentMethod,
      coupon_code: couponApplied ? couponCode : undefined,
      notes: notes.trim() || undefined,
    }),
    onSuccess: (order: any) => {
      setCartCount(0);
      navigate(`/order-success/${order.id}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Could not place order'),
  });

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-dark-800 flex items-center justify-center px-4">
      <div className="text-center"><h1 className="font-display text-2xl text-cream mb-4">Sign in to checkout</h1><Link to="/login" className="btn-primary">Sign In</Link></div>
    </div>
  );

  const cartData = cart as Cart | undefined;
  const items = cartData?.items ?? [];

  if (items.length === 0) return (
    <div className="min-h-screen bg-dark-800 flex items-center justify-center px-4">
      <div className="text-center"><h1 className="font-display text-2xl text-cream mb-4">Your cart is empty</h1><Link to="/shop" className="btn-primary">Browse Shop</Link></div>
    </div>
  );

  const subtotal = parseFloat(cartData?.subtotal ?? '0');
  const discount = couponApplied ? parseFloat(couponApplied.discount_amount) : 0;
  const total = subtotal - discount;
  const canOrder = selectedAddressId !== null;

  return (
    <div className="min-h-screen bg-dark-800 page-enter">
      <div className="border-b border-gold-500/10 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-2 text-xs font-sans text-cream/30">
          <Link to="/cart" className="hover:text-gold-500 transition-colors">Cart</Link><span>/</span><span className="text-gold-500">Checkout</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="font-display text-3xl text-cream mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left: form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-serif text-cream font-semibold flex items-center gap-2"><MapPin size={16} className="text-gold-500" /> Delivery Address</h2>
                <Link to="/addresses" className="btn-text text-xs"><Plus size={13} /> Add New</Link>
              </div>
              {addresses.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-cream/40 text-sm font-sans mb-4">No saved addresses. Add one to proceed.</p>
                  <Link to="/addresses" className="btn-ghost text-sm">Add Address</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map(addr => (
                    <AddressCard key={addr.id} address={addr} selected={selectedAddressId === addr.id} onSelect={() => setSelectedAddressId(addr.id)} />
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="card p-6">
              <h2 className="font-serif text-cream font-semibold flex items-center gap-2 mb-5"><CreditCard size={16} className="text-gold-500" /> Payment Method</h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map(pm => (
                  <div key={pm.value} onClick={() => setPaymentMethod(pm.value)} className={`cursor-pointer border p-4 transition-all ${paymentMethod === pm.value ? 'border-gold-500 bg-gold-500/5' : 'border-gold-500/15 hover:border-gold-500/40'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-cream text-sm font-semibold">{pm.label}</p>
                        <p className="text-cream/40 text-xs font-sans mt-0.5">{pm.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${paymentMethod === pm.value ? 'border-gold-500 bg-gold-500' : 'border-gold-500/30'}`}>
                        {paymentMethod === pm.value && <div className="w-2 h-2 rounded-full bg-dark-800" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coupon */}
            <div className="card p-6">
              <h2 className="font-serif text-cream font-semibold flex items-center gap-2 mb-5"><Tag size={16} className="text-gold-500" /> Coupon Code</h2>
              {couponApplied ? (
                <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 px-4 py-3">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle size={16} /><span className="text-sm font-semibold">{couponCode} applied</span>
                    <span className="text-xs text-emerald-300">−₹{parseFloat(couponApplied.discount_amount).toLocaleString('en-IN')}</span>
                  </div>
                  <button onClick={() => { setCouponApplied(null); setCouponCode(''); }} className="text-cream/40 text-xs hover:text-red-400 transition-colors">Remove</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input type="text" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="Enter coupon code" className="input flex-1" />
                  <button onClick={() => validateCoupon.mutate()} disabled={!couponCode.trim() || validateCoupon.isPending} className="btn-ghost px-4 disabled:opacity-40">
                    {validateCoupon.isPending ? '…' : 'Apply'}
                  </button>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="card p-6">
              <h2 className="font-serif text-cream font-semibold mb-4">Order Notes <span className="text-cream/30 font-normal text-xs">(optional)</span></h2>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special instructions for your order…" rows={3} className="input w-full resize-none" />
            </div>
          </div>

          {/* Right: Summary */}
          <div className="card p-6 sticky top-24">
            <h2 className="font-serif text-cream font-semibold mb-5">Order Summary</h2>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {items.map(item => (
                <div key={item.cart_item_id} className="flex items-center gap-3 text-xs font-sans py-1.5 border-b border-gold-500/5">
                  <span className="text-cream/60 flex-1 truncate">{item.name} × {item.quantity}</span>
                  <span className="text-cream flex-shrink-0">₹{parseFloat(item.line_total).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 border-b border-gold-500/10 pb-4 mb-4">
              <div className="flex justify-between text-sm font-sans"><span className="text-cream/50">Subtotal</span><span className="text-cream">₹{subtotal.toLocaleString('en-IN')}</span></div>
              {discount > 0 && <div className="flex justify-between text-sm font-sans"><span className="text-cream/50">Discount</span><span className="text-emerald-400">−₹{discount.toLocaleString('en-IN')}</span></div>}
              <div className="flex justify-between text-sm font-sans"><span className="text-cream/50">Shipping</span><span className="text-emerald-400">Free</span></div>
            </div>
            <div className="flex justify-between font-semibold font-sans mb-6">
              <span className="text-cream">Total</span><span className="text-gold-500 text-xl">₹{total.toLocaleString('en-IN')}</span>
            </div>
            <button
              onClick={() => placeOrderMutation.mutate()}
              disabled={!canOrder || placeOrderMutation.isPending}
              className="btn-primary w-full justify-center"
            >
              {placeOrderMutation.isPending ? 'Placing Order…' : 'Place Order'} <ArrowRight size={16} />
            </button>
            {!canOrder && <p className="text-amber-400 text-xs text-center mt-3 font-sans">Please select a delivery address to continue.</p>}
            <p className="text-cream/20 text-[10px] font-sans text-center mt-3 leading-relaxed">By placing this order, you agree to our Terms & Return Policy.</p>
          </div>
        </div>
      </div>
    </div>
  );
}