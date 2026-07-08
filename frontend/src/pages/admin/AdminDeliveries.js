import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Truck } from '@phosphor-icons/react';
import { useAuth } from '../../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const defaultForm = {
  order_id: '',
  delivery_date: '',
  delivery_method: 'nationwide_courier',
  courier: '',
  tracking_number: '',
  status: 'scheduled',
  notes: '',
  customer_name: '',
  customer_phone: '',
  customer_email: ''
};

const AdminDeliveries = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    fetchDeliveries();
  }, [authLoading, user, navigate]);

  const fetchDeliveries = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/admin/deliveries`, { headers: { Authorization: `Bearer ${token}` } });
      setDeliveries(res.data.deliveries || []);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const createDelivery = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/admin/deliveries`, form, { headers: { Authorization: `Bearer ${token}` } });
      setForm(defaultForm);
      await fetchDeliveries();
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to create delivery');
    }
  };

  const markStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/admin/deliveries/${id}`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      await fetchDeliveries();
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to update delivery');
    }
  };

  return (
    <div className="min-h-screen bg-[#F3E4CC]">
      <div className="bg-[#15110E] text-[#F3E4CC] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/admin" className="inline-flex items-center gap-2 text-[#D7B98C] hover:text-white mb-4">
            <ArrowLeft size={20} /> Back to Dashboard
          </Link>
          <h1 className="font-heading text-3xl">Delivery Scheduling</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-5">
          <h2 className="font-heading text-xl text-[#15110E] mb-4">Schedule Delivery</h2>
          <form onSubmit={createDelivery} className="space-y-3">
            <input className="w-full border border-[#D7B98C] px-3 py-2 rounded" placeholder="Order ID" value={form.order_id} onChange={(e) => setForm({ ...form, order_id: e.target.value })} required />
            <input className="w-full border border-[#D7B98C] px-3 py-2 rounded" type="date" value={form.delivery_date} onChange={(e) => setForm({ ...form, delivery_date: e.target.value })} required />
            <select className="w-full border border-[#D7B98C] px-3 py-2 rounded" value={form.delivery_method} onChange={(e) => setForm({ ...form, delivery_method: e.target.value })}>
              <option value="nationwide_courier">Nationwide Courier</option>
              <option value="local_delivery">Local Delivery</option>
              <option value="pickup">Pickup</option>
            </select>
            <input className="w-full border border-[#D7B98C] px-3 py-2 rounded" placeholder="Courier" value={form.courier} onChange={(e) => setForm({ ...form, courier: e.target.value })} />
            <input className="w-full border border-[#D7B98C] px-3 py-2 rounded" placeholder="Tracking number" value={form.tracking_number} onChange={(e) => setForm({ ...form, tracking_number: e.target.value })} />
            <input className="w-full border border-[#D7B98C] px-3 py-2 rounded" placeholder="Customer name" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} required />
            <input className="w-full border border-[#D7B98C] px-3 py-2 rounded" placeholder="Customer phone" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} />
            <input className="w-full border border-[#D7B98C] px-3 py-2 rounded" placeholder="Customer email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} />
            <textarea className="w-full border border-[#D7B98C] px-3 py-2 rounded" rows={2} placeholder="Delivery notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <button className="bg-[#B56A35] text-white px-4 py-2 rounded inline-flex items-center gap-2"><Truck size={16} /> Schedule</button>
          </form>
          {error && <p className="text-sm text-red-700 mt-3">{error}</p>}
        </div>

        <div className="lg:col-span-3 bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E6DCD1] flex items-center justify-between">
            <h2 className="font-heading text-xl text-[#15110E]">Deliveries</h2>
            <a href={`${API}/admin/deliveries/export`} className="text-sm text-[#B56A35]">Export CSV</a>
          </div>
          {loading ? <div className="p-6">Loading...</div> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F3E4CC]"><tr><th className="px-4 py-2 text-left text-xs uppercase">Order</th><th className="px-4 py-2 text-left text-xs uppercase">Date</th><th className="px-4 py-2 text-left text-xs uppercase">Method</th><th className="px-4 py-2 text-left text-xs uppercase">Status</th><th className="px-4 py-2 text-left text-xs uppercase">Actions</th></tr></thead>
                <tbody>
                  {deliveries.map((d) => (
                    <tr key={d._id} className="border-t border-[#E6DCD1]">
                      <td className="px-4 py-3">{d.order_id}</td>
                      <td className="px-4 py-3">{d.delivery_date}</td>
                      <td className="px-4 py-3">{d.delivery_method}</td>
                      <td className="px-4 py-3">{d.status}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button className="text-xs text-[#B56A35]" onClick={() => markStatus(d._id, 'packed')}>Packed</button>
                          <button className="text-xs text-[#B56A35]" onClick={() => markStatus(d._id, 'shipped')}>Shipped</button>
                          <button className="text-xs text-[#B56A35]" onClick={() => markStatus(d._id, 'delivered')}>Delivered</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDeliveries;
