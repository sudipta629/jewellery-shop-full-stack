/**
 * All API service functions for the user website.
 * Each function maps to a backend endpoint.
 */
import apiClient, { extractData, extractPaginated } from './client';

// ─── Types ───────────────────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface ProductImage {
  id: number;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
}

export interface PriceBreakdown {
  metal_type: string;
  purity: string | null;
  net_weight: string;
  gross_weight: string;
  rate_per_gram: string;
  metal_value: string;
  making_charge: string;
  stone_charge: string;
  subtotal: string;
  tax_percent: string;
  tax_amount: string;
  total: string;
  currency: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  category_id: number;
  category_name: string | null;
  metal_type: string;
  purity: string | null;
  gross_weight: string | null;
  net_weight: string | null;
  stone_charge: string;
  tax_percent: string;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_active: boolean;
  gender: string | null;
  occasion: string | null;
  care_info: string | null;
  primary_image_url: string | null;
  images: ProductImage[];
  stock: number;
  in_stock: boolean;
  price: PriceBreakdown | null;
  created_at: string;
}

export interface CartItem {
  cart_item_id: number;
  product_id: number;
  sku: string;
  name: string;
  metal_type: string;
  purity: string | null;
  primary_image_url: string | null;
  quantity: number;
  stock: number;
  unit_price: string;
  line_total: string;
  price_breakdown: PriceBreakdown | null;
}

export interface Cart {
  cart_id: number;
  items: CartItem[];
  item_count: number;
  subtotal: string;
}

export interface MetalRate {
  metal: string;
  purity: string;
  rate_per_gram: string | null;
  effective_date: string | null;
  updated_by: string | null;
}

export interface Banner {
  id: number;
  title: string;
  subtitle: string | null;
  cta_text: string | null;
  cta_url: string | null;
  image_url: string;
  sort_order: number;
}

export interface Order {
  id: number;
  order_number: string;
  status: string;
  payment_method: string;
  payment_status: string;
  subtotal: string;
  discount_amount: string;
  coupon_code: string | null;
  shipping_charge: string;
  tax_amount: string;
  total_amount: string;
  address_snapshot: Record<string, string>;
  placed_at: string;
}

export interface Address {
  id: number;
  label: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: boolean;
}

export interface Offer {
  id: number;
  title: string;
  description: string | null;
  discount_type: string;
  discount_value: string;
  applies_to: string;
  is_active: boolean;
}

export interface WishlistItem {
  wishlist_item_id: number;
  product_id: number;
  name: string;
  metal_type: string;
  purity: string | null;
  primary_image_url: string | null;
  price: string | null;
  in_stock: boolean;
}

// ─── Auth ────────────────────────────────────────────────────────────────

export const authApi = {
  requestOtp: (email: string, purpose: string = 'login') =>
    apiClient.post('/auth/request-otp', { email, purpose }),

  verifyOtp: (email: string, code: string, purpose: string = 'login') =>
    apiClient.post('/auth/verify-otp', { email, code, purpose }),

  refresh: () =>
    apiClient.post('/auth/refresh'),

  logout: () =>
    apiClient.post('/auth/logout'),

  me: () =>
    apiClient.get('/auth/me').then(extractData),
};

// ─── Customer Profile & Addresses ────────────────────────────────────────

export const customerApi = {
  getProfile: () =>
    apiClient.get('/customers/profile').then(extractData),

  updateProfile: (data: { full_name?: string; phone?: string }) =>
    apiClient.patch('/customers/profile', data),

  getAddresses: () =>
    apiClient.get('/customers/addresses').then(extractData<Address[]>),

  createAddress: (data: Omit<Address, 'id' | 'created_at'>) =>
    apiClient.post('/customers/addresses', data).then(extractData),

  updateAddress: (id: number, data: Partial<Address>) =>
    apiClient.put(`/customers/addresses/${id}`, data).then(extractData),

  deleteAddress: (id: number) =>
    apiClient.delete(`/customers/addresses/${id}`),

  setDefaultAddress: (id: number) =>
    apiClient.patch(`/customers/addresses/${id}/set-default`),
};

