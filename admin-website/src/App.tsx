import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AdminAuthProvider } from './context/AdminAuthContext';
import AdminLayout from './layouts/AdminLayout';
import AdminProtectedRoute from './components/AdminProtectedRoute';

const LoginPage      = lazy(() => import('./pages/LoginPage'));
const DashboardPage  = lazy(() => import('./pages/DashboardPage'));
const ProductsPage   = lazy(() => import('./pages/ProductsPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const OrdersPage     = lazy(() => import('./pages/OrdersPage'));
const CustomersPage  = lazy(() => import('./pages/CustomersPage'));
const InventoryPage  = lazy(() => import('./pages/InventoryPage'));
const RatesPage      = lazy(() => import('./pages/RatesPage'));
const CouponsPage    = lazy(() => import('./pages/CouponsPage'));
const OffersPage     = lazy(() => import('./pages/OffersPage'));
const BannersPage    = lazy(() => import('./pages/BannersPage'));
const ContactPage    = lazy(() => import('./pages/ContactPage'));
const KYCPage        = lazy(() => import('./pages/KYCPage'));
const PaymentsPage   = lazy(() => import('./pages/PaymentsPage'));

const AdminLoader = () => (
  <div className="min-h-screen bg-dark-800 flex items-center justify-center">
    <div className="text-gold-500 text-sm font-sans animate-pulse">Loading…</div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30000, retry: 1 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminAuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1a1610',
                color: '#f5e6c8',
                border: '1px solid rgba(201,169,110,0.2)',
                fontSize: '13px',
              },
              success: { iconTheme: { primary: '#c9a96e', secondary: '#1a1108' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#1a1108' } },
            }}
          />
          <Suspense fallback={<AdminLoader />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<AdminProtectedRoute />}>
                <Route element={<AdminLayout />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="products" element={<ProductsPage />} />
                  <Route path="categories" element={<CategoriesPage />} />
                  <Route path="orders" element={<OrdersPage />} />
                  <Route path="customers" element={<CustomersPage />} />
                  <Route path="inventory" element={<InventoryPage />} />
                  <Route path="rates" element={<RatesPage />} />
                  <Route path="coupons" element={<CouponsPage />} />
                  <Route path="offers" element={<OffersPage />} />
                  <Route path="banners" element={<BannersPage />} />
                  <Route path="contact" element={<ContactPage />} />
                  <Route path="kyc" element={<KYCPage />} />
                  <Route path="payments" element={<PaymentsPage />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AdminAuthProvider>
    </QueryClientProvider>
  );
}
