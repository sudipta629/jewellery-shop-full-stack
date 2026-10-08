import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  SlidersHorizontal, X, Search, ChevronDown, Heart, ShoppingBag, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import { productApi, categoryApi, cartApi, type Product, type ProductFilters } from '../api/services';
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
    if (!isAuthenticated) { toast.error('Please sign in to add to cart'); return; }
    setAdding(true);
    try {
      await cartApi.addItem(product.id, 1);
      incrementCart();
      toast.success(`${product.name} added to cart`);
    } catch { toast.error('Could not add to cart'); }
    finally { setAdding(false); }
  };

  return (
    <Link to={`/product/${product.id}`} className="product-card block group">
      <div className="relative overflow-hidden aspect-[3/4] bg-dark-800">
        {product.primary_image_url ? (
          <img src={product.primary_image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><span className="text-gold-500/20 text-5xl font-display">J</span></div>
        )}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.is_new_arrival && <span className="badge-gold text-[10px]">New</span>}
          {product.is_featured && <span className="badge bg-gold-500/30 text-gold-400 border border-gold-500/40 text-[10px]">Featured</span>}
          {!product.in_stock && <span className="badge-red text-[10px]">Out of Stock</span>}
        </div>
        <button onClick={(e) => toggleWishlist(product.id, e)} aria-label="Toggle wishlist" className="absolute top-3 right-3 w-8 h-8 bg-dark-800/70 backdrop-blur-sm flex items-center justify-center border border-gold-500/20 hover:border-gold-500 transition-all duration-300">
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
        {product.price ? (
          <p className="text-gold-500 font-semibold font-sans text-base">₹{parseFloat(product.price.total).toLocaleString('en-IN')}</p>
        ) : (
          <p className="text-cream/30 text-sm">Price unavailable</p>
        )}
      </div>
    </Link>
  );
}

function ProductSkeleton() {
  return (
    <div className="product-card">
      <div className="skeleton aspect-[3/4] w-full" />
      <div className="p-4 space-y-2">
        <div className="skeleton h-3 w-1/2" /><div className="skeleton h-4 w-3/4" /><div className="skeleton h-5 w-1/3 mt-2" />
      </div>
    </div>
  );
}

interface FiltersState {
  q: string; category_id: string; metal_type: string; purity: string;
  gender: string; occasion: string; in_stock: boolean; is_featured: boolean; is_new_arrival: boolean; sort: string;
}

const DEFAULT_FILTERS: FiltersState = {
  q: '', category_id: '', metal_type: '', purity: '', gender: '',
  occasion: '', in_stock: false, is_featured: false, is_new_arrival: false, sort: 'created_at_desc',
};

function FilterPanel({ filters, setFilters, categories, onClose }: {
  filters: FiltersState; setFilters: (f: FiltersState) => void; categories: any[]; onClose?: () => void;
}) {
  const set = (key: keyof FiltersState, val: any) => setFilters({ ...filters, [key]: val });
  const SelectFilter = ({ label, field, options }: { label: string; field: keyof FiltersState; options: { value: string; label: string }[] }) => (
    <div>
      <label className="block text-cream/50 text-xs uppercase tracking-widest mb-2 font-sans">{label}</label>
      <div className="relative">
        <select value={filters[field] as string} onChange={e => set(field, e.target.value)} className="w-full bg-dark-700 border border-gold-500/20 text-cream text-sm font-sans py-2.5 px-3 appearance-none focus:outline-none focus:border-gold-500 transition-colors">
          <option value="">All</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/30 pointer-events-none" />
      </div>
    </div>
  );
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-serif text-cream font-semibold">Filters</h3>
        <button onClick={() => setFilters(DEFAULT_FILTERS)} className="text-gold-500/60 text-xs hover:text-gold-500 transition-colors">Clear All</button>
      </div>
      <SelectFilter label="Category" field="category_id" options={categories.map(c => ({ value: String(c.id), label: c.name }))} />
      <SelectFilter label="Metal Type" field="metal_type" options={[{ value: 'Gold', label: 'Gold' }, { value: 'Silver', label: 'Silver' }, { value: 'Platinum', label: 'Platinum' }, { value: 'Diamond', label: 'Diamond' }]} />
      <SelectFilter label="Purity" field="purity" options={[{ value: '24K', label: '24K' }, { value: '22K', label: '22K' }, { value: '18K', label: '18K' }, { value: '14K', label: '14K' }, { value: '925', label: '925 Silver' }, { value: '999', label: '999 Silver' }]} />
      <SelectFilter label="Gender" field="gender" options={[{ value: 'women', label: "Women's" }, { value: 'men', label: "Men's" }, { value: 'unisex', label: 'Unisex' }]} />
      <SelectFilter label="Occasion" field="occasion" options={[{ value: 'daily', label: 'Daily Wear' }, { value: 'bridal', label: 'Bridal' }, { value: 'festive', label: 'Festive' }, { value: 'office', label: 'Office' }]} />
      <div className="space-y-3">
        {[{ key: 'in_stock', label: 'In Stock Only' }, { key: 'is_featured', label: 'Featured Only' }, { key: 'is_new_arrival', label: 'New Arrivals' }].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-3 cursor-pointer group">
            <div onClick={() => set(key as keyof FiltersState, !filters[key as keyof FiltersState])} className={`w-5 h-5 border flex items-center justify-center transition-all duration-200 flex-shrink-0 ${filters[key as keyof FiltersState] ? 'bg-gold-500 border-gold-500' : 'border-gold-500/30 group-hover:border-gold-500'}`}>
              {filters[key as keyof FiltersState] && <X size={10} className="text-dark-800" strokeWidth={3} />}
            </div>
            <span className="text-cream/60 text-sm font-sans group-hover:text-cream transition-colors">{label}</span>
          </label>
        ))}
      </div>
      {onClose && <button onClick={onClose} className="btn-primary w-full justify-center mt-4">Apply Filters</button>}
    </div>
  );
}

