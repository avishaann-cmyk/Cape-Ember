import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft } from '@phosphor-icons/react';
import { useAuth } from '../../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminContent = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState({
    hero_title: '',
    hero_subtitle: '',
    brand_story: '',
    shipping_policy: '',
    returns_policy: '',
    announcement_bar: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    fetchContent();
  }, [authLoading, user, navigate]);

  const fetchContent = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/admin/content`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setForm((prev) => ({ ...prev, ...res.data }));
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load content');
    }
  };

  const saveContent = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/admin/content`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Content saved');
      setTimeout(() => setMessage(''), 2500);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to save content');
    }
  };

  return (
    <div className="min-h-screen bg-[#F3E4CC]">
      <div className="bg-[#15110E] text-[#F3E4CC] py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/admin" className="inline-flex items-center gap-2 text-[#D7B98C] hover:text-white mb-4">
            <ArrowLeft size={20} /> Back to Dashboard
          </Link>
          <h1 className="font-heading text-3xl">Content Pages</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={saveContent} className="bg-white rounded-lg shadow-sm p-5 space-y-4">
          <div>
            <label className="block text-sm text-[#3A2418] mb-1">Hero Title</label>
            <input className="w-full border border-[#D7B98C] px-3 py-2 rounded" value={form.hero_title || ''} onChange={(e) => setForm({ ...form, hero_title: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-[#3A2418] mb-1">Hero Subtitle</label>
            <textarea className="w-full border border-[#D7B98C] px-3 py-2 rounded" rows={3} value={form.hero_subtitle || ''} onChange={(e) => setForm({ ...form, hero_subtitle: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-[#3A2418] mb-1">Brand Story</label>
            <textarea className="w-full border border-[#D7B98C] px-3 py-2 rounded" rows={4} value={form.brand_story || ''} onChange={(e) => setForm({ ...form, brand_story: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-[#3A2418] mb-1">Shipping Policy</label>
            <textarea className="w-full border border-[#D7B98C] px-3 py-2 rounded" rows={3} value={form.shipping_policy || ''} onChange={(e) => setForm({ ...form, shipping_policy: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-[#3A2418] mb-1">Returns Policy</label>
            <textarea className="w-full border border-[#D7B98C] px-3 py-2 rounded" rows={3} value={form.returns_policy || ''} onChange={(e) => setForm({ ...form, returns_policy: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-[#3A2418] mb-1">Announcement Bar</label>
            <input className="w-full border border-[#D7B98C] px-3 py-2 rounded" value={form.announcement_bar || ''} onChange={(e) => setForm({ ...form, announcement_bar: e.target.value })} />
          </div>

          <button className="bg-[#B56A35] text-white px-4 py-2 rounded">Save Content</button>
          {message && <p className="text-sm text-green-700">{message}</p>}
          {error && <p className="text-sm text-red-700">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default AdminContent;
