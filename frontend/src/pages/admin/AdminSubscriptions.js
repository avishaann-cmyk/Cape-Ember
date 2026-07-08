import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft } from '@phosphor-icons/react';
import { useAuth } from '../../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_OPTIONS = ['requested', 'active', 'paused', 'cancelled'];

const AdminSubscriptions = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    fetchSubscriptions();
  }, [authLoading, user, navigate]);

  const fetchSubscriptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/admin/subscriptions`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: statusFilter || undefined, limit: 100 }
      });
      setSubscriptions(res.data.subscriptions || []);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load subscriptions');
    }
  };

  const updateSubscription = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/admin/subscriptions/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchSubscriptions();
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to update subscription');
    }
  };

  return (
    <div className="min-h-screen bg-[#F3E4CC]">
      <div className="bg-[#15110E] text-[#F3E4CC] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/admin" className="inline-flex items-center gap-2 text-[#D7B98C] hover:text-white mb-4">
            <ArrowLeft size={20} /> Back to Dashboard
          </Link>
          <h1 className="font-heading text-3xl">Subscriptions</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <div className="bg-white rounded-lg shadow-sm p-4 flex gap-3 items-end">
          <div>
            <label className="text-sm text-[#3A2418] block mb-1">Status</label>
            <select
              className="border border-[#D7B98C] px-3 py-2 rounded"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <button onClick={fetchSubscriptions} className="bg-[#15110E] text-white px-4 py-2 rounded">Filter</button>
        </div>

        {error && <p className="text-red-700">{error}</p>}

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#F3E4CC]">
              <tr>
                <th className="text-left px-4 py-3 text-xs uppercase">Customer</th>
                <th className="text-left px-4 py-3 text-xs uppercase">Plan</th>
                <th className="text-left px-4 py-3 text-xs uppercase">Coffee</th>
                <th className="text-left px-4 py-3 text-xs uppercase">Frequency</th>
                <th className="text-left px-4 py-3 text-xs uppercase">Next Delivery</th>
                <th className="text-left px-4 py-3 text-xs uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs uppercase">Payment</th>
                <th className="text-left px-4 py-3 text-xs uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((s) => (
                <tr key={s.id} className="border-t border-[#E6DCD1]">
                  <td className="px-4 py-3">
                    <p className="font-medium">{s.customer_name || 'Guest'}</p>
                    <p className="text-xs text-[#6F7A52]">{s.customer_email || '-'}</p>
                  </td>
                  <td className="px-4 py-3">{s.plan_name}</td>
                  <td className="px-4 py-3">{s.blend || '-'}</td>
                  <td className="px-4 py-3">{s.frequency}</td>
                  <td className="px-4 py-3">{s.next_delivery_date?.slice(0, 10) || '-'}</td>
                  <td className="px-4 py-3">{s.status}</td>
                  <td className="px-4 py-3">{s.payment_status || '-'}</td>
                  <td className="px-4 py-3">
                    <select
                      className="border border-[#D7B98C] px-2 py-1 rounded text-sm"
                      value={s.status || 'requested'}
                      onChange={(e) => updateSubscription(s.id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {subscriptions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[#6F7A52]">No subscriptions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSubscriptions;
