import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft } from '@phosphor-icons/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminTraffic = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [rangeDays, setRangeDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    fetchTraffic(30);
  }, [authLoading, user, navigate]);

  const fetchTraffic = async (days) => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/admin/traffic`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { range_days: days }
      });
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load traffic insights');
    }
  };

  const fmtNumber = (value) => new Intl.NumberFormat('en-ZA').format(value || 0);

  return (
    <div className="min-h-screen bg-[#F3E4CC]">
      <div className="bg-[#15110E] text-[#F3E4CC] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/admin" className="inline-flex items-center gap-2 text-[#D7B98C] hover:text-white mb-4"><ArrowLeft size={20} /> Back to Dashboard</Link>
          <div className="flex items-center justify-between gap-4">
            <h1 className="font-heading text-3xl">Traffic Insights</h1>
            <select
              value={rangeDays}
              onChange={(e) => {
                const days = Number(e.target.value);
                setRangeDays(days);
                fetchTraffic(days);
              }}
              className="bg-white text-[#15110E] border border-[#D7B98C] rounded px-3 py-2"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {error && <p className="text-red-700">{error}</p>}

        {data && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm"><p className="text-sm text-[#6F7A52]">Page Views</p><p className="text-2xl font-heading text-[#15110E]">{fmtNumber(data.overview.page_views)}</p></div>
              <div className="bg-white rounded-lg p-4 shadow-sm"><p className="text-sm text-[#6F7A52]">Unique Visitors</p><p className="text-2xl font-heading text-[#15110E]">{fmtNumber(data.overview.unique_visitors)}</p></div>
              <div className="bg-white rounded-lg p-4 shadow-sm"><p className="text-sm text-[#6F7A52]">Sessions</p><p className="text-2xl font-heading text-[#15110E]">{fmtNumber(data.overview.sessions)}</p></div>
              <div className="bg-white rounded-lg p-4 shadow-sm"><p className="text-sm text-[#6F7A52]">Purchase Conversion</p><p className="text-2xl font-heading text-[#15110E]">{data.overview.purchase_conversion_rate || 0}%</p></div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="font-heading text-xl text-[#15110E] mb-3">Daily Traffic</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.daily}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="page_views" stroke="#B56A35" strokeWidth={2} name="Page Views" />
                    <Line type="monotone" dataKey="unique_visitors" stroke="#3A2418" strokeWidth={2} name="Unique Visitors" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h2 className="font-heading text-xl text-[#15110E] mb-3">Top Pages</h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.top_pages.slice(0, 8)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="path" width={160} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="views" fill="#B56A35" name="Views" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4">
                <h2 className="font-heading text-xl text-[#15110E] mb-3">Top Referrers</h2>
                <ul className="space-y-2 text-sm">
                  {(data.top_referrers || []).slice(0, 10).map((item) => (
                    <li key={item.referrer} className="flex items-center justify-between border-b border-[#E6DCD1] pb-2">
                      <span className="truncate max-w-[75%]">{item.referrer || 'direct'}</span>
                      <span className="font-medium">{fmtNumber(item.visits)}</span>
                    </li>
                  ))}
                  {(!data.top_referrers || data.top_referrers.length === 0) && (
                    <li className="text-[#6F7A52]">No referrer data yet.</li>
                  )}
                </ul>

                <h2 className="font-heading text-xl text-[#15110E] mt-6 mb-3">Top Sources</h2>
                <ul className="space-y-2 text-sm">
                  {(data.top_sources || []).slice(0, 10).map((item) => (
                    <li key={item.source} className="flex items-center justify-between border-b border-[#E6DCD1] pb-2">
                      <span className="truncate max-w-[75%]">{item.source || 'direct'}</span>
                      <span className="font-medium">{fmtNumber(item.visits)}</span>
                    </li>
                  ))}
                  {(!data.top_sources || data.top_sources.length === 0) && (
                    <li className="text-[#6F7A52]">No source data yet.</li>
                  )}
                </ul>

                <h2 className="font-heading text-xl text-[#15110E] mt-6 mb-3">Top Channels</h2>
                <ul className="space-y-2 text-sm">
                  {(data.top_channels || []).slice(0, 10).map((item) => (
                    <li key={item.channel} className="flex items-center justify-between border-b border-[#E6DCD1] pb-2">
                      <span className="truncate max-w-[75%]">{item.channel}</span>
                      <span className="font-medium">{fmtNumber(item.visits)}</span>
                    </li>
                  ))}
                  {(!data.top_channels || data.top_channels.length === 0) && (
                    <li className="text-[#6F7A52]">No channel data yet.</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E6DCD1]">
                <h2 className="font-heading text-xl text-[#15110E]">Top Campaigns</h2>
              </div>
              <table className="w-full">
                <thead className="bg-[#F3E4CC]">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs uppercase">Source</th>
                    <th className="text-left px-4 py-2 text-xs uppercase">Medium</th>
                    <th className="text-left px-4 py-2 text-xs uppercase">Channel</th>
                    <th className="text-left px-4 py-2 text-xs uppercase">Campaign</th>
                    <th className="text-left px-4 py-2 text-xs uppercase">Visits</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.top_campaigns || []).slice(0, 10).map((item) => (
                    <tr key={`${item.source}-${item.medium}-${item.campaign}`} className="border-t border-[#E6DCD1]">
                      <td className="px-4 py-2">{item.source}</td>
                      <td className="px-4 py-2">{item.medium}</td>
                      <td className="px-4 py-2">{item.channel || 'Other'}</td>
                      <td className="px-4 py-2">{item.campaign}</td>
                      <td className="px-4 py-2 font-medium">{fmtNumber(item.visits)}</td>
                    </tr>
                  ))}
                  {(!data.top_campaigns || data.top_campaigns.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-[#6F7A52]">No campaign attribution data yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminTraffic;
