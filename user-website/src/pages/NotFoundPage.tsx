import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-dark-800 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="relative mb-8">
          <p className="font-display text-[8rem] leading-none text-gold-500/10 select-none">404</p>
          <div className="absolute inset-0 flex items-center justify-center">
            <Crown size={40} className="text-gold-500/30" />
          </div>
        </div>
        <p className="section-subtitle mb-2">Oops!</p>
        <h1 className="section-title mb-4">Page Not Found</h1>
        <div className="gold-divider mb-6" />
        <p className="text-cream/40 font-sans text-sm leading-relaxed mb-8">
          The page you're looking for doesn't exist or has been moved. Let us help you find something beautiful.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/" className="btn-primary"><ArrowLeft size={16} /> Back to Home</Link>
          <Link to="/shop" className="btn-ghost">Browse Shop</Link>
        </div>
      </div>
    </div>
  );
}