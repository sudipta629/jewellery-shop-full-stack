import adminApiClient, { extractData, extractPaginated } from './client';

// ─── Auth ────────────────────────────────────────────────────────────────

export const adminAuthApi = {
  login: (email: string, password: string) =>
    adminApiClient.post('/admin/auth/login', { email, password }),
  me: () => adminApiClient.get('/admin/auth/me').then(extractData),
  logout: () => adminApiClient.post('/admin/auth/logout'),
};

// ─── Dashboard ───────────────────────────────────────────────────────────

export const dashboardApi = {
  get: () => adminApiClient.get('/admin/dashboard').then(extractData),
};

// ─── Customers ───────────────────────────────────────────────────────────

export const customersApi = {
  list: (params?: any) => adminApiClient.get('/admin/customers', { params }).then(extractPaginated),
  get: (id: number) => adminApiClient.get(`/admin/customers/${id}`).then(extractData),
  toggleStatus: (id: number) => adminApiClient.patch(`/admin/customers/${id}/status`).then(extractData),
};

// ─── Orders ──────────────────────────────────────────────────────────────

export const ordersApi = {
  list: (params?: any) => adminApiClient.get('/admin/orders', { params }).then(extractPaginated),
  get: (id: number) => adminApiClient.get(`/admin/orders/${id}`).then(extractData),
  updateStatus: (id: number, status: string, note?: string) =>
    adminApiClient.patch(`/admin/orders/${id}/status`, { status, note }).then(extractData),
};

// ─── Products ────────────────────────────────────────────────────────────

export const productsApi = {
  list: (params?: any) => adminApiClient.get('/products/admin/all', { params }).then(extractPaginated),
  get: (id: number) => adminApiClient.get(`/products/${id}`).then(extractData),
  create: (data: any) => adminApiClient.post('/products', data).then(extractData),
  update: (id: number, data: any) => adminApiClient.put(`/products/${id}`, data).then(extractData),
  archive: (id: number) => adminApiClient.delete(`/products/${id}`).then(extractData),
};

// ─── Categories ──────────────────────────────────────────────────────────

export const categoriesApi = {
  list: () => adminApiClient.get('/categories?include_inactive=true').then(extractData),
  create: (data: any) => adminApiClient.post('/categories', data).then(extractData),
  update: (id: number, data: any) => adminApiClient.put(`/categories/${id}`, data).then(extractData),
  delete: (id: number) => adminApiClient.delete(`/categories/${id}`).then(extractData),
};

// ─── Rates ───────────────────────────────────────────────────────────────

export const ratesApi = {
  getCurrent: () => adminApiClient.get('/rates').then(extractData),
  getHistory: (params?: any) => adminApiClient.get('/rates/history', { params }).then(extractData),
  setRate: (data: any) => adminApiClient.post('/rates', data).then(extractData),
};

// ─── Inventory ───────────────────────────────────────────────────────────

export const inventoryApi = {
  list: (params?: any) => adminApiClient.get('/inventory', { params }).then(extractPaginated),
  adjust: (product_id: number, data: any) =>
    adminApiClient.post(`/inventory/${product_id}/adjust`, data).then(extractData),
  setQuantity: (product_id: number, quantity: number, reason?: string) =>
    adminApiClient.patch(`/inventory/${product_id}/set`, { quantity, reason }).then(extractData),
  history: (product_id: number) =>
    adminApiClient.get(`/inventory/${product_id}/history`).then(extractData),
};

// ─── Coupons ─────────────────────────────────────────────────────────────

export const couponsApi = {
  list: () => adminApiClient.get('/coupons').then(extractData),
  create: (data: any) => adminApiClient.post('/coupons', data).then(extractData),
  update: (id: number, data: any) => adminApiClient.put(`/coupons/${id}`, data).then(extractData),
  delete: (id: number) => adminApiClient.delete(`/coupons/${id}`).then(extractData),
};

// ─── Offers ──────────────────────────────────────────────────────────────

export const offersApi = {
  list: () => adminApiClient.get('/offers/admin/all').then(extractData),
  create: (data: any) => adminApiClient.post('/offers', data).then(extractData),
  update: (id: number, data: any) => adminApiClient.put(`/offers/${id}`, data).then(extractData),
  delete: (id: number) => adminApiClient.delete(`/offers/${id}`).then(extractData),
};

// ─── Banners ─────────────────────────────────────────────────────────────

export const bannersApi = {
  list: () => adminApiClient.get('/banners').then(extractData),
  create: (data: any) => adminApiClient.post('/banners', data).then(extractData),
  update: (id: number, data: any) => adminApiClient.put(`/banners/${id}`, data).then(extractData),
  delete: (id: number) => adminApiClient.delete(`/banners/${id}`).then(extractData),
};

// ─── Contact ─────────────────────────────────────────────────────────────

export const contactApi = {
  list: (params?: any) => adminApiClient.get('/contact', { params }).then(extractData),
  updateStatus: (id: number, status: string) =>
    adminApiClient.patch(`/contact/${id}/status`, { status }).then(extractData),
  unreadCount: () =>
    adminApiClient.get('/contact?status=new').then((r) => {
      const data = extractData<any[]>(r);
      return Array.isArray(data) ? data.length : 0;
    }),
};

// ─── Uploads ─────────────────────────────────────────────────────────────

export const uploadApi = {
  image: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return adminApiClient.post('/uploads/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(extractData);
  },
};

// ─── KYC ─────────────────────────────────────────────────────────────────

export const kycApi = {
  list: (params?: any) => adminApiClient.get('/kyc/admin/all', { params }).then(extractData),
  review: (id: number, data: any) =>
    adminApiClient.patch(`/kyc/admin/${id}/review`, data).then(extractData),
};

// ─── Payments ────────────────────────────────────────────────────────────

export const paymentsApi = {
  list: (params?: any) => adminApiClient.get('/payments/admin/all', { params }).then(extractPaginated),
};
