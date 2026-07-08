import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, DownloadSimple } from '@phosphor-icons/react';
import { useAuth } from '../../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminSubscribers = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [subscribers, setSubscribers] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchSubscribers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/admin/newsletter`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { search: search || undefined, limit: 200 }
      });
      setSubscribers(res.data.subscribers || []);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load subscribers');
    }
  }, [search]);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    fetchSubscribers();
  }, [authLoading, user, navigate, fetchSubscribers]);

  const toggleSubscriber = async (subscriber) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/admin/newsletter/${subscriber.id}`,
        { is_active: !subscriber.is_active },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchSubscribers();
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to update subscriber');
    }
  };

  const exportCsv = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/admin/newsletter/export`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'text'
      });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cape-ember-newsletter-subscribers.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError('Failed to export subscribers');
    }
  };

  return (
    <div className="min-h-screen bg-[#F3E4CC]">
      <div className="bg-[#15110E] text-[#F3E4CC] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/admin" className="inline-flex items-center gap-2 text-[#D7B98C] hover:text-white mb-4">
            <ArrowLeft size={20} /> Back to Dashboard
          </Link>
          <div className="flex items-center justify-between gap-4">
            <h1 className="font-heading text-3xl">Newsletter Subscribers</h1>
            <button onClick={exportCsv} className="inline-flex items-center gap-2 bg-[#B56A35] text-white px-4 py-2 rounded">
              <DownloadSimple size={18} /> Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <div className="bg-white rounded-lg shadow-sm p-4 flex gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email, name, source"
            className="flex-1 border border-[#D7B98C] px-3 py-2 rounded"
          />
          <button onClick={fetchSubscribers} className="bg-[#15110E] text-white px-4 py-2 rounded">Search</button>
        </div>

        {error && <p className="text-red-700">{error}</p>}

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#F3E4CC]">
              <tr>
                <th className="text-left px-4 py-3 text-xs uppercase">Email</th>
                <th className="text-left px-4 py-3 text-xs uppercase">Name</th>
                <th className="text-left px-4 py-3 text-xs uppercase">Source</th>
                <th className="text-left px-4 py-3 text-xs uppercase">Consent</th>
                <th className="text-left px-4 py-3 text-xs uppercase">Subscribed</th>
                <th className="text-left px-4 py-3 text-xs uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr key={s.id} className="border-t border-[#E6DCD1]">
                  <td className="px-4 py-3">{s.email}</td>
                  <td className="px-4 py-3">{s.first_name || '-'}</td>
                  <td className="px-4 py-3">{s.source || '-'}</td>
                  <td className="px-4 py-3">{s.marketing_consent ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3">{s.subscribed_at?.slice(0, 10) || '-'}</td>
                  <td className="px-4 py-3">{s.is_active ? 'Subscribed' : 'Unsubscribed'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleSubscriber(s)}
                      className="text-xs px-3 py-1 rounded bg-[#15110E] text-white"
                    >
                      {s.is_active ? 'Unsubscribe' : 'Resubscribe'}
                    </button>
                  </td>
                </tr>
              ))}
              {subscribers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[#6F7A52]">No subscribers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSubscribers;