// ─── Categories ──────────────────────────────────────────────────────────

export const categoryApi = {
  list: () =>
    apiClient.get('/categories').then(extractData<Category[]>),

  get: (id: number) =>
    apiClient.get(`/categories/${id}`).then(extractData<Category>),
};

// ─── Products ────────────────────────────────────────────────────────────

export interface ProductFilters {
  q?: string;
  category_id?: number;
  category_slug?: string;
  metal_type?: string;
  purity?: string;
  gender?: string;
  occasion?: string;
  is_featured?: boolean;
  is_new_arrival?: boolean;
  in_stock?: boolean;
  sort?: string;
  page?: number;
  per_page?: number;
}

export const productApi = {
  list: (filters: ProductFilters = {}) =>
    apiClient.get('/products', { params: filters }).then(extractPaginated<Product>),

  get: (id: number) =>
    apiClient.get(`/products/${id}`).then(extractData<Product>),

  getPrice: (id: number) =>
    apiClient.get(`/products/${id}/price`).then(extractData<PriceBreakdown>),
};

// ─── Rates ───────────────────────────────────────────────────────────────

export const ratesApi = {
  getCurrent: () =>
    apiClient.get('/rates').then(extractData<MetalRate[]>),
};

// ─── Banners ─────────────────────────────────────────────────────────────

export const bannerApi = {
  list: () =>
    apiClient.get('/banners').then(extractData<Banner[]>),
};

// ─── Offers ──────────────────────────────────────────────────────────────

export const offerApi = {
  list: () =>
    apiClient.get('/offers').then(extractData<Offer[]>),
};

// ─── Cart ────────────────────────────────────────────────────────────────

export const cartApi = {
  get: () =>
    apiClient.get('/cart').then(extractData<Cart>),

  addItem: (product_id: number, quantity: number = 1) =>
    apiClient.post('/cart/items', { product_id, quantity }).then(extractData<Cart>),

  updateItem: (cart_item_id: number, quantity: number) =>
    apiClient.patch(`/cart/items/${cart_item_id}`, { quantity }).then(extractData<Cart>),

  removeItem: (cart_item_id: number) =>
    apiClient.delete(`/cart/items/${cart_item_id}`).then(extractData<Cart>),

  clear: () =>
    apiClient.delete('/cart'),
};

// ─── Wishlist ────────────────────────────────────────────────────────────

export const wishlistApi = {
  get: () =>
    apiClient.get('/wishlist').then(extractData<WishlistItem[]>),

  add: (product_id: number) =>
    apiClient.post('/wishlist', { product_id }),

  remove: (product_id: number) =>
    apiClient.delete(`/wishlist/${product_id}`),
};

// ─── Orders ──────────────────────────────────────────────────────────────

export const orderApi = {
  list: (params?: { page?: number; per_page?: number }) =>
    apiClient.get('/orders', { params }).then(extractPaginated<Order>),

  get: (id: number) =>
    apiClient.get(`/orders/${id}`).then(extractData),

  place: (data: {
    address_id: number;
    payment_method: string;
    coupon_code?: string;
    notes?: string;
  }) =>
    apiClient.post('/orders', data).then(extractData),

  cancel: (id: number) =>
    apiClient.post(`/orders/${id}/cancel`),
};

// ─── Coupons ─────────────────────────────────────────────────────────────

export const couponApi = {
  validate: (code: string, order_amount: number) =>
    apiClient.post('/coupons/validate', { code, order_amount }).then(extractData),
};

// ─── Contact ─────────────────────────────────────────────────────────────

export const contactApi = {
  submit: (data: { name: string; email: string; phone?: string; message: string }) =>
    apiClient.post('/contact', data),
};

// ─── Notifications ───────────────────────────────────────────────────────

export const notificationApi = {
  list: () =>
    apiClient.get('/notifications').then(extractData),

  markRead: (id: number) =>
    apiClient.patch(`/notifications/${id}/read`),

  markAllRead: () =>
    apiClient.patch('/notifications/read-all'),
};
