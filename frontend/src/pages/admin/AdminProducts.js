import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, PencilSimple, Archive } from '@phosphor-icons/react';
import { useAuth } from '../../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  category: 'coffee_beans',
  roast_level: 'medium',
  origin: '',
  flavor_notes: '',
  weight: '250g',
  grind_options: ['Whole Bean', 'Ground'],
  price: 149,
  sale_price: '',
  stock_quantity: 20,
  low_stock_alert: 10,
  image_url: '',
  gallery_images: [],
  is_active: true,
  is_featured: false,
  meta_title: '',
  meta_description: ''
};

const AdminProducts = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    fetchProducts();
  }, [authLoading, user, navigate]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/admin/products`, { headers: { Authorization: `Bearer ${token}` } });
      setProducts(res.data.products || []);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...form,
        slug: form.slug.trim(),
        sale_price: form.sale_price === '' ? null : Number(form.sale_price),
        price: Number(form.price),
        stock_quantity: Number(form.stock_quantity),
        low_stock_alert: Number(form.low_stock_alert),
        gallery_images: form.image_url ? [form.image_url] : []
      };

      if (editingId) {
        await axios.put(`${API}/admin/products/${editingId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${API}/admin/products`, payload, { headers: { Authorization: `Bearer ${token}` } });
      }
      await fetchProducts();
      resetForm();
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const editProduct = (p) => {
    setEditingId(p.id);
    setForm({
      ...emptyForm,
      ...p,
      sale_price: p.sale_price ?? '',
      image_url: p.image_url || ''
    });
  };

  const archiveProduct = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/admin/products/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      await fetchProducts();
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to archive product');
    }
  };

  return (
    <div className="min-h-screen bg-[#F3E4CC]">
      <div className="bg-[#15110E] text-[#F3E4CC] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/admin" className="inline-flex items-center gap-2 text-[#D7B98C] hover:text-white mb-4">
            <ArrowLeft size={20} /> Back to Dashboard
          </Link>
          <h1 className="font-heading text-3xl">Products</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-5">
          <h2 className="text-xl font-heading text-[#15110E] mb-4">{editingId ? 'Edit Product' : 'Add Product'}</h2>
          <form onSubmit={submitForm} className="space-y-3">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product name" className="w-full border border-[#D7B98C] px-3 py-2 rounded" required />
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} placeholder="Slug" className="w-full border border-[#D7B98C] px-3 py-2 rounded" required />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="w-full border border-[#D7B98C] px-3 py-2 rounded" rows={3} required />
            <input value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} placeholder="Origin / Blend" className="w-full border border-[#D7B98C] px-3 py-2 rounded" />
            <input value={form.flavor_notes} onChange={(e) => setForm({ ...form, flavor_notes: e.target.value })} placeholder="Tasting notes" className="w-full border border-[#D7B98C] px-3 py-2 rounded" />
            <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Price" className="w-full border border-[#D7B98C] px-3 py-2 rounded" />
            <input type="number" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} placeholder="Sale price (optional)" className="w-full border border-[#D7B98C] px-3 py-2 rounded" />
            <input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} placeholder="Stock quantity" className="w-full border border-[#D7B98C] px-3 py-2 rounded" />
            <input type="number" value={form.low_stock_alert} onChange={(e) => setForm({ ...form, low_stock_alert: e.target.value })} placeholder="Low-stock alert" className="w-full border border-[#D7B98C] px-3 py-2 rounded" />
            <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="Primary image URL" className="w-full border border-[#D7B98C] px-3 py-2 rounded" />
            <input value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} placeholder="SEO title" className="w-full border border-[#D7B98C] px-3 py-2 rounded" />
            <textarea value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} placeholder="SEO description" className="w-full border border-[#D7B98C] px-3 py-2 rounded" rows={2} />
            <label className="flex items-center gap-2 text-sm text-[#3A2418]">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active
            </label>
            <label className="flex items-center gap-2 text-sm text-[#3A2418]">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} /> Featured
            </label>
            <div className="flex gap-2 pt-2">
              <button disabled={saving} className="bg-[#B56A35] text-white px-4 py-2 rounded inline-flex items-center gap-2">
                <Plus size={16} /> {saving ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}
              </button>
              {editingId && <button type="button" onClick={resetForm} className="bg-[#15110E] text-white px-4 py-2 rounded">Cancel</button>}
            </div>
          </form>
          {error && <p className="text-sm text-red-700 mt-3">{error}</p>}
        </div>

        <div className="lg:col-span-3 bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E6DCD1] flex items-center justify-between">
            <h2 className="font-heading text-xl text-[#15110E]">Catalog</h2>
            <span className="text-sm text-[#6F7A52]">{products.length} products</span>
          </div>
          {loading ? <div className="p-6">Loading...</div> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F3E4CC]">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs uppercase">Product</th>
                    <th className="text-left px-4 py-2 text-xs uppercase">Price</th>
                    <th className="text-left px-4 py-2 text-xs uppercase">Stock</th>
                    <th className="text-left px-4 py-2 text-xs uppercase">Status</th>
                    <th className="text-left px-4 py-2 text-xs uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-t border-[#E6DCD1]">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#15110E]">{p.name}</p>
                        <p className="text-xs text-[#6F7A52]">{p.origin || 'No origin set'}</p>
                      </td>
                      <td className="px-4 py-3">R {Number(p.price || 0).toFixed(2)}</td>
                      <td className="px-4 py-3">{p.stock_quantity ?? 0}</td>
                      <td className="px-4 py-3">{p.is_active ? 'Active' : 'Inactive'}</td>
                      <td className="px-4 py-3 flex items-center gap-3">
                        <button onClick={() => editProduct(p)} className="text-[#B56A35] inline-flex items-center gap-1"><PencilSimple size={16} /> Edit</button>
                        <button onClick={() => archiveProduct(p.id)} className="text-red-700 inline-flex items-center gap-1"><Archive size={16} /> Archive</button>
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

export default AdminProducts;