const SORT_OPTIONS = [
  { value: 'created_at_desc', label: 'Newest First' }, { value: 'created_at_asc', label: 'Oldest First' },
  { value: 'name_asc', label: 'Name A–Z' }, { value: 'name_desc', label: 'Name Z–A' },
];

export default function ShopPage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<FiltersState>({
    ...DEFAULT_FILTERS,
    q: searchParams.get('q') || '',
    is_featured: searchParams.get('is_featured') === 'true',
    is_new_arrival: searchParams.get('is_new_arrival') === 'true',
    category_id: searchParams.get('category_id') || '',
  });
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const apiFilters: ProductFilters = {
    q: filters.q || undefined,
    category_id: filters.category_id ? Number(filters.category_id) : undefined,
    metal_type: filters.metal_type || undefined,
    purity: filters.purity || undefined,
    gender: filters.gender || undefined,
    occasion: filters.occasion || undefined,
    in_stock: filters.in_stock || undefined,
    is_featured: filters.is_featured || undefined,
    is_new_arrival: filters.is_new_arrival || undefined,
    sort: filters.sort,
    page,
    per_page: 20,
  };

  const { data, isLoading } = useQuery({ queryKey: ['shop-products', apiFilters], queryFn: () => productApi.list(apiFilters) });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: categoryApi.list });
  const products = data?.items ?? [];
  const pagination = data?.pagination;

  const handleFiltersChange = (f: FiltersState) => { setFilters(f); setPage(1); };

  return (
    <div className="min-h-screen bg-dark-800 page-enter">
      <div className="bg-dark-900/60 border-b border-gold-500/10 py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="section-subtitle mb-2">Our Collection</p>
          <h1 className="section-title">Shop All Jewellery</h1>
          <div className="gold-divider-left mt-3" />
          <div className="relative mt-6 max-w-lg">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/30" />
            <input type="text" value={filters.q} onChange={e => handleFiltersChange({ ...filters, q: e.target.value })} placeholder="Search products, SKUs, metals…" className="input pl-10 w-full" />
            {filters.q && <button onClick={() => handleFiltersChange({ ...filters, q: '' })} className="absolute right-4 top-1/2 -translate-y-1/2 text-cream/30 hover:text-gold-500"><X size={14} /></button>}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="card p-6 sticky top-24">
              <FilterPanel filters={filters} setFilters={handleFiltersChange} categories={categories} />
            </div>
          </aside>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setDrawerOpen(true)} className="lg:hidden flex items-center gap-2 border border-gold-500/30 px-4 py-2 text-cream/70 text-sm hover:border-gold-500 transition-colors">
                  <Filter size={14} /> Filters
                </button>
                <p className="text-cream/40 text-sm font-sans">{isLoading ? '…' : `${pagination?.total ?? 0} products`}</p>
              </div>
              <div className="relative">
                <select value={filters.sort} onChange={e => handleFiltersChange({ ...filters, sort: e.target.value })} className="bg-dark-700 border border-gold-500/20 text-cream text-sm font-sans py-2 pl-3 pr-8 appearance-none focus:outline-none focus:border-gold-500 transition-colors">
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/30 pointer-events-none" />
              </div>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => <ProductSkeleton key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-cream/20 text-5xl mb-4">✦</p>
                <h3 className="font-serif text-cream text-xl mb-2">No products found</h3>
                <p className="text-cream/40 text-sm">Try adjusting your filters or search terms.</p>
                <button onClick={() => handleFiltersChange(DEFAULT_FILTERS)} className="btn-ghost mt-6">Clear Filters</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map((p, i) => (
                    <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.5) }}>
                      <ProductCard product={p} />
                    </motion.div>
                  ))}
                </div>
                {pagination && pagination.total_pages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost px-4 py-2 text-xs disabled:opacity-30">← Prev</button>
                    {Array.from({ length: Math.min(pagination.total_pages, 7) }, (_, i) => i + 1).map(p => (
                      <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 text-sm font-sans border transition-all duration-200 ${p === page ? 'bg-gold-500 text-dark-800 border-gold-500' : 'border-gold-500/20 text-cream/60 hover:border-gold-500 hover:text-gold-500'}`}>{p}</button>
                    ))}
                    <button onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))} disabled={page === pagination.total_pages} className="btn-ghost px-4 py-2 text-xs disabled:opacity-30">Next →</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} className="absolute left-0 top-0 bottom-0 w-80 bg-dark-800 border-r border-gold-500/10 overflow-y-auto p-6">
            <FilterPanel filters={filters} setFilters={handleFiltersChange} categories={categories} onClose={() => setDrawerOpen(false)} />
          </motion.div>
        </div>
      )}
    </div>
  );
}