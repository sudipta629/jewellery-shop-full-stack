import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, LayoutDashboard, Package, Tag, ShoppingCart, Users, Archive,
  BarChart3, Megaphone, ImageIcon, MessageSquare, FileCheck, CreditCard,
  ChevronRight, Bell, Search, Sun, LogOut, User, ChevronDown, Zap,
  Layers, TrendingUp, Menu, X,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useQuery } from '@tanstack/react-query';
import { contactApi } from '../api/services';
import toast from 'react-hot-toast';

const NAV = [
  { label: 'Dashboard',  to: '/dashboard',  icon: LayoutDashboard },
  { label: 'Products',   to: '/products',   icon: Package },
  { label: 'Categories', to: '/categories', icon: Tag },
  { label: 'Orders',     to: '/orders',     icon: ShoppingCart },
  { label: 'Customers',  to: '/customers',  icon: Users },
  { label: 'Inventory',  to: '/inventory',  icon: Archive },
  { label: 'Rates',      to: '/rates',      icon: TrendingUp },
  { label: 'Coupons',    to: '/coupons',    icon: Zap },
  { label: 'Offers',     to: '/offers',     icon: Megaphone },
  { label: 'Banners',    to: '/banners',    icon: ImageIcon },
  { label: 'Payments',   to: '/payments',   icon: CreditCard },
  { label: 'KYC',        to: '/kyc',        icon: FileCheck },
  { label: 'Contact',    to: '/contact',    icon: MessageSquare },
];

export default function AdminLayout() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Real unread contact messages count
  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ['admin-contact-unread'],
    queryFn: contactApi.unreadCount,
    refetchInterval: 60000, // refresh every minute
  });

  const handleLogout = () => {
    logout();
    toast.success('Signed out');
    navigate('/login');
  };

  const Sidebar = (
    <div className="h-full flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gold-500/10">
        <div className="flex items-center gap-2">
          <Crown size={20} className="text-gold-500" />
          <span className="font-display text-lg text-cream tracking-widest uppercase">
            Jew<span className="text-gold-500">é</span>lia
          </span>
        </div>
        <p className="text-cream/30 text-[10px] font-sans mt-0.5 uppercase tracking-widest ml-7">
          Admin Panel
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            <Icon size={16} className="flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom brand */}
      <div className="px-5 py-5 border-t border-gold-500/10 text-center">
        <p className="text-gold-500/40 text-xs font-serif italic">
          Luxury in every detail
        </p>
        <div className="w-8 h-px bg-gold-500/20 mx-auto mt-2" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-dark-800">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-52 xl:w-56 bg-sidebar flex-shrink-0 fixed top-0 left-0 h-full z-30 border-r border-gold-500/10">
        {Sidebar}
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-dark-900/70 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -224 }}
              animate={{ x: 0 }}
              exit={{ x: -224 }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed top-0 left-0 w-56 h-full bg-sidebar z-50 lg:hidden border-r border-gold-500/10"
            >
              {Sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 lg:ml-52 xl:ml-56 flex flex-col min-h-screen">
        {/* Top nav */}
        <header className="sticky top-0 z-20 bg-dark-800/95 backdrop-blur-sm border-b border-gold-500/10 px-4 lg:px-6 h-14 flex items-center gap-4">
          {/* Mobile menu toggle */}
          <button
            className="lg:hidden text-cream/60 hover:text-gold-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          {/* Search */}
          <div className="flex-1 hidden sm:flex items-center gap-2 max-w-md">
            <Search size={15} className="text-cream/30 flex-shrink-0" />
            <input
              id="admin-global-search"
              placeholder="Search products, orders, customers…"
              className="bg-transparent text-sm text-cream/70 placeholder:text-cream/25 focus:outline-none flex-1"
            />
            <kbd className="hidden md:inline-block text-[10px] font-sans text-cream/20 border border-cream/10 px-1.5 py-0.5 rounded">
              Ctrl+K
            </kbd>
          </div>

          <div className="flex-1" />

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/contact')}
              title={`${unreadCount} new message${unreadCount !== 1 ? 's' : ''}`}
              className="text-cream/40 hover:text-gold-500 transition-colors relative"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-gold-500 rounded-full text-dark-800 text-[9px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                id="admin-user-menu"
                onClick={() => setUserMenuOpen((p) => !p)}
                className="flex items-center gap-2 text-sm"
              >
                <div className="w-7 h-7 rounded-full bg-gold-500/20 border border-gold-500/40 flex items-center justify-center">
                  <User size={13} className="text-gold-500" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-cream/90 text-xs font-medium leading-none">{admin?.full_name}</p>
                  <p className="text-cream/30 text-[10px] capitalize">{admin?.role.replace('_', ' ')}</p>
                </div>
                <ChevronDown size={13} className="text-cream/30" />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute right-0 top-full mt-2 w-44 bg-dark-900 border border-gold-500/20 shadow-dark py-1"
                  >
                    <div className="px-3 py-2 border-b border-gold-500/10">
                      <p className="text-xs text-cream/50">{admin?.email}</p>
                    </div>
                    <button
                      id="admin-logout-btn"
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/5 transition-colors"
                    >
                      <LogOut size={13} />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-auto">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="px-6 py-3 border-t border-gold-500/10 flex items-center justify-between">
          <p className="text-cream/20 text-xs font-sans">© {new Date().getFullYear()} Jewélia. All rights reserved.</p>
          <p className="text-gold-500/30 text-xs font-serif italic">More than jewellery… ♥</p>
        </footer>
      </div>
    </div>
  );
}
