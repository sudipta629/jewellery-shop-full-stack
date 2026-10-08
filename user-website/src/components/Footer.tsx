import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, Share2, Rss, Video, Mail, Phone, MapPin } from 'lucide-react';


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
      {/* Top section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Crown size={20} className="text-gold-500" />
              <span className="font-display text-xl text-cream tracking-[0.15em] uppercase">
                Jew<span className="text-gold-500">é</span>lia
              </span>
            </div>
            <div className="w-12 h-px bg-gold-500 mb-4" />
            <p className="text-cream/50 text-sm font-sans leading-relaxed mb-6 max-w-xs">
              More than jewellery — it's a feeling. Crafted with love, worn with pride.
              Every piece tells a story.
            </p>
            {/* Contact info */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-cream/50 text-sm">
                <Mail size={14} className="text-gold-500 flex-shrink-0" />
                <span>hello@jewelia.com</span>
              </div>
              <div className="flex items-center gap-2 text-cream/50 text-sm">
                <Phone size={14} className="text-gold-500 flex-shrink-0" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-2 text-cream/50 text-sm">
                <MapPin size={14} className="text-gold-500 flex-shrink-0" />
                <span>Mumbai, Maharashtra, India</span>
              </div>
            </div>
            {/* Social */}
            <div className="flex gap-3">
              {[
                { icon: Share2, href: '#', label: 'Instagram' },
                { icon: Rss, href: '#', label: 'Facebook' },
                { icon: Video, href: '#', label: 'YouTube' },

              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 border border-gold-500/30 flex items-center justify-center
                             text-cream/50 hover:text-gold-500 hover:border-gold-500 transition-all duration-300"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-cream font-serif font-semibold text-sm uppercase tracking-widest mb-4">
                {heading}
              </h4>
              <div className="w-6 h-px bg-gold-500 mb-4" />
              <ul className="space-y-2.5">
                {links.map(({ label, to }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      className="text-cream/50 text-sm font-sans hover:text-gold-500 transition-colors duration-200"
                    >
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
      <div className="border-t border-gold-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-cream/30 text-xs font-sans">
            © {new Date().getFullYear()} Jewélia. All rights reserved.
          </p>
          <p className="text-gold-500/60 text-xs font-serif italic">
            More than jewellery — it's a feeling.
          </p>
          <div className="flex gap-4">
            {['Privacy', 'Terms', 'Shipping'].map((label, i) => (
              <Link
                key={label}
                to={['/', '/privacy', '/terms', '/shipping'][i + 1]}
                className="text-cream/30 text-xs hover:text-gold-500 transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
