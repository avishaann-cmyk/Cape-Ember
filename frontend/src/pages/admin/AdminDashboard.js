import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Users, 
  CurrencyCircleDollar, 
  Package,
  ChartLineUp,
  Warning,
  CaretRight,
  Ticket,
  Truck,
  Star,
  Gear,
  NotePencil,
  EnvelopeSimple,
  Repeat
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;
    
    // Redirect if not admin
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    fetchDashboard();
  }, [user, authLoading, navigate]);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      pending_payment: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      complete: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D05C23] border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center">
        <div className="text-center">
          <Warning size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[#2C1A12] mb-2">Access Denied</h2>
          <p className="text-[#6B5048]">{error}</p>
          <Link to="/" className="btn-primary mt-4 inline-block">Return Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      {/* Header */}
      <div className="bg-[#2C1A12] text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-heading text-3xl mb-2">Admin Dashboard</h1>
          <p className="text-white/70">Welcome back, {user?.first_name || 'Admin'}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Package, label: 'Products', href: '/admin/products', color: 'bg-[#3A2418]' },
            { icon: ShoppingBag, label: 'Orders', href: '/admin/orders', color: 'bg-blue-500' },
            { icon: Users, label: 'Customers', href: '/admin/customers', color: 'bg-green-500' },
            { icon: Package, label: 'Inventory', href: '/admin/inventory', color: 'bg-purple-500' },
            { icon: Ticket, label: 'Coupons', href: '/admin/coupons', color: 'bg-orange-500' },
            { icon: Truck, label: 'Deliveries', href: '/admin/deliveries', color: 'bg-cyan-600' },
            { icon: Star, label: 'Reviews', href: '/admin/reviews', color: 'bg-amber-500' },
            { icon: ChartLineUp, label: 'Reports', href: '/admin/reports', color: 'bg-emerald-600' },
            { icon: Gear, label: 'Settings', href: '/admin/settings', color: 'bg-gray-700' },
            { icon: NotePencil, label: 'Content', href: '/admin/content', color: 'bg-[#6F7A52]' },
            { icon: EnvelopeSimple, label: 'Subscribers', href: '/admin/subscribers', color: 'bg-[#B56A35]' },
            { icon: Repeat, label: 'Subscriptions', href: '/admin/subscriptions', color: 'bg-[#3A2418]' },
          ].map((item, idx) => (
            <Link
              key={idx}
              to={item.href}
              className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow flex items-center gap-3"
              data-testid={`admin-nav-${item.label.toLowerCase()}`}
            >
              <div className={`${item.color} text-white p-3 rounded-lg`}>
                <item.icon size={24} />
              </div>
              <span className="font-medium text-[#2C1A12]">{item.label}</span>
              <CaretRight size={16} className="ml-auto text-[#6B5048]" />
            </Link>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg shadow-sm"
            data-testid="stat-revenue-today"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <CurrencyCircleDollar size={24} className="text-green-600" />
              </div>
              <span className="text-xs text-green-600 font-medium">Today</span>
            </div>
            <p className="text-2xl font-heading text-[#2C1A12]">
              {formatCurrency(stats?.overview?.revenue_today || 0)}
            </p>
            <p className="text-sm text-[#6B5048]">{stats?.overview?.orders_today || 0} orders</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-lg shadow-sm"
            data-testid="stat-revenue-week"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <ChartLineUp size={24} className="text-blue-600" />
              </div>
              <span className="text-xs text-blue-600 font-medium">This Week</span>
            </div>
            <p className="text-2xl font-heading text-[#2C1A12]">
              {formatCurrency(stats?.overview?.revenue_this_week || 0)}
            </p>
            <p className="text-sm text-[#6B5048]">{stats?.overview?.orders_this_week || 0} orders</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-lg shadow-sm"
            data-testid="stat-revenue-month"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <ShoppingBag size={24} className="text-purple-600" />
              </div>
              <span className="text-xs text-purple-600 font-medium">This Month</span>
            </div>
            <p className="text-2xl font-heading text-[#2C1A12]">
              {formatCurrency(stats?.overview?.revenue_this_month || 0)}
            </p>
            <p className="text-sm text-[#6B5048]">{stats?.overview?.orders_this_month || 0} orders</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-lg shadow-sm"
            data-testid="stat-total"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-[#D05C23]/10 p-3 rounded-lg">
                <CurrencyCircleDollar size={24} className="text-[#D05C23]" />
              </div>
              <span className="text-xs text-[#D05C23] font-medium">All Time</span>
            </div>
            <p className="text-2xl font-heading text-[#2C1A12]">
              {formatCurrency(stats?.overview?.total_revenue || 0)}
            </p>
            <p className="text-sm text-[#6B5048]">{stats?.overview?.total_orders || 0} orders</p>
          </motion.div>
        </div>

        {/* Alerts */}
        {(stats?.overview?.pending_orders > 0 || stats?.overview?.low_stock_products > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {stats?.overview?.pending_orders > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex items-center gap-4">
                <Warning size={24} className="text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">
                    {stats.overview.pending_orders} Pending Orders
                  </p>
                  <Link to="/admin/orders?status=pending" className="text-sm text-yellow-700 underline">
                    View pending orders
                  </Link>
                </div>
              </div>
            )}
            {stats?.overview?.low_stock_products > 0 && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-center gap-4">
                <Package size={24} className="text-red-600" />
                <div>
                  <p className="font-medium text-red-800">
                    {stats.overview.low_stock_products} Low Stock Items
                  </p>
                  <Link to="/admin/inventory" className="text-sm text-red-700 underline">
                    View inventory
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#E6DCD1] flex items-center justify-between">
              <h2 className="font-heading text-xl text-[#2C1A12]">Recent Orders</h2>
              <Link to="/admin/orders" className="text-[#D05C23] text-sm hover:underline">
                View all
              </Link>
            </div>
            <div className="divide-y divide-[#E6DCD1]">
              {stats?.recent_orders?.length > 0 ? (
                stats.recent_orders.map((order) => (
                  <Link
                    key={order.id}
                    to={`/admin/orders/${order.id}`}
                    className="p-4 flex items-center justify-between hover:bg-[#F8F5F0] transition-colors"
                  >
                    <div>
                      <p className="font-medium text-[#2C1A12]">#{order.order_number}</p>
                      <p className="text-sm text-[#6B5048]">{order.customer_email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-[#2C1A12]">{formatCurrency(order.total)}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="p-4 text-center text-[#6B5048]">No orders yet</p>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#E6DCD1]">
              <h2 className="font-heading text-xl text-[#2C1A12]">Top Products</h2>
            </div>
            <div className="divide-y divide-[#E6DCD1]">
              {stats?.top_products?.length > 0 ? (
                stats.top_products.map((product, idx) => (
                  <div key={product.id} className="p-4 flex items-center gap-4">
                    <span className="w-8 h-8 flex items-center justify-center bg-[#F8F5F0] rounded-full text-sm font-medium text-[#6B5048]">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-[#2C1A12]">{product.name}</p>
                      <p className="text-sm text-[#6B5048]">{product.units_sold} units sold</p>
                    </div>
                    <p className="font-medium text-[#D05C23]">{formatCurrency(product.revenue)}</p>
                  </div>
                ))
              ) : (
                <p className="p-4 text-center text-[#6B5048]">No sales data yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Customer Stats */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="font-heading text-xl text-[#2C1A12] mb-4">Customer Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <div>
              <p className="text-3xl font-heading text-[#2C1A12]">{stats?.overview?.total_customers || 0}</p>
              <p className="text-sm text-[#6B5048]">Total Customers</p>
            </div>
            <div>
              <p className="text-3xl font-heading text-[#2C1A12]">{stats?.overview?.new_customers || 0}</p>
              <p className="text-sm text-[#6B5048]">New This Month</p>
            </div>
            <div>
              <p className="text-3xl font-heading text-[#2C1A12]">
                {stats?.overview?.total_orders && stats?.overview?.total_customers 
                  ? (stats.overview.total_orders / stats.overview.total_customers).toFixed(1)
                  : '0'}
              </p>
              <p className="text-sm text-[#6B5048]">Avg. Orders/Customer</p>
            </div>
            <div>
              <p className="text-3xl font-heading text-[#2C1A12]">
                {stats?.overview?.total_revenue && stats?.overview?.total_orders
                  ? formatCurrency(stats.overview.total_revenue / stats.overview.total_orders)
                  : formatCurrency(0)}
              </p>
              <p className="text-sm text-[#6B5048]">Avg. Order Value</p>
            </div>
            <div>
              <p className="text-3xl font-heading text-[#2C1A12]">{stats?.overview?.active_subscriptions || 0}</p>
              <p className="text-sm text-[#6B5048]">Active Subscriptions</p>
            </div>
            <div>
              <p className="text-3xl font-heading text-[#2C1A12]">{stats?.overview?.newsletter_signups || 0}</p>
              <p className="text-sm text-[#6B5048]">Newsletter Signups</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
