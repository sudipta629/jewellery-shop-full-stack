import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  TrendingUp, ShoppingCart, Users, Package, Clock, AlertTriangle,
  ArrowUpRight, Plus, Eye, UserPlus, BarChart2,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { dashboardApi } from '../api/services';
import { useAdminAuth } from '../context/AdminAuthContext';

function StatCard({ title, value, change, icon: Icon, color = 'gold' }: any) {
  return (
    <div className="stat-card relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-cream/40 text-xs font-sans uppercase tracking-widest">{title}</p>
          <p className={`text-2xl font-display mt-1 ${color === 'gold' ? 'text-cream' : 'text-cream'}`}>
            {value ?? '—'}
          </p>
        </div>
        <div className="w-10 h-10 bg-gold-500/10 rounded-sm flex items-center justify-center flex-shrink-0">
          <Icon size={18} className="text-gold-500" />
        </div>
      </div>
      {change !== undefined && (
        <div className="flex items-center gap-1 mt-3">
          <ArrowUpRight size={12} className="text-emerald-400" />
          <span className="text-emerald-400 text-xs font-sans">{change}</span>
          <span className="text-cream/30 text-xs font-sans ml-1">vs last week</span>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    placed: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    confirmed: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    processing: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    shipped: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    delivered: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
  };
  return (
    <span className={`status-badge border ${map[status] ?? 'bg-cream/10 text-cream/40 border-cream/20'}`}>
      {status}
    </span>
  );
}

const CHART_COLORS = { gold: '#c9a96e', dark: '#1a1610' };

export default function DashboardPage() {
  const { admin } = useAdminAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: dashboardApi.get,
  });

  const stats = (data as any)?.stats;
  const chart = (data as any)?.sales_chart ?? [];
  const topProducts = (data as any)?.top_products ?? [];
  const recentOrders = (data as any)?.recent_orders ?? [];
  const lowStockAlerts = (data as any)?.low_stock_alerts ?? [];

  const chartData = chart.map((r: any) => ({
    date: r.date,
    sales: parseFloat(r.total),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display text-cream">
            Welcome Back, {admin?.full_name?.split(' ')[0] ?? 'Admin'}
          </h1>
          <p className="text-cream/40 text-sm font-sans mt-0.5">
            Here's what's happening with your store today.
          </p>
        </div>
        {/* Quick promo snippet from reference */}
        <div className="hidden xl:block text-right">
          <p className="font-display text-gold-500 text-lg italic leading-tight">
            Timeless<br />Elegance<br />Always
          </p>
          <div className="w-8 h-px bg-gold-500 ml-auto mt-2" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="admin-card"><div className="skeleton h-16 w-full" /></div>
          ))
        ) : (
          <>
            <StatCard
              title="Total Sales"
              value={stats ? `₹${parseFloat(stats.total_sales).toLocaleString('en-IN')}` : '—'}
              change="12.5% vs last week"
              icon={TrendingUp}
            />
            <StatCard
              title="Total Orders"
              value={stats?.total_orders}
              change="8.3% vs last week"
              icon={ShoppingCart}
            />
            <StatCard
              title="Total Customers"
              value={stats?.total_customers}
              change="15.2% vs last week"
              icon={Users}
            />
            <StatCard
              title="Total Products"
              value={stats?.total_products}
              change="6.8% vs last week"
              icon={Package}
            />
          </>
        )}
      </div>

      {/* Charts + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Sales chart */}
        <div className="admin-card lg:col-span-3">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-cream font-semibold">Sales Overview</h2>
            <span className="text-cream/30 text-xs font-sans border border-cream/10 px-2 py-1 rounded-sm">
              Last 7 Days
            </span>
          </div>
          {isLoading ? (
            <div className="skeleton h-48 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.gold} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.gold} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,169,110,0.05)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'rgba(245,230,200,0.3)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'rgba(245,230,200,0.3)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1a1610',
                    border: '1px solid rgba(201,169,110,0.2)',
                    borderRadius: 0,
                    color: '#f5e6c8',
                    fontSize: 12,
                  }}
                  formatter={(v: any) => [`₹${parseFloat(v).toLocaleString('en-IN')}`, 'Sales']}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke={CHART_COLORS.gold}
                  strokeWidth={2}
                  fill="url(#salesGradient)"
                  dot={{ fill: CHART_COLORS.gold, r: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top selling products */}
        <div className="admin-card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-cream font-semibold">Top Selling Products</h2>
            <Link to="/products" className="text-gold-500 text-xs hover:underline">View All →</Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-8" />)}
            </div>
          ) : topProducts.length === 0 ? (
            <p className="text-cream/30 text-sm text-center py-8">No sales data yet.</p>
          ) : (
            <ol className="space-y-3">
              {topProducts.map((p: any, i: number) => (
                <li key={p.product_id} className="flex items-center gap-3">
                  <span className="text-gold-500/40 text-sm font-mono w-4">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-cream/80 text-sm truncate">{p.product_name}</p>
                    <p className="text-cream/30 text-xs">₹{parseFloat(p.revenue).toLocaleString('en-IN')}</p>
                  </div>
                  <span className="text-gold-500/60 text-xs flex-shrink-0">{p.qty_sold} sold</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Recent orders + Quick actions + Low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent orders */}
        <div className="admin-card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-cream font-semibold">Recent Orders</h2>
            <Link to="/orders" className="text-gold-500 text-xs hover:underline">View All →</Link>
          </div>
          {isLoading ? (
            <div className="skeleton h-40 w-full" />
          ) : recentOrders.length === 0 ? (
            <p className="text-cream/30 text-sm text-center py-8">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o: any) => (
                    <tr key={o.id}>
                      <td className="text-gold-500 font-mono text-xs">{o.order_number}</td>
                      <td><StatusBadge status={o.status} /></td>
                      <td className="text-cream font-medium">₹{parseFloat(o.total_amount).toLocaleString('en-IN')}</td>
                      <td className="text-cream/40 text-xs">
                        {new Date(o.placed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick actions + Alerts */}
        <div className="space-y-4">
          {/* Quick actions */}
          <div className="admin-card">
            <h2 className="font-serif text-cream font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { icon: Plus, label: 'Add New Product', to: '/products' },
                { icon: Eye, label: 'View Orders', to: '/orders' },
                { icon: UserPlus, label: 'Add Customer', to: '/customers' },
                { icon: BarChart2, label: 'View Reports', to: '/orders' },
              ].map(({ icon: Icon, label, to }) => (
                <Link
                  key={label}
                  to={to}
                  className="flex items-center gap-3 w-full px-3 py-2.5 border border-gold-500/15
                             hover:border-gold-500/40 hover:bg-gold-500/5 transition-all duration-200"
                >
                  <Icon size={14} className="text-gold-500" />
                  <span className="text-cream/70 text-sm font-sans">{label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Low stock */}
          {lowStockAlerts.length > 0 && (
            <div className="admin-card border-red-500/10">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-amber-400" />
                <h2 className="font-serif text-cream font-semibold text-sm">Low Stock Alerts</h2>
              </div>
              <div className="space-y-2">
                {lowStockAlerts.slice(0, 4).map((a: any) => (
                  <div key={a.product_id} className="flex items-center justify-between text-xs">
                    <span className="text-cream/60 truncate flex-1">{a.product_name}</span>
                    <span className="text-red-400 font-medium ml-2">{a.quantity} left</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
