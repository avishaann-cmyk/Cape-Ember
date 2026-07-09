import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Warning, CheckCircle, ArrowSquareOut } from '@phosphor-icons/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList, Cell } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const RATING_STYLES = {
  good: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', label: 'Good' },
  'needs-improvement': { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500', label: 'Needs work' },
  poor: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', label: 'Poor' },
  'no data': { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-300', label: 'No data' }
};

const FUNNEL_COLOURS = ['#B56A35', '#D05C23', '#8B4513', '#5C2E00'];

const SEO_CHECKLIST = [
  { key: 'title', label: 'Page title set', test: () => document.title && document.title.length > 5 },
  { key: 'desc', label: 'Meta description present', test: () => !!document.querySelector('meta[name="description"]')?.content },
  { key: 'og', label: 'Open Graph tags', test: () => !!document.querySelector('meta[property="og:title"]') },
  { key: 'twitter', label: 'Twitter card tags', test: () => !!document.querySelector('meta[property="twitter:card"]') },
  { key: 'canonical', label: 'Canonical URL', test: () => !!document.querySelector('link[rel="canonical"]') },
  { key: 'manifest', label: 'Web app manifest', test: () => !!document.querySelector('link[rel="manifest"]') },
  { key: 'favicon_svg', label: 'SVG favicon', test: () => !!document.querySelector('link[rel="icon"][type="image/svg+xml"]') },
  { key: 'schema', label: 'JSON-LD schema', test: () => !!document.querySelector('script[type="application/ld+json"]') }
];

const VitalCard = ({ label, value, unit, rating, description }) => {
  const style = RATING_STYLES[rating] || RATING_STYLES['no data'];
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-[#6F7A52] font-medium">{label}</p>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
          <span className={`w-2 h-2 rounded-full ${style.dot}`} />
          {style.label}
        </span>
      </div>
      <p className="text-2xl font-heading text-[#15110E]">
        {value > 0 ? `${value.toLocaleString()}${unit}` : '—'}
      </p>
      <p className="text-xs text-[#6F7A52] mt-1">{description}</p>
    </div>
  );
};

const AdminPerformance = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [rangeDays, setRangeDays] = useState(30);
  const [data, setData] = useState(null);
  const [seoChecks, setSeoChecks] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user?.is_admin) { navigate('/'); return; }
    fetchData(30);
    runSeoChecks();
  }, [authLoading, user, navigate]);

  const fetchData = async (days) => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/admin/traffic`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { range_days: days }
      });
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load performance data');
    }
  };

  const runSeoChecks = () => {
    const results = SEO_CHECKLIST.map(item => {
      let pass = false;
      try { pass = item.test(); } catch (e) {}
      return { ...item, pass };
    });
    setSeoChecks(results);
  };

  const fmtNumber = (v) => new Intl.NumberFormat('en-ZA').format(v || 0);

  const vitals = data?.web_vitals || {};
  const funnel = data?.funnel || {};

  const funnelData = [
    { name: 'Page Views', value: funnel.page_views || 0 },
    { name: 'Add to Cart', value: funnel.add_to_cart || 0 },
    { name: 'Checkout', value: funnel.begin_checkout || 0 },
    { name: 'Purchase', value: funnel.purchase || 0 }
  ];

  const conversionData = [
    { step: 'View→Cart', rate: funnel.add_to_cart_rate || 0 },
    { step: 'Cart→Checkout', rate: funnel.checkout_rate || 0 },
    { step: 'Checkout→Buy', rate: funnel.purchase_rate || 0 }
  ];

  const seoScore = seoChecks.length > 0
    ? Math.round((seoChecks.filter(c => c.pass).length / seoChecks.length) * 100)
    : null;

  return (
    <div className="min-h-screen bg-[#F3E4CC]">
      <div className="bg-[#15110E] text-[#F3E4CC] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/admin" className="inline-flex items-center gap-2 text-[#D7B98C] hover:text-white mb-4">
            <ArrowLeft size={20} /> Back to Dashboard
          </Link>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-heading text-3xl">Site Performance</h1>
              <p className="text-[#D7B98C] text-sm mt-1">Web Vitals · SEO health · Conversion funnel</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={rangeDays}
                onChange={(e) => { const d = Number(e.target.value); setRangeDays(d); fetchData(d); }}
                className="bg-white text-[#15110E] border border-[#D7B98C] rounded px-3 py-2 text-sm"
              >
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
                <option value={60}>Last 60 days</option>
              </select>
              <Link
                to="/admin/traffic"
                className="inline-flex items-center gap-1 text-sm text-[#D7B98C] hover:text-white"
              >
                Full Traffic Insights <ArrowSquareOut size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {error && <p className="text-red-700">{error}</p>}

        {/* ---- Core Web Vitals ---- */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl text-[#15110E]">Core Web Vitals (p75)</h2>
            {vitals.sample_count > 0 && (
              <span className="text-xs text-[#6F7A52]">{vitals.sample_count} real-user samples</span>
            )}
          </div>

          {vitals.sample_count === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3 mb-4">
              <Warning size={20} className="text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-800">
                No web vitals data yet. Metrics will appear once real visitors browse the site. Data is captured automatically from every page load.
              </p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <VitalCard
              label="LCP — Largest Contentful Paint"
              value={vitals.lcp_ms_p75 || 0}
              unit="ms"
              rating={vitals.lcp_rating || 'no data'}
              description="Target ≤ 2,500 ms. How fast your main content loads."
            />
            <VitalCard
              label="FCP — First Contentful Paint"
              value={vitals.fcp_ms_p75 || 0}
              unit="ms"
              rating={vitals.fcp_rating || 'no data'}
              description="Target ≤ 1,800 ms. When first text/image appears."
            />
            <VitalCard
              label="CLS — Cumulative Layout Shift"
              value={vitals.cls_avg || 0}
              unit=""
              rating={vitals.cls_rating || 'no data'}
              description="Target ≤ 0.10. Visual stability of the page."
            />
            <VitalCard
              label="TTFB — Time to First Byte"
              value={vitals.ttfb_ms_p75 || 0}
              unit="ms"
              rating={vitals.ttfb_rating || 'no data'}
              description="Target ≤ 800 ms. Server response speed."
            />
          </div>

          <div className="mt-3 p-3 bg-white rounded-lg text-xs text-[#6F7A52] border border-[#E6DCD1]">
            Google uses LCP, FCP and CLS as ranking signals (Core Web Vitals). Aim for all three in the <strong>Good</strong> range to maximise search ranking. Improve by optimising images, reducing unused JavaScript and using efficient cache policies.
          </div>
        </section>

        {/* ---- SEO Checklist ---- */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl text-[#15110E]">SEO Health Check</h2>
            {seoScore !== null && (
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                seoScore >= 90 ? 'bg-green-100 text-green-700' :
                seoScore >= 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
              }`}>
                {seoScore}% ({seoChecks.filter(c => c.pass).length}/{seoChecks.length} passing)
              </span>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {seoChecks.map((check, i) => (
              <div key={check.key} className={`flex items-center gap-3 px-4 py-3 ${i < seoChecks.length - 1 ? 'border-b border-[#E6DCD1]' : ''}`}>
                {check.pass
                  ? <CheckCircle size={20} weight="fill" className="text-green-500 flex-shrink-0" />
                  : <Warning size={20} weight="fill" className="text-yellow-500 flex-shrink-0" />}
                <span className={`text-sm ${check.pass ? 'text-[#2C1A12]' : 'text-yellow-700 font-medium'}`}>{check.label}</span>
                {!check.pass && <span className="ml-auto text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Fix needed</span>}
              </div>
            ))}
          </div>

          <div className="mt-3 p-3 bg-white rounded-lg text-xs text-[#6F7A52] border border-[#E6DCD1]">
            To connect Google Search Console: go to <strong>
              <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-[#D05C23] underline">search.google.com/search-console</a>
            </strong>, add <code>capeembercoffee.co.za</code>, choose the HTML tag method, copy the verification content value, and set <code>REACT_APP_GOOGLE_SITE_VERIFICATION</code> in your production environment. Rebuild and redeploy to activate.
          </div>
        </section>

        {/* ---- Conversion Funnel ---- */}
        <section>
          <h2 className="font-heading text-xl text-[#15110E] mb-4">Conversion Funnel ({rangeDays} days)</h2>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-medium text-[#15110E] mb-3 text-sm">Funnel Drop-off</h3>
              <div className="space-y-3">
                {funnelData.map((step, i) => {
                  const pct = funnelData[0].value > 0
                    ? Math.round((step.value / funnelData[0].value) * 100)
                    : 0;
                  return (
                    <div key={step.name}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-[#2C1A12] font-medium">{step.name}</span>
                        <span className="text-[#6F7A52]">{fmtNumber(step.value)} ({pct}%)</span>
                      </div>
                      <div className="h-3 bg-[#F3E4CC] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: FUNNEL_COLOURS[i] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-medium text-[#15110E] mb-3 text-sm">Step Conversion Rates</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={conversionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="step" tick={{ fontSize: 11 }} />
                    <YAxis unit="%" tick={{ fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Bar dataKey="rate" fill="#D05C23" name="Conversion %" radius={[4, 4, 0, 0]}>
                      {conversionData.map((_, idx) => (
                        <Cell key={idx} fill={FUNNEL_COLOURS[idx % FUNNEL_COLOURS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        {/* ---- Google Tools Quick Links ---- */}
        <section>
          <h2 className="font-heading text-xl text-[#15110E] mb-4">Google Tools</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: 'Search Console',
                desc: 'Monitor search rankings, indexing errors and click-through rates.',
                url: 'https://search.google.com/search-console'
              },
              {
                title: 'PageSpeed Insights',
                desc: 'Get a lab-based Lighthouse score for your homepage and product pages.',
                url: 'https://pagespeed.web.dev/analysis?url=https://capeembercoffee.co.za'
              },
              {
                title: 'Rich Results Test',
                desc: 'Verify that Google can parse your product and business schema markup.',
                url: 'https://search.google.com/test/rich-results?url=https://capeembercoffee.co.za'
              },
              {
                title: 'Mobile Friendly Test',
                desc: 'Confirm the site passes Google\'s mobile-usability requirements.',
                url: 'https://search.google.com/test/mobile-friendly?url=https://capeembercoffee.co.za'
              }
            ].map(tool => (
              <a
                key={tool.title}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-transparent hover:border-[#D05C23] group"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-[#15110E] text-sm group-hover:text-[#D05C23] transition-colors">{tool.title}</h3>
                  <ArrowSquareOut size={14} className="text-[#6F7A52] flex-shrink-0 mt-0.5" />
                </div>
                <p className="text-xs text-[#6F7A52]">{tool.desc}</p>
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminPerformance;
