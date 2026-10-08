import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Heart, ShoppingBag, Star, Shield, Truck, RotateCcw, Award } from 'lucide-react';
import { useState, useEffect } from 'react';

import { bannerApi, categoryApi, productApi, ratesApi } from '../api/services';
import type { Product, Category, Banner, MetalRate } from '../api/services';
import { cartApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useCartStore } from '../store/cartStore';
import { useWishlist } from '../hooks/useWishlist';
import toast from 'react-hot-toast';

// ─── Sub-components ───────────────────────────────────────────────────────

function ProductSkeleton() {
  return (
    <div className="product-card">
      <div className="skeleton aspect-[3/4] w-full" />
      <div className="p-4 space-y-2">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
        <div className="skeleton h-5 w-1/3 mt-2" />
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const { incrementCart } = useCartStore();
  const { wishlistedIds, toggle: toggleWishlist } = useWishlist();
  const [adding, setAdding] = useState(false);
  const wishlisted = wishlistedIds.has(product.id);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await cartApi.addItem(product.id, 1);
      incrementCart();
      toast.success(`${product.name} added to cart`);
    } catch {
      toast.error('Could not add to cart');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Link to={`/product/${product.id}`} className="product-card block">
      {/* Image */}
      <div className="relative overflow-hidden aspect-[3/4] bg-dark-800">
        {product.primary_image_url ? (
          <img
            src={product.primary_image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gold-500/20 text-5xl font-display">J</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.is_new_arrival && (
            <span className="badge-gold text-[10px]">New</span>
          )}
          {product.is_featured && (
            <span className="badge bg-gold-500/30 text-gold-400 border border-gold-500/40 text-[10px]">Featured</span>
          )}
          {!product.in_stock && (
            <span className="badge-red text-[10px]">Out of Stock</span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={(e) => toggleWishlist(product.id, e)}
          aria-label="Toggle wishlist"
          className="absolute top-3 right-3 w-8 h-8 bg-dark-800/70 backdrop-blur-sm flex items-center justify-center
                     border border-gold-500/20 hover:border-gold-500 transition-all duration-300"
        >
          <Heart
            size={15}
            className={wishlisted ? 'text-gold-500 fill-gold-500' : 'text-cream/60'}
          />
        </button>

        {/* Quick add */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={handleAddToCart}
            disabled={adding || !product.in_stock}
            className="w-full bg-gold-500 text-dark-800 py-3 text-xs font-sans font-semibold uppercase tracking-widest
                       hover:bg-gold-400 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingBag size={14} />
            {adding ? 'Adding…' : 'Add to Cart'}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-gold-500/60 text-[10px] font-sans uppercase tracking-widest mb-1">
          {product.metal_type}{product.purity ? ` · ${product.purity}` : ''}
        </p>
        <h3 className="text-cream font-serif text-sm font-medium leading-snug mb-2 line-clamp-2">
          {product.name}
        </h3>
        {product.price ? (
          <p className="text-gold-500 font-semibold font-sans text-base">
            ₹{parseFloat(product.price.total).toLocaleString('en-IN')}
          </p>
        ) : (
          <p className="text-cream/30 text-sm">Price unavailable</p>
        )}
      </div>
    </Link>
  );
}

// ─── Hero Slider ──────────────────────────────────────────────────────────

function HeroSlider({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrent((c) => (c + 1) % Math.max(banners.length, 1)), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  // Fallback hero when no banners
  const slides = banners.length > 0 ? banners : [null];

  return (
    <section className="relative h-[75vh] lg:h-[90vh] overflow-hidden bg-dark-800">
      {slides.map((banner, i) => (
        <motion.div
          key={i}
          initial={false}
          animate={{ opacity: i === current ? 1 : 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          {banner?.image_url ? (
            <img
              src={banner.image_url}
              alt={banner.title}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            // Fallback gradient background
            <div className="w-full h-full bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700" />
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-hero-overlay" />

          {/* Content */}
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 w-full">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: i === current ? 1 : 0, y: i === current ? 0 : 30 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="max-w-lg"
              >
                <p className="section-subtitle mb-3">Timeless Elegance</p>
                <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-cream font-bold leading-tight mb-4">
                  {banner?.title ?? (
                    <>
                      Jewelry<br />
                      That Tells<br />
                      <span className="text-gold-500">Your Story</span>
                    </>
                  )}
                </h1>
                <p className="text-cream/70 font-serif text-lg mb-8">
                  {banner?.subtitle ?? 'Classic designs. Modern you.'}
                </p>
                <Link
                  to={banner?.cta_url ?? '/shop'}
                  className="btn-ghost uppercase text-sm"
                >
                  {banner?.cta_text ?? 'Explore Collection'}
                  <ArrowRight size={16} />
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === current ? 'bg-gold-500 w-6' : 'bg-cream/30'
              }`}
            />
          ))}
        </div>
      )}

      {/* Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((c) => (c - 1 + slides.length) % slides.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 border border-cream/20
                       flex items-center justify-center text-cream/60 hover:text-gold-500 hover:border-gold-500 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setCurrent((c) => (c + 1) % slides.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 border border-cream/20
                       flex items-center justify-center text-cream/60 hover:text-gold-500 hover:border-gold-500 transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}
    </section>
  );
}

// ─── Category Circles ─────────────────────────────────────────────────────

function CategorySection({ categories }: { categories: Category[] }) {
  return (
    <section className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-6 sm:gap-8 overflow-x-auto pb-4 scrollbar-hide justify-start sm:justify-center">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex-shrink-0 flex flex-col items-center gap-3"
            >
              <Link
                to={`/category/${cat.slug}`}
                className="group"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-gold-500/30
                                group-hover:border-gold-500 transition-all duration-300 overflow-hidden
                                bg-dark-700 flex items-center justify-center">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gold-500/40 text-2xl font-display">{cat.name[0]}</span>
                  )}
                </div>
                <p className="text-center text-xs sm:text-sm font-sans text-cream/70
                               group-hover:text-gold-500 transition-colors duration-200 mt-2 max-w-[72px] leading-tight">
                  {cat.name}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Product Section ──────────────────────────────────────────────────────

function ProductSection({
  title, subtitle, products, viewAllLink, loading
}: {
  title: string;
  subtitle: string;
  products: Product[];
  viewAllLink: string;
  loading: boolean;
}) {
  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="section-subtitle mb-2">{subtitle}</p>
            <h2 className="section-title">{title}</h2>
            <div className="gold-divider-left" />
          </div>
          <Link to={viewAllLink} className="btn-text hidden sm:flex">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <ProductSkeleton key={i} />)
            : products.map((p) => <ProductCard key={p.id} product={p} />)
          }
        </div>
        <div className="mt-8 text-center sm:hidden">
          <Link to={viewAllLink} className="btn-ghost">View All</Link>
        </div>
      </div>
    </section>
  );
}

// ─── Rates Section ────────────────────────────────────────────────────────

function RatesSection({ rates }: { rates: MetalRate[] }) {
  const rateLabels: Record<string, string> = {
    'gold-24K': 'Gold 24K',
    'gold-22K': 'Gold 22K',
    'gold-18K': 'Gold 18K',
    'silver-999': 'Silver 999',
  };

  return (
    <section className="py-12 px-4 bg-dark-900/50 border-y border-gold-500/10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <p className="section-subtitle mb-1">Live Market</p>
          <h2 className="text-2xl font-display text-cream">Today's Rates</h2>
          <div className="gold-divider" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {rates.map((rate) => {
            const key = `${rate.metal}-${rate.purity}`;
            return (
              <div key={key} className="card text-center py-6 px-4">
                <p className="text-gold-500/60 text-xs uppercase tracking-widest font-sans mb-1">
                  {rateLabels[key] ?? `${rate.metal} ${rate.purity}`}
                </p>
                {rate.rate_per_gram ? (
                  <p className="text-2xl font-display text-cream font-semibold">
                    ₹{parseFloat(rate.rate_per_gram).toLocaleString('en-IN')}
                    <span className="text-xs text-cream/40 font-sans ml-1">/g</span>
                  </p>
                ) : (
                  <p className="text-cream/30 text-sm">Not available</p>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-center text-cream/30 text-xs mt-4 font-sans">
          Rates are updated by the admin. Final prices at checkout may vary.
        </p>
      </div>
    </section>
  );
}

// ─── Trust Section ────────────────────────────────────────────────────────

function TrustSection() {
  const features = [
    { icon: Shield, title: 'BIS Hallmarked', desc: 'All jewellery certified with BIS hallmark for guaranteed purity.' },
    { icon: Truck, title: 'Free Shipping', desc: 'Complimentary insured delivery on all orders above ₹5,000.' },
    { icon: RotateCcw, title: '15-Day Returns', desc: 'Easy hassle-free returns within 15 days of delivery.' },
    { icon: Award, title: '25+ Years Legacy', desc: 'Two decades of craftsmanship and trusted service.' },
  ];

  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="section-subtitle mb-2">Our Promise</p>
          <h2 className="section-title">Why Choose Jewélia</h2>
          <div className="gold-divider" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card p-6 text-center group"
            >
              <div className="w-14 h-14 rounded-full border border-gold-500/30 flex items-center justify-center
                              mx-auto mb-4 group-hover:border-gold-500 group-hover:bg-gold-500/10 transition-all duration-300">
                <Icon size={22} className="text-gold-500" />
              </div>
              <h3 className="font-serif text-cream font-semibold mb-2">{title}</h3>
              <p className="text-cream/50 text-sm font-sans leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Newsletter Section ───────────────────────────────────────────────────

function NewsletterSection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-r from-dark-900 via-dark-800 to-dark-900 border-y border-gold-500/10">
      <div className="max-w-2xl mx-auto text-center">
        <p className="section-subtitle mb-3">Stay Connected</p>
        <h2 className="section-title mb-3">Join the Jewélia Circle</h2>
        <div className="gold-divider mb-6" />
        <p className="text-cream/50 font-sans mb-8 leading-relaxed">
          Be the first to discover new collections, exclusive offers, and behind-the-scenes stories from our artisans.
        </p>
        <div className="flex gap-0 max-w-md mx-auto">
          <input
            type="email"
            placeholder="Your email address"
            className="flex-1 bg-dark-700 border border-gold-500/30 text-cream px-5 py-3.5 text-sm font-sans
                       placeholder:text-cream/30 focus:outline-none focus:border-gold-500 transition-colors"
          />
          <button className="bg-gold-500 text-dark-800 px-6 py-3.5 text-sm font-sans font-semibold uppercase tracking-widest
                             hover:bg-gold-400 transition-colors flex-shrink-0">
            Subscribe
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Main HomePage ────────────────────────────────────────────────────────

export default function HomePage() {
  const { data: banners = [], isLoading: bannersLoading } = useQuery({
    queryKey: ['banners'],
    queryFn: bannerApi.list,
  });

  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryApi.list,
  });

  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productApi.list({ is_featured: true, per_page: 8 }),
  });

  const { data: newArrivalsData, isLoading: newLoading } = useQuery({
    queryKey: ['products', 'new-arrivals'],
    queryFn: () => productApi.list({ is_new_arrival: true, per_page: 5 }),
  });

  const { data: rates = [] } = useQuery({
    queryKey: ['rates'],
    queryFn: ratesApi.getCurrent,
  });

  const { data: offersData } = useQuery({
    queryKey: ['products', 'offers'],
    queryFn: () => productApi.list({ per_page: 4, sort: 'created_at_desc' }),
  });

  return (
    <div className="page-enter">
      {/* Hero */}
      {!bannersLoading && <HeroSlider banners={banners} />}

      {/* Category circles */}
      {!catsLoading && categories.length > 0 && (
        <CategorySection categories={categories.slice(0, 8)} />
      )}

      {/* Featured */}
      <ProductSection
        title="Featured Collection"
        subtitle="Handpicked for You"
        products={featuredData?.items ?? []}
        viewAllLink="/shop?is_featured=true"
        loading={featuredLoading}
      />

      {/* Rates */}
      {rates.length > 0 && <RatesSection rates={rates} />}

      {/* New Arrivals */}
      <ProductSection
        title="New Arrivals"
        subtitle="Just In"
        products={newArrivalsData?.items ?? []}
        viewAllLink="/shop?is_new_arrival=true"
        loading={newLoading}
      />

      {/* Trust */}
      <TrustSection />

      {/* Newsletter */}
      <NewsletterSection />
    </div>
  );
}
