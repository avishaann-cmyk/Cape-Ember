import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Ticket,
  Plus,
  Trash,
  X,
  Check
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminCoupons = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    minimum_order: '',
    valid_from: '',
    valid_until: '',
    is_active: true
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    fetchCoupons();
  }, [user, authLoading, navigate]);

  const fetchCoupons = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/coupons`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCoupons(response.data.coupons);
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/admin/coupons`,
        {
          ...formData,
          discount_value: parseFloat(formData.discount_value),
          minimum_order: parseFloat(formData.minimum_order) || 0
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowModal(false);
      setFormData({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        minimum_order: '',
        valid_from: '',
        valid_until: '',
        is_active: true
      });
      fetchCoupons();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create coupon');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (code) => {
    if (!window.confirm(`Are you sure you want to delete coupon "${code}"?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/admin/coupons/${code}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCoupons(prev => prev.filter(c => c.code !== code));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete coupon');
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

  const isExpired = (validUntil) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
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
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-3xl">Coupons</h1>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} />
              Create Coupon
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Coupons Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#D05C23] border-t-transparent mx-auto"></div>
            </div>
          ) : coupons.length === 0 ? (
            <div className="p-8 text-center text-[#6B5048]">
              <Ticket size={48} className="mx-auto mb-4 opacity-50" />
              <p>No coupons yet</p>
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary mt-4"
              >
                Create Your First Coupon
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="coupons-table">
                <thead className="bg-[#F8F5F0]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5048] uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5048] uppercase tracking-wider">
                      Discount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5048] uppercase tracking-wider">
                      Min. Order
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5048] uppercase tracking-wider">
                      Valid Until
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5048] uppercase tracking-wider">
                      Uses
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5048] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5048] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DCD1]">
                  {coupons.map((coupon) => (
                    <motion.tr 
                      key={coupon.code}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-[#F8F5F0]/50"
                    >
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-mono font-medium text-[#2C1A12]">{coupon.code}</p>
                          {coupon.description && (
                            <p className="text-sm text-[#6B5048]">{coupon.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-[#D05C23]">
                          {coupon.discount_type === 'percentage' 
                            ? `${coupon.discount_value}%` 
                            : formatCurrency(coupon.discount_value)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-[#6B5048]">
                          {coupon.minimum_order > 0 ? formatCurrency(coupon.minimum_order) : 'None'}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className={`text-sm ${isExpired(coupon.valid_until) ? 'text-red-600' : 'text-[#6B5048]'}`}>
                          {formatDate(coupon.valid_until)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-[#6B5048]">{coupon.uses_count || 0}</p>
                      </td>
                      <td className="px-4 py-4">
                        {isExpired(coupon.valid_until) ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Expired</span>
                        ) : coupon.is_active ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Inactive</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleDelete(coupon.code)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete coupon"
                        >
                          <Trash size={18} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Coupon Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-2xl text-[#2C1A12]">Create Coupon</h2>
                <button onClick={() => setShowModal(false)} className="text-[#6B5048] hover:text-[#2C1A12]">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-[#6B5048] mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g., SUMMER20"
                    required
                    className="w-full px-3 py-2 border border-[#E6DCD1] rounded-lg focus:ring-2 focus:ring-[#D05C23] focus:border-[#D05C23] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#6B5048] mb-1">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="e.g., Summer sale discount"
                    className="w-full px-3 py-2 border border-[#E6DCD1] rounded-lg focus:ring-2 focus:ring-[#D05C23] focus:border-[#D05C23]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#6B5048] mb-1">Discount Type *</label>
                    <select
                      value={formData.discount_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount_type: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#E6DCD1] rounded-lg focus:ring-2 focus:ring-[#D05C23] focus:border-[#D05C23]"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed_amount">Fixed Amount (R)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-[#6B5048] mb-1">Discount Value *</label>
                    <input
                      type="number"
                      value={formData.discount_value}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount_value: e.target.value }))}
                      placeholder={formData.discount_type === 'percentage' ? '10' : '50'}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-[#E6DCD1] rounded-lg focus:ring-2 focus:ring-[#D05C23] focus:border-[#D05C23]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[#6B5048] mb-1">Minimum Order Amount</label>
                  <input
                    type="number"
                    value={formData.minimum_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, minimum_order: e.target.value }))}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-[#E6DCD1] rounded-lg focus:ring-2 focus:ring-[#D05C23] focus:border-[#D05C23]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#6B5048] mb-1">Valid From *</label>
                    <input
                      type="date"
                      value={formData.valid_from}
                      onChange={(e) => setFormData(prev => ({ ...prev, valid_from: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-[#E6DCD1] rounded-lg focus:ring-2 focus:ring-[#D05C23] focus:border-[#D05C23]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#6B5048] mb-1">Valid Until *</label>
                    <input
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-[#E6DCD1] rounded-lg focus:ring-2 focus:ring-[#D05C23] focus:border-[#D05C23]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 text-[#D05C23] border-[#E6DCD1] rounded focus:ring-[#D05C23]"
                  />
                  <label htmlFor="is_active" className="text-sm text-[#6B5048]">Active</label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      <Check size={18} />
                      Create Coupon
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCoupons;
