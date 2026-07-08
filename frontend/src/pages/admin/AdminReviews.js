import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft } from '@phosphor-icons/react';
import { useAuth } from '../../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminReviews = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    fetchReviews();
  }, [authLoading, user, navigate]);

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/admin/reviews`, { headers: { Authorization: `Bearer ${token}` } });
      setReviews(res.data.reviews || []);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load reviews');
    }
  };

  const updateReview = async (id, payload) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/admin/reviews/${id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      await fetchReviews();
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to update review');
    }
  };

  return (
    <div className="min-h-screen bg-[#F3E4CC]">
      <div className="bg-[#15110E] text-[#F3E4CC] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/admin" className="inline-flex items-center gap-2 text-[#D7B98C] hover:text-white mb-4">
            <ArrowLeft size={20} /> Back to Dashboard
          </Link>
          <h1 className="font-heading text-3xl">Review Moderation</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E6DCD1]">
            <h2 className="font-heading text-xl text-[#15110E]">All Reviews</h2>
          </div>
          {error && <p className="text-red-700 px-4 py-2">{error}</p>}
          <div className="divide-y divide-[#E6DCD1]">
            {reviews.map((r) => (
              <div key={r.id} className="p-4">
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="font-medium text-[#15110E]">{r.title} · {r.rating}/5</p>
                    <p className="text-sm text-[#6F7A52]">{r.user_name} · Product: {r.product_id}</p>
                    <p className="text-[#3A2418] mt-2">{r.content}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button className="text-xs px-3 py-1 rounded bg-green-100 text-green-700" onClick={() => updateReview(r.id, { is_approved: true })}>Approve</button>
                    <button className="text-xs px-3 py-1 rounded bg-yellow-100 text-yellow-700" onClick={() => updateReview(r.id, { is_approved: false })}>Reject</button>
                    <button className="text-xs px-3 py-1 rounded bg-blue-100 text-blue-700" onClick={() => updateReview(r.id, { is_visible: !(r.is_visible !== false) })}>{r.is_visible === false ? 'Show' : 'Hide'}</button>
                  </div>
                </div>
              </div>
            ))}
            {reviews.length === 0 && <p className="p-4 text-[#6F7A52]">No reviews found.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReviews;
