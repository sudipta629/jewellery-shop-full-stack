import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Zap, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Package, Shield, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { productApi, cartApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useCartStore } from '../store/cartStore';
import { useWishlist } from '../hooks/useWishlist';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { incrementCart } = useCartStore();

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { wishlistedIds, toggle: toggleWishlist } = useWishlist();
  const [addingCart, setAddingCart] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showCare, setShowCare] = useState(false);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.get(Number(id)),
    enabled: !!id,
  });

  const { data: related } = useQuery({
    queryKey: ['related-products', product?.category_id],
    queryFn: () => productApi.list({ category_id: product?.category_id, per_page: 5 }),
    enabled: !!product?.category_id,
  });

  const handleAddToCart = async () => {
    if (!isAuthenticated) { toast.error('Please sign in to add to cart'); return; }
    if (!product?.in_stock) return;
    setAddingCart(true);
    try { await cartApi.addItem(product!.id, quantity); incrementCart(); toast.success(`${product!.name} added to cart`); }
    catch (err: any) { toast.error(err.response?.data?.error?.message || 'Could not add to cart'); }
    finally { setAddingCart(false); }
  };

  const handleBuyNow = async () => { await handleAddToCart(); navigate('/checkout'); };


  if (isLoading) return (
    <div className="min-h-screen bg-dark-800 px-4 py-10 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="skeleton aspect-square w-full" />
        <div className="space-y-5"><div className="skeleton h-6 w-1/2" /><div className="skeleton h-10 w-3/4" /><div className="skeleton h-20 w-full" /><div className="skeleton h-12 w-full" /></div>
      </div>
    </div>
  );

  if (isError || !product) return (
    <div className="min-h-screen bg-dark-800 flex items-center justify-center">
      <div className="text-center">
        <p className="text-cream/20 text-6xl mb-4">✦</p>
        <h2 className="font-serif text-cream text-xl mb-2">Product not found</h2>
        <Link to="/shop" className="btn-ghost mt-4 inline-flex">Browse Shop</Link>
      </div>
    </div>
  );

  const images = product.images.length > 0 ? product.images : [];
  const mainImg = images[selectedImage]?.url || product.primary_image_url;
  const relatedProducts = (related?.items ?? []).filter(p => p.id !== product.id).slice(0, 4);

  return (
    <div className="min-h-screen bg-dark-800 page-enter">
      <div className="border-b border-gold-500/10 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-xs font-sans text-cream/30">
          <Link to="/" className="hover:text-gold-500 transition-colors">Home</Link><span>/</span>
          <Link to="/shop" className="hover:text-gold-500 transition-colors">Shop</Link>
          {product.category_name && <><span>/</span><span className="text-gold-500">{product.category_name}</span></>}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Image Gallery */}
          <div>
            <div className="relative aspect-square bg-dark-700 border border-gold-500/10 overflow-hidden mb-3 group">
              {mainImg ? <img src={mainImg} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                : <div className="w-full h-full flex items-center justify-center"><span className="text-gold-500/20 text-9xl font-display">J</span></div>}
              {!product.in_stock && (
                <div className="absolute inset-0 bg-dark-900/60 flex items-center justify-center">
                  <span className="badge-red text-sm px-4 py-1.5">Out of Stock</span>
                </div>
              )}
              {images.length > 1 && (<>
                <button onClick={() => setSelectedImage(i => (i - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-dark-800/70 backdrop-blur-sm border border-gold-500/20 flex items-center justify-center text-cream/60 hover:text-gold-500 transition-all"><ChevronLeft size={16} /></button>
                <button onClick={() => setSelectedImage(i => (i + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-dark-800/70 backdrop-blur-sm border border-gold-500/20 flex items-center justify-center text-cream/60 hover:text-gold-500 transition-all"><ChevronRight size={16} /></button>
              </>)}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button key={img.id} onClick={() => setSelectedImage(i)} className={`flex-shrink-0 w-16 h-16 border overflow-hidden transition-all ${i === selectedImage ? 'border-gold-500' : 'border-gold-500/10 hover:border-gold-500/50'}`}>
                    <img src={img.url} alt={product.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div className="flex gap-2">
              {product.is_new_arrival && <span className="badge-gold">New Arrival</span>}
              {product.in_stock ? <span className="badge-green">In Stock</span> : <span className="badge-red">Out of Stock</span>}
            </div>
            <div>
              <p className="text-gold-500/60 text-xs font-sans uppercase tracking-widest mb-2">{product.metal_type}{product.purity ? ` · ${product.purity}` : ''}{product.category_name ? ` · ${product.category_name}` : ''}</p>
              <h1 className="font-display text-3xl md:text-4xl text-cream font-semibold leading-tight">{product.name}</h1>
              <p className="text-cream/30 text-xs font-mono mt-2">SKU: {product.sku}</p>
            </div>

            {product.price ? (
              <div className="border border-gold-500/10 bg-dark-700/30 p-5">
                <p className="text-cream/40 text-xs font-sans uppercase tracking-widest mb-1">Price</p>
                <p className="text-4xl font-display text-cream font-semibold">₹{parseFloat(product.price.total).toLocaleString('en-IN')}</p>
                <p className="text-gold-500/50 text-xs font-sans mt-1">Incl. {product.price.tax_percent}% GST</p>
                <button onClick={() => setShowBreakdown(!showBreakdown)} className="flex items-center gap-1.5 text-gold-500/70 text-xs font-sans mt-3 hover:text-gold-500 transition-colors">
                  {showBreakdown ? <ChevronUp size={13} /> : <ChevronDown size={13} />}{showBreakdown ? 'Hide' : 'View'} price breakdown
                </button>
                {showBreakdown && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-2 border-t border-gold-500/10 pt-4">
                    {[
                      { label: 'Metal Value', value: product.price.metal_value },
                      { label: 'Making Charge', value: product.price.making_charge },
                      ...(parseFloat(product.price.stone_charge) > 0 ? [{ label: 'Stone Charge', value: product.price.stone_charge }] : []),
                      { label: `GST (${product.price.tax_percent}%)`, value: product.price.tax_amount },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between text-xs font-sans">
                        <span className="text-cream/40">{label}</span><span className="text-cream/70">₹{parseFloat(value).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-sans pt-2 border-t border-gold-500/10">
                      <span className="text-cream font-medium">Total</span><span className="text-gold-500 font-semibold">₹{parseFloat(product.price.total).toLocaleString('en-IN')}</span>
                    </div>
                    <p className="text-cream/20 text-[10px] mt-2">Rate: ₹{parseFloat(product.price.rate_per_gram).toLocaleString('en-IN')}/g · Weight: {product.price.net_weight}g</p>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="border border-gold-500/10 bg-dark-700/30 p-5"><p className="text-cream/30 text-sm">Price unavailable — metal rates not configured.</p></div>
            )}

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-cream/50 text-xs font-sans uppercase tracking-widest">Qty</label>
                <div className="flex items-center border border-gold-500/20">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center text-cream/60 hover:text-gold-500 border-r border-gold-500/20">−</button>
                  <span className="w-12 text-center text-cream font-sans text-sm">{quantity}</span>
                  <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} className="w-10 h-10 flex items-center justify-center text-cream/60 hover:text-gold-500 border-l border-gold-500/20">+</button>
                </div>
                {product.stock > 0 && product.stock <= 5 && <span className="text-amber-400 text-xs">Only {product.stock} left!</span>}
              </div>
              <div className="flex gap-3">
                <button onClick={handleAddToCart} disabled={addingCart || !product.in_stock} className="flex-1 btn-primary justify-center"><ShoppingBag size={16} />{addingCart ? 'Adding…' : 'Add to Cart'}</button>
                <button onClick={() => product && toggleWishlist(product.id)} className={`w-12 h-12 border flex items-center justify-center transition-all duration-300 ${product && wishlistedIds.has(product.id) ? 'bg-gold-500/20 border-gold-500 text-gold-500' : 'border-gold-500/20 text-cream/40 hover:border-gold-500 hover:text-gold-500'}`}>
                  <Heart size={18} className={product && wishlistedIds.has(product.id) ? 'fill-gold-500' : ''} />
                </button>
              </div>
              {product.in_stock && <button onClick={handleBuyNow} className="w-full btn-ghost justify-center"><Zap size={16} /> Buy Now</button>}
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-gold-500/10 pt-5">
              {[{ icon: Shield, text: 'BIS Hallmarked' }, { icon: RotateCcw, text: '15-Day Return' }, { icon: Package, text: 'Insured Delivery' }].map(({ icon: Icon, text }) => (
                <div key={text} className="flex flex-col items-center gap-2 text-center">
                  <Icon size={18} className="text-gold-500/60" /><p className="text-cream/40 text-[10px] font-sans uppercase tracking-wide">{text}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-gold-500/10 pt-5 space-y-2">
              {[{ label: 'Metal Type', value: product.metal_type }, { label: 'Purity', value: product.purity }, { label: 'Gross Weight', value: product.gross_weight ? `${product.gross_weight}g` : null }, { label: 'Net Weight', value: product.net_weight ? `${product.net_weight}g` : null }, { label: 'Gender', value: product.gender }, { label: 'Occasion', value: product.occasion }].filter(s => s.value).map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm font-sans py-1.5 border-b border-gold-500/5">
                  <span className="text-cream/40">{label}</span><span className="text-cream/80 capitalize">{value}</span>
                </div>
              ))}
            </div>

            {product.care_info && (
              <div className="border border-gold-500/10">
                <button onClick={() => setShowCare(!showCare)} className="w-full flex items-center justify-between px-4 py-3 text-cream/60 hover:text-cream transition-colors">
                  <span className="font-sans text-sm">Jewellery Care</span>
                  {showCare ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
                {showCare && <div className="px-4 pb-4 text-cream/50 text-sm font-sans leading-relaxed border-t border-gold-500/10">{product.care_info}</div>}
              </div>
            )}

            {product.description && (
              <div className="border-t border-gold-500/10 pt-5">
                <h3 className="font-serif text-cream font-semibold mb-3">About This Piece</h3>
                <p className="text-cream/50 text-sm font-sans leading-relaxed">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-20">
            <p className="section-subtitle mb-2">More to Explore</p>
            <h2 className="section-title text-2xl mb-6">You May Also Like</h2>
            <div className="gold-divider-left mb-8" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {relatedProducts.map(p => (
                <Link key={p.id} to={`/product/${p.id}`} className="product-card block group">
                  <div className="relative overflow-hidden aspect-[3/4] bg-dark-800">
                    {p.primary_image_url ? <img src={p.primary_image_url} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      : <div className="w-full h-full flex items-center justify-center"><span className="text-gold-500/20 text-4xl font-display">J</span></div>}
                  </div>
                  <div className="p-3">
                    <p className="text-gold-500/60 text-[10px] font-sans uppercase tracking-widest mb-1">{p.metal_type}</p>
                    <p className="text-cream text-sm font-serif line-clamp-2">{p.name}</p>
                    {p.price && <p className="text-gold-500 text-sm font-semibold mt-1">₹{parseFloat(p.price.total).toLocaleString('en-IN')}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}