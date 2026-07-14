import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { setPageSEO } from '../lib/seo';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SubscriptionsPage = () => {
  const { isAuthenticated, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const plans = [
    {
      name: 'Monthly Starter',
      summary: '1 x 250g bag monthly',
      detail: 'Good for light coffee drinkers and solo households.'
    },
    {
      name: 'Monthly Duo',
      summary: '2 x 250g bags monthly',
      detail: 'Best value for couples or daily coffee drinkers.'
    },
    {
      name: 'Explorer Subscription',
      summary: 'Rotating Cape Ember blend monthly',
      detail: 'Discover a new landscape-inspired coffee every cycle.'
    }
  ];

  const [form, setForm] = useState({
    plan_name: 'Monthly Starter',
    blend: 'Fynbos Roast',
    grind: 'whole_bean',
    frequency: 'monthly',
    quantity: 1,
    customer_name: '',
    customer_email: '',
    preferred_delivery_day: '',
    delivery_notes: '',
    delivery_address: {
      first_name: '',
      last_name: '',
      street: '',
      apartment: '',
      city: '',
      province: 'Western Cape',
      postal_code: '',
      country: 'South Africa',
      phone: ''
    }
  });

  useEffect(() => {
    setPageSEO({
      title: 'Ember Circle Subscriptions | Cape Ember Coffee Co.',
      description: 'Never run out of coffee. Join Ember Circle with flexible delivery for your favourite Cape Ember blends.',
      canonicalPath: '/subscriptions',
      image: '/assets/cape-ember/cape-ember-ember-reserve-lifestyle.jpeg'
    });

    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${API}/products`);
        const productsData = response.data.products || response.data;
        const productsArray = Array.isArray(productsData) ? productsData : [];
        const coreIds = ['fynbos-roast', 'garden-route', 'karoo-horizon', 'ember-reserve'];
        setProducts(productsArray.filter((p) => coreIds.includes(p.id)));
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    setForm((prev) => ({
      ...prev,
      customer_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      customer_email: user.email || '',
      delivery_address: {
        ...prev.delivery_address,
        first_name: user.first_name || '',
        last_name: user.last_name || ''
      }
    }));
  }, [isAuthenticated, user]);

  const benefits = [
    'Fresh coffee delivered to your door',
    'Change, pause, or cancel anytime',
    'Complimentary delivery on all subscription orders',
    'Be the first to try new blends and limited releases',
  ];

  // Helper to get image URL from product (supports both old and new format)
  const getImageUrl = (product) => {
    if (!product) return '/placeholder-coffee.jpg';
    if (product.image_url) return product.image_url;
    if (product.images && product.images.length > 0) {
      const primary = product.images.find(img => img.is_primary);
      return primary?.url || product.images[0]?.url || '/placeholder-coffee.jpg';
    }
    return '/placeholder-coffee.jpg';
  };

  const handleAddress = (key, value) => {
    setForm((prev) => ({
      ...prev,
      delivery_address: {
        ...prev.delivery_address,
        [key]: value
      }
    }));
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSending(true);
    try {
      await axios.post(`${API}/subscriptions/request`, form);
      setMessage('Subscription request sent. We will confirm your Ember Circle plan shortly.');
      setForm((prev) => ({
        ...prev,
        delivery_notes: '',
        preferred_delivery_day: ''
      }));
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again or WhatsApp us.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 md:pt-24">
      {/* Hero */}
      <section className="section-padding bg-[#F2EEE8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="overline text-[#A94826] mb-4 block">The Ember Circle</span>
              <h1 className="font-heading text-4xl md:text-5xl text-[#2D2622] mb-6">
                Never Run Out of Coffee
              </h1>
              <p className="text-[#5C534C] text-lg mb-8">
                Join the Ember Circle and receive your favourite Cape Ember coffee on a schedule that suits your home.
              </p>
              
              <ul className="space-y-3 mb-8">
                {benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-[#5C534C]">
                    <div className="w-6 h-6 flex items-center justify-center bg-[#388E3C]/10 text-[#388E3C]">
                      <Check size={14} />
                    </div>
                    {benefit}
                  </li>
                ))}
              </ul>

              <button
                className="btn-primary"
                onClick={() => document.getElementById('ember-circle-form')?.scrollIntoView({ behavior: 'smooth' })}
                data-testid="subscribe-cta"
              >
                Start Ember Circle Request
              </button>
            </div>
            
            <div className="flex justify-center">
              <div className="bg-white border border-[#E5DCD0] p-8 max-w-md">
                <h3 className="font-heading text-2xl text-[#2D2622] mb-3">Manual Subscription Model</h3>
                <p className="text-[#5C534C] text-sm leading-relaxed">
                  Automatic recurring billing is not yet enabled. We currently run Ember Circle as a premium manual subscription request system:
                </p>
                <ol className="mt-4 space-y-2 text-sm text-[#5C534C] list-decimal list-inside">
                  <li>You submit your preferred plan and coffee details.</li>
                  <li>Our team confirms availability and delivery rhythm.</li>
                  <li>We activate your recurring fulfilment schedule.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding" id="products">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="overline text-[#A94826] mb-2 block">Subscription Plans</span>
            <h2 className="font-heading text-4xl text-[#2D2622]">
              Choose Your Ember Circle Plan
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {plans.map((plan) => (
              <button
                key={plan.name}
                onClick={() => setForm((prev) => ({ ...prev, plan_name: plan.name }))}
                className={`text-left p-6 border transition-colors ${form.plan_name === plan.name ? 'border-[#B56A35] bg-[#FFF7EE]' : 'border-[#E5DCD0] bg-white'}`}
              >
                <h3 className="font-heading text-2xl text-[#2D2622] mb-2">{plan.name}</h3>
                <p className="text-[#A94826] font-medium mb-2">{plan.summary}</p>
                <p className="text-sm text-[#5C534C]">{plan.detail}</p>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="spinner w-8 h-8" />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {products.map((product) => (
                <div 
                  key={product.id} 
                  className="bg-[#F2EEE8] border border-[#E5DCD0] overflow-hidden"
                  data-testid={`sub-product-${product.id}`}
                >
                  <div className="aspect-square">
                    <img
                      src={getImageUrl(product)}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-heading text-xl text-[#2D2622] mb-1">{product.name}</h3>
                    <p className="text-[#5C534C] text-sm mb-3">{product.flavor_notes}</p>
                    <p className="font-semibold text-[#A94826] mb-4">
                      R {product.price.toFixed(2)} / 250g
                    </p>
                    <button
                      onClick={() => setForm((prev) => ({ ...prev, blend: product.name }))}
                      className="btn-primary w-full"
                      data-testid={`subscribe-${product.id}`}
                    >
                      Select This Blend
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div id="ember-circle-form" className="bg-white border border-[#E5DCD0] p-6 md:p-8">
            <h3 className="font-heading text-3xl text-[#2D2622] mb-6">Subscription Request</h3>
            <form onSubmit={submitRequest} className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[#5C534C] mb-1 block">Plan</label>
                <select className="w-full border border-[#D7B98C] px-3 py-2" value={form.plan_name} onChange={(e) => setForm({ ...form, plan_name: e.target.value })}>
                  {plans.map((plan) => <option key={plan.name} value={plan.name}>{plan.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-[#5C534C] mb-1 block">Blend</label>
                <select className="w-full border border-[#D7B98C] px-3 py-2" value={form.blend} onChange={(e) => setForm({ ...form, blend: e.target.value })}>
                  {products.map((product) => <option key={product.id} value={product.name}>{product.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-[#5C534C] mb-1 block">Grind</label>
                <select className="w-full border border-[#D7B98C] px-3 py-2" value={form.grind} onChange={(e) => setForm({ ...form, grind: e.target.value })}>
                  <option value="whole_bean">Whole Bean</option>
                  <option value="medium">Ground</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-[#5C534C] mb-1 block">Frequency</label>
                <select className="w-full border border-[#D7B98C] px-3 py-2" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
                  <option value="monthly">Monthly</option>
                  <option value="every_2_weeks">Every 2 Weeks</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-[#5C534C] mb-1 block">Quantity</label>
                <input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value || 1) })} className="w-full border border-[#D7B98C] px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-[#5C534C] mb-1 block">Preferred Delivery Day</label>
                <input value={form.preferred_delivery_day} onChange={(e) => setForm({ ...form, preferred_delivery_day: e.target.value })} className="w-full border border-[#D7B98C] px-3 py-2" placeholder="e.g. Friday" />
              </div>

              {!isAuthenticated && (
                <>
                  <div>
                    <label className="text-sm text-[#5C534C] mb-1 block">Customer Name</label>
                    <input required value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className="w-full border border-[#D7B98C] px-3 py-2" />
                  </div>
                  <div>
                    <label className="text-sm text-[#5C534C] mb-1 block">Customer Email</label>
                    <input type="email" required value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} className="w-full border border-[#D7B98C] px-3 py-2" />
                  </div>
                </>
              )}

              <div>
                <label className="text-sm text-[#5C534C] mb-1 block">First Name</label>
                <input required value={form.delivery_address.first_name} onChange={(e) => handleAddress('first_name', e.target.value)} className="w-full border border-[#D7B98C] px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-[#5C534C] mb-1 block">Last Name</label>
                <input required value={form.delivery_address.last_name} onChange={(e) => handleAddress('last_name', e.target.value)} className="w-full border border-[#D7B98C] px-3 py-2" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-[#5C534C] mb-1 block">Street Address</label>
                <input required value={form.delivery_address.street} onChange={(e) => handleAddress('street', e.target.value)} className="w-full border border-[#D7B98C] px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-[#5C534C] mb-1 block">City</label>
                <input required value={form.delivery_address.city} onChange={(e) => handleAddress('city', e.target.value)} className="w-full border border-[#D7B98C] px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-[#5C534C] mb-1 block">Province</label>
                <input required value={form.delivery_address.province} onChange={(e) => handleAddress('province', e.target.value)} className="w-full border border-[#D7B98C] px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-[#5C534C] mb-1 block">Postal Code</label>
                <input required value={form.delivery_address.postal_code} onChange={(e) => handleAddress('postal_code', e.target.value)} className="w-full border border-[#D7B98C] px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-[#5C534C] mb-1 block">Phone</label>
                <input value={form.delivery_address.phone} onChange={(e) => handleAddress('phone', e.target.value)} className="w-full border border-[#D7B98C] px-3 py-2" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-[#5C534C] mb-1 block">Delivery Notes</label>
                <textarea value={form.delivery_notes} onChange={(e) => setForm({ ...form, delivery_notes: e.target.value })} rows={3} className="w-full border border-[#D7B98C] px-3 py-2" placeholder="Gate code, delivery notes, or preferred time window" />
              </div>
              <div className="md:col-span-2 flex flex-col gap-2">
                <button type="submit" disabled={sending} className="btn-primary disabled:opacity-60">
                  {sending ? 'Submitting...' : 'Submit Subscription Request'}
                </button>
                {message && <p className="text-[#2F855A] text-sm">{message}</p>}
                {error && <p className="text-[#C53030] text-sm">{error}</p>}
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-[#2D2622]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="overline text-[#A94826] mb-2 block">FAQ</span>
            <h2 className="font-heading text-4xl text-white">
              Subscription Questions
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                q: 'How often will I receive my coffee?',
                a: 'You choose! We offer weekly, fortnightly, and monthly delivery options. You can change your frequency anytime from your account.'
              },
              {
                q: 'Can I cancel my subscription?',
                a: 'Yes, absolutely. You can pause, skip, or cancel your subscription at any time with no penalties. We believe in keeping you because you love our coffee, not because you\'re locked in.'
              },
              {
                q: 'Is there complimentary delivery on subscriptions?',
                a: 'Yes! All subscription orders include complimentary delivery anywhere in South Africa.'
              },
              {
                q: 'Can I change my blend?',
                a: 'Of course! You can switch to a different blend at any time through your account dashboard.'
              },
            ].map((faq, idx) => (
              <div key={idx} className="border-b border-white/10 pb-6">
                <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
                <p className="text-white/70">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default SubscriptionsPage;
