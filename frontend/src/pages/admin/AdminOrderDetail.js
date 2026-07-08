import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package,
  MapPin,
  Truck,
  CreditCard,
  User,
  Check
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminOrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrder(response.data);
      setNewStatus(response.data.status);
      setTrackingNumber(response.data.tracking_number || '');
      setNotes(response.data.notes || '');
    } catch (err) {
      console.error('Failed to fetch order:', err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    fetchOrder();
  }, [user, authLoading, navigate, fetchOrder]);

  const handleUpdateStatus = async () => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/admin/orders/${orderId}/status`,
        {
          status: newStatus,
          tracking_number: trackingNumber || null,
          notes: notes || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchOrder();
      alert('Order status updated successfully');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  const handlePrintPackingSlip = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/orders/${orderId}/packing-slip`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'text'
      });
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`<pre style="font-family: monospace; padding: 16px;">${response.data.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to generate packing slip');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/admin/orders/${orderId}/resend-confirmation`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Confirmation resent to ${response.data.email}`);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to resend confirmation');
    } finally {
      setActionLoading(false);
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
      month: 'long',
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D05C23] border-t-transparent"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[#2C1A12] mb-2">Order Not Found</h2>
          <Link to="/admin/orders" className="text-[#D05C23] hover:underline">Back to Orders</Link>
        </div>
      </div>
    );
  }

  const shippingAddress = order.shipping?.address || {};

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      {/* Header */}
      <div className="bg-[#2C1A12] text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/admin/orders" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4">
            <ArrowLeft size={20} />
            Back to Orders
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl">Order #{order.order_number}</h1>
              <p className="text-white/70 mt-1">{formatDate(order.created_at)}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#E6DCD1] flex items-center gap-2">
                <Package size={20} className="text-[#D05C23]" />
                <h2 className="font-heading text-xl text-[#2C1A12]">Order Items</h2>
              </div>
              <div className="divide-y divide-[#E6DCD1]">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="p-4 flex items-center gap-4">
                    <div className="w-16 h-16 bg-[#F8F5F0] rounded-lg overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={24} className="text-[#6B5048]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-[#2C1A12]">{item.name}</p>
                      <p className="text-sm text-[#6B5048]">{item.variant_name}</p>
                      <p className="text-sm text-[#6B5048]">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-[#2C1A12]">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-[#F8F5F0] space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B5048]">Subtotal</span>
                  <span className="text-[#2C1A12]">{formatCurrency(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Discount {order.coupon_code && `(${order.coupon_code})`}</span>
                    <span className="text-green-600">-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B5048]">Shipping</span>
                  <span className="text-[#2C1A12]">{formatCurrency(order.shipping_cost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B5048]">VAT (15%)</span>
                  <span className="text-[#2C1A12]">{formatCurrency(order.vat)}</span>
                </div>
                <div className="flex justify-between font-heading text-lg pt-2 border-t border-[#E6DCD1]">
                  <span className="text-[#2C1A12]">Total</span>
                  <span className="text-[#D05C23]">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#E6DCD1] flex items-center gap-2">
                <MapPin size={20} className="text-[#D05C23]" />
                <h2 className="font-heading text-xl text-[#2C1A12]">Shipping Address</h2>
              </div>
              <div className="p-4">
                <p className="font-medium text-[#2C1A12]">
                  {shippingAddress.first_name} {shippingAddress.last_name}
                </p>
                <p className="text-[#6B5048] mt-1">{shippingAddress.address_line1}</p>
                {shippingAddress.address_line2 && (
                  <p className="text-[#6B5048]">{shippingAddress.address_line2}</p>
                )}
                <p className="text-[#6B5048]">
                  {shippingAddress.city}, {shippingAddress.province} {shippingAddress.postal_code}
                </p>
                <p className="text-[#6B5048]">{shippingAddress.country || 'South Africa'}</p>
                {shippingAddress.phone && (
                  <p className="text-[#6B5048] mt-2">Phone: {shippingAddress.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#E6DCD1] flex items-center gap-2">
                <User size={20} className="text-[#D05C23]" />
                <h2 className="font-heading text-xl text-[#2C1A12]">Customer</h2>
              </div>
              <div className="p-4">
                {order.customer ? (
                  <>
                    <p className="font-medium text-[#2C1A12]">{order.customer.name}</p>
                    <p className="text-[#6B5048]">{order.customer.email}</p>
                    {order.customer.phone && (
                      <p className="text-[#6B5048]">{order.customer.phone}</p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="font-medium text-[#2C1A12]">Guest Checkout</p>
                    <p className="text-[#6B5048]">{order.guest_email}</p>
                  </>
                )}
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#E6DCD1] flex items-center gap-2">
                <CreditCard size={20} className="text-[#D05C23]" />
                <h2 className="font-heading text-xl text-[#2C1A12]">Payment</h2>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#6B5048]">Method</span>
                  <span className="text-[#2C1A12] capitalize">{order.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B5048]">Status</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    order.payment_status === 'complete' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.payment_status}
                  </span>
                </div>
                {order.payment_reference && (
                  <div className="flex justify-between">
                    <span className="text-[#6B5048]">Reference</span>
                    <span className="text-[#2C1A12] text-sm font-mono">{order.payment_reference}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Update Status */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#E6DCD1] flex items-center gap-2">
                <Truck size={20} className="text-[#D05C23]" />
                <h2 className="font-heading text-xl text-[#2C1A12]">Update Status</h2>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm text-[#6B5048] mb-1">Order Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E6DCD1] rounded-lg focus:ring-2 focus:ring-[#D05C23] focus:border-[#D05C23]"
                  >
                    <option value="pending">Pending</option>
                    <option value="pending_payment">Pending Payment</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#6B5048] mb-1">Tracking Number</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                    className="w-full px-3 py-2 border border-[#E6DCD1] rounded-lg focus:ring-2 focus:ring-[#D05C23] focus:border-[#D05C23]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#6B5048] mb-1">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Internal notes"
                    rows={3}
                    className="w-full px-3 py-2 border border-[#E6DCD1] rounded-lg focus:ring-2 focus:ring-[#D05C23] focus:border-[#D05C23]"
                  />
                </div>
                <button
                  onClick={handleUpdateStatus}
                  disabled={updating || actionLoading}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  {updating ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      <Check size={18} />
                      Update Order
                    </>
                  )}
                </button>
                <button
                  onClick={handlePrintPackingSlip}
                  disabled={actionLoading}
                  className="w-full bg-[#15110E] text-white px-4 py-2 rounded-lg"
                >
                  Print Packing Slip
                </button>
                <button
                  onClick={handleResendConfirmation}
                  disabled={actionLoading}
                  className="w-full bg-[#B56A35] text-white px-4 py-2 rounded-lg"
                >
                  Resend Confirmation
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetail;
