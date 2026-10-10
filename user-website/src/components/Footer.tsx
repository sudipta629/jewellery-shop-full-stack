import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, Share2, Rss, Video, Mail, Phone, MapPin, CreditCard } from 'lucide-react';


const footerLinks = {
  Shop: [
    { label: 'All Products', to: '/shop' },
    { label: 'Gold Jewellery', to: '/category/necklaces' },
    { label: 'Diamond', to: '/shop?metal_type=diamond' },
    { label: 'New Arrivals', to: '/shop?is_new_arrival=true' },
    { label: 'Offers', to: '/offers' },
  ],
  Account: [
    { label: 'My Profile', to: '/profile' },
    { label: 'My Orders', to: '/orders' },
    { label: 'Wishlist', to: '/wishlist' },
    { label: 'My Addresses', to: '/addresses' },
    { label: 'Sign In', to: '/login' },
  ],
  Help: [
    { label: 'About Us', to: '/about' },
    { label: 'Contact Us', to: '/contact' },
    { label: 'Shipping Policy', to: '/shipping' },
    { label: 'Return Policy', to: '/returns' },
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms & Conditions', to: '/terms' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-dark-900 border-t border-gold-500/10 mt-16">
      
      {/* Newsletter Section */}
      <div className="border-b border-gold-500/10 bg-dark-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center md:text-left">
            <h3 className="text-2xl font-serif text-cream mb-3">Join our Newsletter</h3>
            <p className="text-sm text-cream/60 font-sans leading-relaxed">
              Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
              Be the first to know about our new arrivals!
            </p>
          </div>
          <form className="flex w-full md:w-auto max-w-md gap-0 shadow-lg" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-1 bg-dark-900 border border-gold-500/30 text-cream px-5 py-3 focus:outline-none focus:border-gold-500 transition-colors w-full sm:w-64"
              required
            />
            <button
              type="submit"
              className="bg-gold-500 text-dark-900 px-8 py-3 font-medium hover:bg-gold-400 transition-colors tracking-wide uppercase text-sm"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Top section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Crown size={24} className="text-gold-500" />
              <span className="font-display text-2xl text-cream tracking-[0.15em] uppercase">
                Jew<span className="text-gold-500">é</span>lia
              </span>
            </div>
            <div className="w-12 h-px bg-gold-500 mb-6" />
            <p className="text-cream/50 text-sm font-sans leading-relaxed mb-8 max-w-sm">
              More than jewellery — it's a feeling. Crafted with love, worn with pride.
              Every piece tells a story of elegance and timeless beauty.
            </p>
            {/* Contact info */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-cream/70 text-sm hover:text-gold-500 transition-colors cursor-pointer">
                <Mail size={16} className="text-gold-500 flex-shrink-0" />
                <span>hello@jewelia.com</span>
              </div>
              <div className="flex items-center gap-3 text-cream/70 text-sm hover:text-gold-500 transition-colors cursor-pointer">
                <Phone size={16} className="text-gold-500 flex-shrink-0" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-3 text-cream/70 text-sm hover:text-gold-500 transition-colors cursor-pointer">
                <MapPin size={16} className="text-gold-500 flex-shrink-0" />
                <span>Mumbai, Maharashtra, India</span>
              </div>
            </div>
            {/* Social */}
            <div className="flex gap-4">
              {[
                { icon: Share2, href: '#', label: 'Instagram' },
                { icon: Rss, href: '#', label: 'Facebook' },
                { icon: Video, href: '#', label: 'YouTube' },

              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-10 h-10 border border-gold-500/30 flex items-center justify-center rounded-full
                             text-cream/50 hover:text-dark-900 hover:bg-gold-500 hover:border-gold-500 transition-all duration-300"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-cream font-serif font-semibold text-sm uppercase tracking-widest mb-6">
                {heading}
              </h4>
              <div className="w-6 h-px bg-gold-500 mb-6" />
              <ul className="space-y-3.5">
                {links.map(({ label, to }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      className="text-cream/50 text-sm font-sans hover:text-gold-500 transition-colors duration-300 flex items-center gap-2 group"
                    >
                      <span className="w-0 h-px bg-gold-500 transition-all duration-300 group-hover:w-3"></span>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gold-500/10 bg-dark-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row items-center justify-between gap-6">
          <p className="text-cream/40 text-xs font-sans tracking-wide">
            © {new Date().getFullYear()} Jewélia. All rights reserved.
          </p>
          
          <div className="flex items-center gap-3">
             <div className="flex gap-2">
                <div className="w-10 h-6 bg-dark-800 border border-gold-500/20 rounded flex items-center justify-center text-[9px] text-cream/70 font-bold tracking-wider hover:border-gold-500/50 transition-colors cursor-default">VISA</div>
                <div className="w-10 h-6 bg-dark-800 border border-gold-500/20 rounded flex items-center justify-center text-[9px] text-cream/70 font-bold tracking-wider hover:border-gold-500/50 transition-colors cursor-default">MC</div>
                <div className="w-10 h-6 bg-dark-800 border border-gold-500/20 rounded flex items-center justify-center text-[9px] text-cream/70 font-bold tracking-wider hover:border-gold-500/50 transition-colors cursor-default">AMEX</div>
                <div className="w-10 h-6 bg-dark-800 border border-gold-500/20 rounded flex items-center justify-center text-[9px] text-cream/70 font-bold tracking-wider hover:border-gold-500/50 transition-colors cursor-default"><CreditCard size={12}/></div>
             </div>
          </div>

          <div className="flex gap-6">
            <Link to="/privacy" className="text-cream/40 text-xs hover:text-gold-500 transition-colors uppercase tracking-wider">Privacy</Link>
            <Link to="/terms" className="text-cream/40 text-xs hover:text-gold-500 transition-colors uppercase tracking-wider">Terms</Link>
            <Link to="/shipping" className="text-cream/40 text-xs hover:text-gold-500 transition-colors uppercase tracking-wider">Shipping</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
