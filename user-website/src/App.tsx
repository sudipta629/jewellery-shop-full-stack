import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import PageLoader from './components/PageLoader';

// ─── Lazy-loaded pages ────────────────────────────────────────────────────
const HomePage         = lazy(() => import('./pages/HomePage'));
const ShopPage         = lazy(() => import('./pages/ShopPage'));
const CategoryPage     = lazy(() => import('./pages/CategoryPage'));
const ProductPage      = lazy(() => import('./pages/ProductPage'));
const SearchPage       = lazy(() => import('./pages/SearchPage'));
const OffersPage       = lazy(() => import('./pages/OffersPage'));
const CartPage         = lazy(() => import('./pages/CartPage'));
const WishlistPage     = lazy(() => import('./pages/WishlistPage'));
const CheckoutPage     = lazy(() => import('./pages/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'));
const OrdersPage       = lazy(() => import('./pages/OrdersPage'));
const OrderDetailPage  = lazy(() => import('./pages/OrderDetailPage'));
const ProfilePage      = lazy(() => import('./pages/ProfilePage'));
const AddressesPage    = lazy(() => import('./pages/AddressesPage'));
const LoginPage        = lazy(() => import('./pages/LoginPage'));
const AboutPage        = lazy(() => import('./pages/AboutPage'));
const ContactPage      = lazy(() => import('./pages/ContactPage'));
const PrivacyPage      = lazy(() => import('./pages/PrivacyPage'));
const TermsPage        = lazy(() => import('./pages/TermsPage'));
const ShippingPage     = lazy(() => import('./pages/ShippingPage'));
const ReturnPage       = lazy(() => import('./pages/ReturnPage'));
const NotFoundPage     = lazy(() => import('./pages/NotFoundPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,       // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#2d2010',
                color: '#f5e6c8',
                border: '1px solid rgba(201,169,110,0.3)',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#c9a96e', secondary: '#1a1108' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#1a1108' } },
            }}
          />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes with main layout */}
              <Route element={<MainLayout />}>
                <Route index element={<HomePage />} />
                <Route path="shop" element={<ShopPage />} />
                <Route path="category/:slug" element={<CategoryPage />} />
                <Route path="product/:id" element={<ProductPage />} />
                <Route path="search" element={<SearchPage />} />
                <Route path="offers" element={<OffersPage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="contact" element={<ContactPage />} />
                <Route path="privacy" element={<PrivacyPage />} />
                <Route path="terms" element={<TermsPage />} />
                <Route path="shipping" element={<ShippingPage />} />
                <Route path="returns" element={<ReturnPage />} />

                {/* Cart accessible without login */}
                <Route path="cart" element={<CartPage />} />

                {/* Protected routes — require customer login */}
                <Route element={<ProtectedRoute />}>
                  <Route path="wishlist" element={<WishlistPage />} />
                  <Route path="checkout" element={<CheckoutPage />} />
                  <Route path="order-success/:orderNumber" element={<OrderSuccessPage />} />
                  <Route path="orders" element={<OrdersPage />} />
                  <Route path="orders/:id" element={<OrderDetailPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="addresses" element={<AddressesPage />} />
                </Route>
              </Route>

              {/* Auth pages (no main layout) */}
              <Route path="login" element={<LoginPage />} />

              {/* 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
