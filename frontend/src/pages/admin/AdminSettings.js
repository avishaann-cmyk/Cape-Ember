import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft } from '@phosphor-icons/react';
import { useAuth } from '../../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminSettings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    fetchSettings();
  }, [authLoading, user, navigate]);

  const fetchSettings = async () => {
    const token = localStorage.getItem('token');
    const res = await axios.get(`${API}/admin/settings`, { headers: { Authorization: `Bearer ${token}` } });
    setForm(res.data || {});
  };

  const save = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    await axios.put(`${API}/admin/settings`, {
      ...form,
      shipping_fee: Number(form.shipping_fee || 0),
      free_shipping_threshold: Number(form.free_shipping_threshold || 0),
      vat_rate: Number(form.vat_rate || 0)
    }, { headers: { Authorization: `Bearer ${token}` } });
    setMessage('Settings saved');
    setTimeout(() => setMessage(''), 2500);
  };

  return (
    <div className="min-h-screen bg-[#F3E4CC]">
      <div className="bg-[#15110E] text-[#F3E4CC] py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/admin" className="inline-flex items-center gap-2 text-[#D7B98C] hover:text-white mb-4"><ArrowLeft size={20} /> Back to Dashboard</Link>
          <h1 className="font-heading text-3xl">Store Settings</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={save} className="bg-white rounded-lg shadow-sm p-5 space-y-3">
          <input className="w-full border border-[#D7B98C] px-3 py-2 rounded" placeholder="Store name" value={form.store_name || ''} onChange={(e) => setForm({ ...form, store_name: e.target.value })} />
          <input className="w-full border border-[#D7B98C] px-3 py-2 rounded" placeholder="Contact email" value={form.contact_email || ''} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
          <input className="w-full border border-[#D7B98C] px-3 py-2 rounded" placeholder="WhatsApp number" value={form.whatsapp_number || ''} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} />
          <input type="number" className="w-full border border-[#D7B98C] px-3 py-2 rounded" placeholder="Shipping fee" value={form.shipping_fee || ''} onChange={(e) => setForm({ ...form, shipping_fee: e.target.value })} />
          <input type="number" className="w-full border border-[#D7B98C] px-3 py-2 rounded" placeholder="Free shipping threshold" value={form.free_shipping_threshold || ''} onChange={(e) => setForm({ ...form, free_shipping_threshold: e.target.value })} />
          <input type="number" step="0.01" className="w-full border border-[#D7B98C] px-3 py-2 rounded" placeholder="VAT rate" value={form.vat_rate || ''} onChange={(e) => setForm({ ...form, vat_rate: e.target.value })} />
          <button className="bg-[#B56A35] text-white px-4 py-2 rounded">Save Settings</button>
          {message && <p className="text-green-700 text-sm">{message}</p>}
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;
