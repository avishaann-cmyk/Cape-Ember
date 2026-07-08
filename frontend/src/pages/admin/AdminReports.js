import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft } from '@phosphor-icons/react';
import { useAuth } from '../../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminReports = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    fetchReports();
  }, [authLoading, user, navigate]);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/admin/reports`, { headers: { Authorization: `Bearer ${token}` } });
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load reports');
    }
  };

  const money = (value) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(value || 0);

  return (
    <div className="min-h-screen bg-[#F3E4CC]">
      <div className="bg-[#15110E] text-[#F3E4CC] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/admin" className="inline-flex items-center gap-2 text-[#D7B98C] hover:text-white mb-4"><ArrowLeft size={20} /> Back to Dashboard</Link>
          <h1 className="font-heading text-3xl">Reports</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {error && <p className="text-red-700">{error}</p>}
        {data && (
          <>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm"><p className="text-sm text-[#6F7A52]">Total Sales</p><p className="text-2xl font-heading text-[#15110E]">{money(data.sales.total_sales)}</p></div>
              <div className="bg-white rounded-lg p-4 shadow-sm"><p className="text-sm text-[#6F7A52]">Total Orders</p><p className="text-2xl font-heading text-[#15110E]">{data.sales.total_orders}</p></div>
              <div className="bg-white rounded-lg p-4 shadow-sm"><p className="text-sm text-[#6F7A52]">AOV</p><p className="text-2xl font-heading text-[#15110E]">{money(data.sales.average_order_value)}</p></div>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E6DCD1]">
                <h2 className="font-heading text-xl text-[#15110E]">Sales by Product</h2>
              </div>
              <table className="w-full">
                <thead className="bg-[#F3E4CC]"><tr><th className="text-left px-4 py-2 text-xs uppercase">Product</th><th className="text-left px-4 py-2 text-xs uppercase">Units</th><th className="text-left px-4 py-2 text-xs uppercase">Revenue</th></tr></thead>
                <tbody>
                  {data.sales_by_product.map((item) => (
                    <tr key={item.product_id} className="border-t border-[#E6DCD1]"><td className="px-4 py-2">{item.product_name}</td><td className="px-4 py-2">{item.units_sold}</td><td className="px-4 py-2">{money(item.revenue)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E6DCD1]">
                <h2 className="font-heading text-xl text-[#15110E]">Low Stock Report</h2>
              </div>
              <table className="w-full">
                <thead className="bg-[#F3E4CC]"><tr><th className="text-left px-4 py-2 text-xs uppercase">Product</th><th className="text-left px-4 py-2 text-xs uppercase">Stock</th><th className="text-left px-4 py-2 text-xs uppercase">Threshold</th></tr></thead>
                <tbody>
                  {data.low_stock.map((item) => (
                    <tr key={item.product_id} className="border-t border-[#E6DCD1]"><td className="px-4 py-2">{item.product_name}</td><td className="px-4 py-2">{item.stock}</td><td className="px-4 py-2">{item.threshold}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
