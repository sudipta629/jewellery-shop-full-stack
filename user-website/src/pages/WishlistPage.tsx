import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { wishlistApi, cartApi, type WishlistItem } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useCartStore } from '../store/cartStore';

function WishlistCard({ item, onRemove }: { item: WishlistItem; onRemove: (id: number) => void }) {
  const { incrementCart } = useCartStore();
  const [adding, setAdding] = React.useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    setAdding(true);
    try { await cartApi.addItem(item.product_id, 1); incrementCart(); toast.success('Added to cart'); }
    catch { toast.error('Could not add'); } finally { setAdding(false); }
  };

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="product-card group relative">
      <Link to={`/product/${item.product_id}`} className="block">
        <div className="relative overflow-hidden aspect-[3/4] bg-dark-800">
          {item.primary_image_url ? <img src={item.primary_image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            : <div className="w-full h-full flex items-center justify-center"><span className="text-gold-500/20 text-4xl font-display">J</span></div>}
          {!item.in_stock && <div className="absolute inset-0 bg-dark-900/60 flex items-center justify-center"><span className="badge-red text-xs">Out of Stock</span></div>}
        </div>
        <div className="p-4">
          <p className="text-gold-500/60 text-[10px] font-sans uppercase tracking-widest mb-1">{item.metal_type}{item.purity ? ` · ${item.purity}` : ''}</p>
          <h3 className="text-cream font-serif text-sm font-medium line-clamp-2 mb-2">{item.name}</h3>
          {item.price ? <p className="text-gold-500 font-semibold font-sans">₹{parseFloat(item.price).toLocaleString('en-IN')}</p> : <p className="text-cream/30 text-sm">Price unavailable</p>}
        </div>
      </Link>
      <div className="p-4 pt-0 flex gap-2">
        <button onClick={handleAddToCart} disabled={adding || !item.in_stock} className="flex-1 bg-dark-700 border border-gold-500/20 hover:border-gold-500 text-cream/70 hover:text-gold-500 text-xs font-sans py-2 flex items-center justify-center gap-1.5 transition-all disabled:opacity-40">
          <ShoppingBag size={13} />{adding ? 'Adding…' : 'Add to Cart'}
        </button>
        <button onClick={() => onRemove(item.product_id)} className="w-9 h-9 border border-gold-500/10 hover:border-red-400 hover:text-red-400 text-cream/30 flex items-center justify-center transition-all">
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  );
}

export default function WishlistPage() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({ queryKey: ['wishlist'], queryFn: wishlistApi.get, enabled: isAuthenticated });
  const removeMutation = useMutation({
    mutationFn: (product_id: number) => wishlistApi.remove(product_id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['wishlist'] }); toast.success('Removed from wishlist'); },
    onError: () => toast.error('Could not remove'),
  });

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-dark-800 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <Heart size={48} className="text-gold-500/20 mx-auto mb-6" />
        <h1 className="font-display text-3xl text-cream mb-3">Your Wishlist</h1>
        <p className="text-cream/40 font-sans text-sm mb-8">Sign in to see your saved items.</p>
        <Link to="/login" className="btn-primary">Sign In</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-800 page-enter">
      <div className="bg-dark-900/60 border-b border-gold-500/10 py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="section-subtitle mb-2">Saved</p>
          <h1 className="section-title">My Wishlist</h1>
          <div className="gold-divider-left mt-3" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-10">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="product-card"><div className="skeleton aspect-[3/4] w-full" /><div className="p-4 space-y-2"><div className="skeleton h-3 w-1/2" /><div className="skeleton h-4 w-3/4" /></div></div>)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-24">
            <Heart size={48} className="text-gold-500/20 mx-auto mb-6" />
            <h2 className="font-serif text-cream text-2xl mb-3">Your wishlist is empty</h2>
            <p className="text-cream/40 font-sans text-sm mb-8">Save pieces you love and come back to them anytime.</p>
            <Link to="/shop" className="btn-primary">Browse Collection <ArrowRight size={16} /></Link>
          </div>
        ) : (
          <>
            <p className="text-cream/40 text-sm font-sans mb-6">{items.length} saved item{items.length !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <AnimatePresence>
                {items.map(item => (
                  <WishlistCard key={item.wishlist_item_id} item={item} onRemove={(id) => removeMutation.mutate(id)} />
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  );
}