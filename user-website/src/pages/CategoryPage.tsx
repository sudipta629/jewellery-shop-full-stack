import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { productApi, categoryApi, cartApi, type Product } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useCartStore } from '../store/cartStore';
import { useWishlist } from '../hooks/useWishlist';

function ProductCard({ product }: { product: Product }) {
  const { isAuthenticated } = useAuth();
  const { incrementCart } = useCartStore();
  const { wishlistedIds, toggle: toggleWishlist } = useWishlist();
  const [adding, setAdding] = useState(false);
  const wishlisted = wishlistedIds.has(product.id);
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please sign in'); return; }
    setAdding(true);
    try { await cartApi.addItem(product.id, 1); incrementCart(); toast.success('Added to cart'); }
    catch { toast.error('Could not add'); } finally { setAdding(false); }
  };
  return (
    <Link to={`/product/${product.id}`} className="product-card block group">
      <div className="relative overflow-hidden aspect-[3/4] bg-dark-800">
        {product.primary_image_url
          ? <img src={product.primary_image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          : <div className="w-full h-full flex items-center justify-center"><span className="text-gold-500/20 text-5xl font-display">J</span></div>}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.is_new_arrival && <span className="badge-gold text-[10px]">New</span>}
          {!product.in_stock && <span className="badge-red text-[10px]">Out of Stock</span>}
        </div>
        <button onClick={(e) => toggleWishlist(product.id, e)} className="absolute top-3 right-3 w-8 h-8 bg-dark-800/70 backdrop-blur-sm flex items-center justify-center border border-gold-500/20 hover:border-gold-500 transition-all duration-300">
          <Heart size={15} className={wishlisted ? 'text-gold-500 fill-gold-500' : 'text-cream/60'} />
        </button>
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button onClick={handleAddToCart} disabled={adding || !product.in_stock} className="w-full bg-gold-500 text-dark-800 py-3 text-xs font-sans font-semibold uppercase tracking-widest hover:bg-gold-400 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
            <ShoppingBag size={14} />{adding ? 'Adding…' : 'Add to Cart'}
          </button>
        </div>
      </div>
      <div className="p-4">
        <p className="text-gold-500/60 text-[10px] font-sans uppercase tracking-widest mb-1">{product.metal_type}{product.purity ? ` · ${product.purity}` : ''}</p>
        <h3 className="text-cream font-serif text-sm font-medium leading-snug mb-2 line-clamp-2">{product.name}</h3>
        {product.price ? <p className="text-gold-500 font-semibold font-sans text-base">₹{parseFloat(product.price.total).toLocaleString('en-IN')}</p> : <p className="text-cream/30 text-sm">Price unavailable</p>}
      </div>
    </Link>
  );
}

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState(1);

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: categoryApi.list });
  const category = categories.find(c => c.slug === slug);

  const { data, isLoading } = useQuery({
    queryKey: ['category-products', slug, page],
    queryFn: () => productApi.list({ category_slug: slug, page, per_page: 20 }),
    enabled: !!slug,
  });

  const products = data?.items ?? [];
  const pagination = data?.pagination;

  return (
    <div className="min-h-screen bg-dark-800 page-enter">
      {/* Category hero */}
      <div className="relative bg-dark-900/80 border-b border-gold-500/10 py-16 px-4 overflow-hidden">
        {category?.image_url && (
          <img src={category.image_url} alt={category.name} className="absolute inset-0 w-full h-full object-cover opacity-10" />
        )}
        <div className="relative max-w-7xl mx-auto">
          <nav className="flex items-center gap-2 text-cream/30 text-xs font-sans mb-6">
            <Link to="/" className="hover:text-gold-500 transition-colors">Home</Link>
            <span>/</span>
            <Link to="/shop" className="hover:text-gold-500 transition-colors">Shop</Link>
            <span>/</span>
            <span className="text-gold-500">{category?.name ?? slug}</span>
          </nav>
          <p className="section-subtitle mb-2">{category?.name ?? slug}</p>
          <h1 className="section-title">{category?.name ?? 'Category'}</h1>
          <div className="gold-divider-left mt-3 mb-4" />
          {category?.description && (
            <p className="text-cream/50 font-sans text-sm max-w-lg leading-relaxed">{category.description}</p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <p className="text-cream/40 text-sm font-sans">{isLoading ? '…' : `${pagination?.total ?? 0} products`}</p>
          <Link to="/shop" className="btn-text text-xs">
            Browse All <ArrowRight size={13} />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="product-card"><div className="skeleton aspect-[3/4] w-full" /><div className="p-4 space-y-2"><div className="skeleton h-3 w-1/2" /><div className="skeleton h-4 w-3/4" /></div></div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-cream/20 text-5xl mb-4">✦</p>
            <h3 className="font-serif text-cream text-xl mb-2">No products in this category</h3>
            <Link to="/shop" className="btn-ghost mt-6 inline-flex">Browse All Products</Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.4) }}>
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
            {pagination && pagination.total_pages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost px-4 py-2 text-xs disabled:opacity-30">← Prev</button>
                {Array.from({ length: Math.min(pagination.total_pages, 7) }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 text-sm font-sans border transition-all ${p === page ? 'bg-gold-500 text-dark-800 border-gold-500' : 'border-gold-500/20 text-cream/60 hover:border-gold-500'}`}>{p}</button>
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