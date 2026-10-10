import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { offerApi } from '../api/services';
import { Tag, Sparkles, Percent } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function OffersPage() {
  const { data: offers, isLoading, isError } = useQuery({
    queryKey: ['offers'],
    queryFn: () => offerApi.list(),
  });

  return (
    <div className="min-h-screen bg-dark-900 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="font-serif italic text-gold-500/80 mb-2">Exclusive deals</p>
          <h1 className="text-4xl md:text-5xl font-display text-cream tracking-wider uppercase mb-6">
            Current Offers
          </h1>
          <div className="w-16 h-px bg-gold-500 mx-auto" />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="text-center text-red-400 py-10 font-sans">
            Failed to load offers. Please try again later.
          </div>
        ) : !offers || offers.length === 0 ? (
          <div className="text-center py-20 bg-dark-800/50 border border-gold-500/10 rounded-sm">
            <Sparkles size={32} className="mx-auto text-gold-500/50 mb-4" />
            <p className="text-cream/50 font-sans">There are no active offers at the moment.</p>
            <p className="text-cream/30 text-sm mt-2">Check back later for exciting discounts!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer) => (
              <div 
                key={offer.id} 
                className="bg-dark-800 border border-gold-500/20 p-8 rounded-sm hover:border-gold-500/50 transition-colors duration-300 relative overflow-hidden group"
              >
                {/* Decorative background element */}
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-gold-500/5 rounded-full blur-2xl group-hover:bg-gold-500/10 transition-colors" />
                
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                    {offer.discount_type === 'percentage' ? (
                      <Percent size={20} className="text-gold-500" />
                    ) : (
                      <Tag size={20} className="text-gold-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-serif text-cream mb-1">{offer.title}</h3>
                    <p className="text-2xl font-bold font-sans text-gold-400">
                      {offer.discount_type === 'percentage' 
                        ? `${offer.discount_value}% OFF` 
                        : `₹${offer.discount_value} OFF`}
                    </p>
                  </div>
                </div>
                
                {offer.description && (
                  <p className="text-cream/60 font-sans text-sm leading-relaxed mb-6">
                    {offer.description}
                  </p>
                )}

                <div className="mt-auto pt-6 border-t border-gold-500/10 flex items-center justify-between">
                  <span className="text-xs font-sans text-cream/40 uppercase tracking-wider">
                    {offer.applies_to === 'all' && 'Sitewide Offer'}
                    {offer.applies_to === 'category' && 'Selected Categories'}
                    {offer.applies_to === 'product' && 'Selected Products'}
                  </span>
                  
                  <Link 
                    to={
                      offer.applies_to === 'category' ? '/shop' : 
                      offer.applies_to === 'product' ? '/shop' : '/shop'
                    }
                    className="text-gold-500 text-sm font-sans hover:text-gold-400 transition-colors flex items-center gap-1 group-hover:gap-2"
                  >
                    Shop Now <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}