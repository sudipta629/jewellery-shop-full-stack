import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, Search, Heart, ShoppingBag, User, Menu, X,
  ChevronDown, LogOut, Package, MapPin, Bell,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useCartStore } from '../store/cartStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../api/services';

const NAV_LINKS = [
  { label: 'Home',        to: '/' },
  { label: 'Shop',        to: '/shop' },
  { label: 'Collections', to: '/shop', sub: [
    { label: 'Necklaces',  to: '/category/necklaces' },
    { label: 'Earrings',   to: '/category/earrings' },
    { label: 'Rings',      to: '/category/rings' },
    { label: 'Bangles',    to: '/category/bangles' },
    { label: 'Bracelets',  to: '/category/bracelets' },
    { label: 'Bridal',     to: '/category/bridal' },
  ]},
  { label: 'Offers',      to: '/offers' },
  { label: 'About',       to: '/about' },
  { label: 'Contact',     to: '/contact' },
];

export default function Navbar() {
  const { customer, isAuthenticated, logout } = useAuth();
  const { itemCount, wishlistCount } = useCartStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [accountOpen, setAccountOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Fetch notifications only when logged in
  const { data: notifData } = useQuery({
    queryKey: ['user-notifications'],
    queryFn: notificationApi.list,
    enabled: isAuthenticated,
    refetchInterval: 60000,
  });
  const notifList: any[] = notifData?.notifications ?? [];
  const unreadCount: number = notifData?.unread_count ?? 0;

  const handleMarkRead = async (id: number) => {
    await notificationApi.markRead(id);
    queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
  };

  const handleMarkAllRead = async () => {
    await notificationApi.markAllRead();
    queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-dark-800/95 backdrop-blur-md shadow-dark border-b border-gold-500/10'
            : 'bg-transparent'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
              <Crown
                size={24}
                className="text-gold-500 group-hover:scale-110 transition-transform duration-300"
              />
              <span className="font-display text-xl lg:text-2xl text-cream font-semibold tracking-[0.15em] uppercase">
                Jew<span className="text-gold-500">é</span>lia
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-8">
              {NAV_LINKS.map((link) =>
                link.sub ? (
                  <div
                    key={link.label}
                    className="relative group"
                    onMouseEnter={() => setCollectionsOpen(true)}
                    onMouseLeave={() => setCollectionsOpen(false)}
                  >
                    <button className="nav-link flex items-center gap-1">
                      {link.label}
                      <ChevronDown size={14} className="transition-transform duration-200 group-hover:rotate-180" />
                    </button>
                    <AnimatePresence>
                      {collectionsOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full left-0 mt-2 w-48 bg-dark-800 border border-gold-500/20 shadow-gold-lg py-2"
                        >
                          {link.sub.map((sub) => (
                            <Link
                              key={sub.to}
                              to={sub.to}
                              className="block px-4 py-2.5 text-sm text-cream/80 hover:text-gold-500 hover:bg-gold-500/5 transition-colors duration-200"
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <NavLink
                    key={link.label}
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) =>
                      isActive ? 'nav-link nav-link-active' : 'nav-link'
                    }
                  >
                    {link.label}
                  </NavLink>
                ),
              )}
            </div>

            {/* Desktop action icons */}
            <div className="hidden lg:flex items-center gap-4">
              {/* Search */}
              <button
                id="search-btn"
                aria-label="Search"
                onClick={() => setSearchOpen(true)}
                className="text-cream/70 hover:text-gold-500 transition-colors duration-200"
              >
                <Search size={20} />
              </button>

              {/* Wishlist */}
              <Link
                to={isAuthenticated ? '/wishlist' : '/login'}
                id="wishlist-btn"
                aria-label="Wishlist"
                className="relative text-cream/70 hover:text-gold-500 transition-colors duration-200"
              >
                <Heart size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-gold-500 text-dark-800 text-[10px] font-bold flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link
                to="/cart"
                id="cart-btn"
                aria-label="Cart"
                className="relative text-cream/70 hover:text-gold-500 transition-colors duration-200"
              >
                <ShoppingBag size={20} />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-gold-500 text-dark-800 text-[10px] font-bold flex items-center justify-center">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>

              {/* Notification Bell (only when logged in) */}
              {isAuthenticated && (
                <div className="relative">
                  <button
                    id="notif-bell-btn"
                    aria-label="Notifications"
                    onClick={() => { setNotifOpen(p => !p); setAccountOpen(false); }}
                    className="relative text-cream/70 hover:text-gold-500 transition-colors duration-200"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-gold-500 text-dark-800 text-[10px] font-bold flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  <AnimatePresence>
                    {notifOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full mt-2 w-80 bg-dark-800 border border-gold-500/20 shadow-gold py-0 z-50"
                      >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gold-500/10">
                          <p className="text-sm font-serif text-cream">Notifications</p>
                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllRead}
                              className="text-xs text-gold-500/70 hover:text-gold-500 transition-colors"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>
                        <div className="max-h-80 overflow-y-auto divide-y divide-gold-500/5">
                          {notifList.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                              <Bell size={24} className="text-gold-500/20 mx-auto mb-2" />
                              <p className="text-cream/30 text-xs font-sans">No notifications yet</p>
                            </div>
                          ) : (
                            notifList.map((n: any) => (
                              <div
                                key={n.id}
                                onClick={() => { handleMarkRead(n.id); setNotifOpen(false); }}
                                className={`px-4 py-3 cursor-pointer hover:bg-gold-500/5 transition-colors group ${
                                  !n.is_read ? 'bg-gold-500/5 border-l-2 border-l-gold-500' : ''
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                    !n.is_read ? 'bg-gold-500' : 'bg-cream/20'
                                  }`} />
                                  <div className="min-w-0">
                                    <p className={`text-xs font-semibold mb-0.5 ${
                                      !n.is_read ? 'text-cream' : 'text-cream/60'
                                    }`}>{n.title}</p>
                                    <p className="text-cream/40 text-xs font-sans leading-relaxed line-clamp-2">
                                      {n.message}
                                    </p>
                                    <p className="text-cream/25 text-[10px] font-sans mt-1">
                                      {new Date(n.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} · {new Date(n.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="px-4 py-2.5 border-t border-gold-500/10 text-center">
                          <button
                            onClick={() => setNotifOpen(false)}
                            className="text-xs text-cream/30 hover:text-gold-500 transition-colors"
                          >
                            Close
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Account */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    id="account-menu-btn"
                    onClick={() => setAccountOpen((p) => !p)}
                    className="flex items-center gap-2 text-cream/70 hover:text-gold-500 transition-colors duration-200"
                  >
                    <User size={20} />
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${accountOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <AnimatePresence>
                    {accountOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full mt-2 w-52 bg-dark-800 border border-gold-500/20 shadow-gold py-2"
                      >
                        <div className="px-4 py-2 border-b border-gold-500/10">
                          <p className="text-xs text-cream/50 font-sans">Signed in as</p>
                          <p className="text-sm text-gold-500 font-medium truncate">{customer?.email}</p>
                        </div>
                        {[
                          { icon: User, label: 'My Profile', to: '/profile' },
                          { icon: Package, label: 'My Orders', to: '/orders' },
                          { icon: MapPin, label: 'Addresses', to: '/addresses' },
                          { icon: Heart, label: 'Wishlist', to: '/wishlist' },
                        ].map(({ icon: Icon, label, to }) => (
                          <Link
                            key={to}
                            to={to}
                            onClick={() => setAccountOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-cream/80 hover:text-gold-500 hover:bg-gold-500/5 transition-colors"
                          >
                            <Icon size={15} />
                            {label}
                          </Link>
                        ))}
                        <div className="border-t border-gold-500/10 mt-1 pt-1">
                          <button
                            id="logout-btn"
                            onClick={() => { logout(); setAccountOpen(false); navigate('/'); }}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/5 transition-colors"
                          >
                            <LogOut size={15} />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link to="/login" className="btn-ghost text-xs py-2 px-4">
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile: cart + hamburger */}
            <div className="flex lg:hidden items-center gap-3">
              <Link to="/cart" className="relative text-cream/70 hover:text-gold-500">
                <ShoppingBag size={20} />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-gold-500 text-dark-800 text-[10px] font-bold flex items-center justify-center">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>
              <button
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                onClick={() => setMobileOpen((p) => !p)}
                className="text-cream/70 hover:text-gold-500 transition-colors"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div
              className="absolute inset-0 bg-dark-800/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute right-0 top-0 h-full w-72 bg-dark-800 border-l border-gold-500/20 overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gold-500/10">
                <span className="font-display text-xl text-cream">Menu</span>
                <button onClick={() => setMobileOpen(false)}>
                  <X size={22} className="text-cream/70" />
                </button>
              </div>

              {/* Search bar in mobile */}
              <div className="px-6 py-4 border-b border-gold-500/10">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search jewellery…"
                    className="input flex-1 text-sm"
                  />
                  <button type="submit" className="text-gold-500 p-2">
                    <Search size={18} />
                  </button>
                </form>
              </div>

              <nav className="px-6 py-4 space-y-1">
                {NAV_LINKS.map((link) => (
                  <div key={link.label}>
                    <NavLink
                      to={link.to}
                      end={link.to === '/'}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `block py-3 font-sans text-sm border-b border-gold-500/5 ${
                          isActive ? 'text-gold-500' : 'text-cream/80'
                        }`
                      }
                    >
                      {link.label}
                    </NavLink>
                    {link.sub && (
                      <div className="pl-4 space-y-1 py-1">
                        {link.sub.map((sub) => (
                          <Link
                            key={sub.to}
                            to={sub.to}
                            onClick={() => setMobileOpen(false)}
                            className="block py-2 text-sm text-cream/60 hover:text-gold-500"
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>

              <div className="px-6 py-4 border-t border-gold-500/10 space-y-3">
                {isAuthenticated ? (
                  <>
                    <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 text-sm text-cream/80 hover:text-gold-500">
                      <User size={16} /> My Profile
                    </Link>
                    <Link to="/orders" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 text-sm text-cream/80 hover:text-gold-500">
                      <Package size={16} /> My Orders
                    </Link>
                    <Link to="/wishlist" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 text-sm text-cream/80 hover:text-gold-500">
                      <Heart size={16} /> Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
                    </Link>
                    <button
                      onClick={() => { logout(); setMobileOpen(false); navigate('/'); }}
                      className="flex items-center gap-3 text-sm text-red-400 w-full"
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </>
                ) : (
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-primary w-full justify-center">
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-screen search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-dark-800/95 backdrop-blur-md flex items-start justify-center pt-32 px-4"
          >
            <button
              onClick={() => setSearchOpen(false)}
              className="absolute top-6 right-6 text-cream/50 hover:text-cream"
            >
              <X size={24} />
            </button>
            <div className="w-full max-w-2xl">
              <p className="text-gold-500 text-sm uppercase tracking-widest mb-4 font-sans text-center">
                Search Jewélia
              </p>
              <form onSubmit={handleSearch} className="relative">
                <input
                  ref={searchRef}
                  id="global-search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for necklaces, rings, earrings…"
                  className="w-full bg-dark-700 border-b-2 border-gold-500/40 focus:border-gold-500 text-cream text-xl font-serif py-4 px-2 outline-none placeholder:text-cream/25 transition-colors"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gold-500"
                >
                  <Search size={22} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
