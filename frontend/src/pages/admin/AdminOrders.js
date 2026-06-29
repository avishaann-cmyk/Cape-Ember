import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  MagnifyingGlass,
  Funnel,
  CaretLeft,
  CaretRight,
  Eye
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminOrders = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, total_pages: 1 });
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');

  useEffect(() => {
    if (authLoading) return;
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    fetchOrders();
  }, [user, authLoading, navigate, statusFilter, pagination.page]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      params.append('page', pagination.page);
      params.append('limit', 15);
      if (statusFilter) params.append('status', statusFilter);

      const response = await axios.get(`${API}/admin/orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data.orders);
      setPagination({
        page: response.data.page,
        total: response.data.total,
        total_pages: response.data.total_pages
      });
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError(err.response?.data?.detail || 'Failed to load orders. Please try again.');
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

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, page: 1 }));
    if (status) {
      setSearchParams({ status });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      {/* Header */}
      <div className="bg-[#2C1A12] text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/admin" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4">
            <ArrowLeft size={20} />
            Back to Dashboard
          </Link>
          <h1 className="font-heading text-3xl">Orders</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Funnel size={20} className="text-[#6B5048]" />
              <span className="text-sm text-[#6B5048]">Filter by status:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['', 'pending', 'pending_payment', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusFilter(status)}
                  className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                    statusFilter === status
                      ? 'bg-[#D05C23] text-white'
                      : 'bg-[#F8F5F0] text-[#6B5048] hover:bg-[#E6DCD1]'
                  }`}
                >
                  {status || 'All'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#D05C23] border-t-transparent mx-auto"></div>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="text-red-500 mb-4">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="font-medium">Failed to load orders</p>
                <p className="text-sm text-[#6B5048] mt-1">{error}</p>
              </div>
              <button
                onClick={() => fetchOrders()}
                className="btn-primary"
              >
                Retry
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-[#6B5048]">
              No orders found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="orders-table">
                  <thead className="bg-[#F8F5F0]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5048] uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5048] uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5048] uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5048] uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5048] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5048] uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5048] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DCD1]">
                    {orders.map((order) => (
                      <motion.tr 
                        key={order.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-[#F8F5F0]/50"
                      >
                        <td className="px-4 py-4">
                          <p className="font-medium text-[#2C1A12]">#{order.order_number}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-[#2C1A12]">{order.customer_name}</p>
                          <p className="text-sm text-[#6B5048]">{order.customer_email}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-[#6B5048]">{order.items_count} items</span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-medium text-[#2C1A12]">{formatCurrency(order.total)}</p>
                          {order.discount > 0 && (
                            <p className="text-xs text-green-600">-{formatCurrency(order.discount)} discount</p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-[#6B5048]">{formatDate(order.created_at)}</p>
                        </td>
                        <td className="px-4 py-4">
                          <Link
                            to={`/admin/orders/${order.id}`}
                            className="inline-flex items-center gap-1 text-[#D05C23] hover:underline"
                          >
                            <Eye size={16} />
                            View
                          </Link>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.total_pages > 1 && (
                <div className="px-4 py-3 border-t border-[#E6DCD1] flex items-center justify-between">
                  <p className="text-sm text-[#6B5048]">
                    Showing {(pagination.page - 1) * 15 + 1} to {Math.min(pagination.page * 15, pagination.total)} of {pagination.total} orders
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="p-2 rounded-lg bg-[#F8F5F0] hover:bg-[#E6DCD1] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CaretLeft size={20} />
                    </button>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.total_pages}
                      className="p-2 rounded-lg bg-[#F8F5F0] hover:bg-[#E6DCD1] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CaretRight size={20} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
