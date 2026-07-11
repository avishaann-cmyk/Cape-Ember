import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MagnifyingGlass,
  Users,
  CaretLeft,
  CaretRight,
  Crown
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminCustomers = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, total_pages: 1 });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedCustomerSummary, setSelectedCustomerSummary] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editTags, setEditTags] = useState('');

  const fetchCustomers = useCallback(async (searchTerm = '') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      params.append('page', pagination.page);
      params.append('limit', 20);
      if (searchTerm) params.append('search', searchTerm);

      const response = await axios.get(`${API}/admin/customers?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(response.data.customers);
      setPagination({
        page: response.data.page,
        total: response.data.total,
        total_pages: response.data.total_pages
      });
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page]);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    fetchCustomers();
  }, [user, authLoading, navigate, fetchCustomers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchCustomers(search);
  };

  const fetchCustomerDetail = async (customerId) => {
    setDetailLoading(true);
    setDetailError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const detail = response.data?.customer;
      setSelectedCustomer(detail || null);
      setSelectedCustomerSummary(response.data?.summary || null);
      setOrderHistory(response.data?.order_history || []);
      setEditPhone(detail?.phone || '');
      setEditNotes(detail?.notes || '');
      setEditTags((detail?.tags || []).join(', '));
    } catch (err) {
      setDetailError(err.response?.data?.detail || 'Failed to load customer detail');
    } finally {
      setDetailLoading(false);
    }
  };

  const saveCustomer = async () => {
    if (!selectedCustomer?.id) return;
    setDetailError('');
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/admin/customers/${selectedCustomer.id}`,
        {
          phone: editPhone,
          notes: editNotes,
          tags: editTags.split(',').map((tag) => tag.trim()).filter(Boolean)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchCustomerDetail(selectedCustomer.id);
      await fetchCustomers(search);
    } catch (err) {
      setDetailError(err.response?.data?.detail || 'Failed to save customer changes');
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
      year: 'numeric'
    });
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
          <h1 className="font-heading text-3xl">Customers</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B5048]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-[#E6DCD1] rounded-lg focus:ring-2 focus:ring-[#D05C23] focus:border-[#D05C23]"
              />
            </div>
            <button type="submit" className="btn-primary">
              Search
            </button>
          </form>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#D05C23] border-t-transparent mx-auto"></div>
            </div>
          ) : customers.length === 0 ? (
            <div className="p-8 text-center text-[#6B5048]">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>No customers found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="customers-table">
                  <thead className="bg-[#F8F5F0]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5048] uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5048] uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5048] uppercase tracking-wider">
                        Orders
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5048] uppercase tracking-wider">
                        Total Spent
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5048] uppercase tracking-wider">
                        Joined
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DCD1]">
                    {customers.map((customer) => (
                      <motion.tr 
                        key={customer.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`hover:bg-[#F8F5F0]/50 cursor-pointer ${selectedCustomer?.id === customer.id ? 'bg-[#F8F5F0]' : ''}`}
                        onClick={() => fetchCustomerDetail(customer.id)}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#D05C23]/10 flex items-center justify-center">
                              <span className="text-[#D05C23] font-medium">
                                {(customer.first_name?.[0] || customer.email[0]).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-[#2C1A12]">
                                  {customer.first_name} {customer.last_name}
                                </p>
                                {customer.is_admin && (
                                  <Crown size={16} className="text-[#D05C23]" title="Admin" />
                                )}
                              </div>
                              <p className="text-sm text-[#6B5048]">{customer.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-[#6B5048]">{customer.phone || 'No phone'}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-medium text-[#2C1A12]">{customer.orders_count}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-medium text-[#D05C23]">{formatCurrency(customer.total_spent)}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-[#6B5048]">{formatDate(customer.created_at)}</p>
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
                    Showing {(pagination.page - 1) * 20 + 1} to {Math.min(pagination.page * 20, pagination.total)} of {pagination.total} customers
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

        <div className="mt-4 flex justify-end">
          <a
            href={`${API}/admin/customers/export`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#D05C23] hover:underline"
          >
            Export Customers CSV
          </a>
        </div>

        {(detailLoading || selectedCustomer || detailError) && (
          <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
            <h2 className="font-heading text-2xl text-[#2C1A12] mb-4">Customer Detail</h2>

            {detailLoading && <p className="text-[#6B5048]">Loading customer profile...</p>}
            {detailError && <p className="text-[#C53030] text-sm mb-3">{detailError}</p>}

            {!detailLoading && selectedCustomer && (
              <>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-[#F8F5F0] rounded-lg">
                    <p className="text-xs uppercase text-[#6B5048]">Email</p>
                    <p className="text-[#2C1A12] font-medium break-all">{selectedCustomer.email}</p>
                  </div>
                  <div className="p-4 bg-[#F8F5F0] rounded-lg">
                    <p className="text-xs uppercase text-[#6B5048]">Orders</p>
                    <p className="text-[#2C1A12] font-medium">{selectedCustomerSummary?.orders_count ?? 0}</p>
                  </div>
                  <div className="p-4 bg-[#F8F5F0] rounded-lg">
                    <p className="text-xs uppercase text-[#6B5048]">Total Spent</p>
                    <p className="text-[#2C1A12] font-medium">{formatCurrency(selectedCustomerSummary?.total_spent ?? 0)}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-3 mb-6">
                  <input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="Phone"
                    className="w-full border border-[#E6DCD1] rounded-lg px-3 py-2"
                  />
                  <input
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="Tags (comma separated)"
                    className="w-full border border-[#E6DCD1] rounded-lg px-3 py-2 md:col-span-2"
                  />
                </div>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={4}
                  placeholder="Customer notes"
                  className="w-full border border-[#E6DCD1] rounded-lg px-3 py-2 mb-4"
                />
                <button
                  onClick={saveCustomer}
                  className="btn-primary"
                >
                  Save Customer
                </button>

                <div className="mt-8">
                  <h3 className="font-heading text-xl text-[#2C1A12] mb-3">Order History</h3>
                  {orderHistory.length === 0 ? (
                    <p className="text-[#6B5048] text-sm">No orders yet.</p>
                  ) : (
                    <div className="overflow-x-auto border border-[#E6DCD1] rounded-lg">
                      <table className="w-full">
                        <thead className="bg-[#F8F5F0]">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs uppercase text-[#6B5048]">Order</th>
                            <th className="px-3 py-2 text-left text-xs uppercase text-[#6B5048]">Status</th>
                            <th className="px-3 py-2 text-left text-xs uppercase text-[#6B5048]">Total</th>
                            <th className="px-3 py-2 text-left text-xs uppercase text-[#6B5048]">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E6DCD1]">
                          {orderHistory.map((order) => (
                            <tr key={order.id}>
                              <td className="px-3 py-2 text-sm text-[#2C1A12]">{order.order_number}</td>
                              <td className="px-3 py-2 text-sm text-[#6B5048]">{order.status}</td>
                              <td className="px-3 py-2 text-sm text-[#2C1A12]">{formatCurrency(order.total || 0)}</td>
                              <td className="px-3 py-2 text-sm text-[#6B5048]">{formatDate(order.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCustomers;
