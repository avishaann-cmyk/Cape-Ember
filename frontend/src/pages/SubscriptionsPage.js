import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Check, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from '../components/AuthModal';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SubscriptionsPage = () => {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${API}/products`);
        // API returns {products: [...]} structure
        const productsData = response.data.products || response.data;
        const productsArray = Array.isArray(productsData) ? productsData : [];
        setProducts(productsArray.filter(p => !p.is_bundle));
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const benefits = [
    'Fresh coffee delivered to your door',
    'Change, pause, or cancel anytime',
    'Free delivery on all subscription orders',
    'Be the first to try new blends',
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

  return (
    <div className="min-h-screen pt-20 md:pt-24">
      {/* Hero */}
      <section className="section-padding bg-[#F2EEE8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="overline text-[#A94826] mb-4 block">Subscribe & Save</span>
              <h1 className="font-heading text-4xl md:text-5xl text-[#2D2622] mb-6">
                Never Run Out of Great Coffee
              </h1>
              <p className="text-[#5C534C] text-lg mb-8">
                Set up a subscription and enjoy fresh, small-batch roasted coffee 
                delivered straight to your door. Customize your frequency and 
                manage your subscription anytime.
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

              <Link 
                to="#products" 
                className="btn-primary inline-flex items-center gap-2"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
                }}
                data-testid="subscribe-cta"
              >
                Choose Your Coffee
                <ArrowRight size={18} />
              </Link>
            </div>
            
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-64 h-64 bg-[#A94826]/10 absolute -top-4 -left-4" />
                <div className="relative bg-white p-8 border border-[#E5DCD0]">
                  <RefreshCw size={48} className="text-[#A94826] mb-4" />
                  <h3 className="font-heading text-2xl text-[#2D2622] mb-2">How It Works</h3>
                  <ol className="space-y-4 text-[#5C534C]">
                    <li className="flex gap-3">
                      <span className="font-semibold text-[#A94826]">1.</span>
                      Choose your favorite blend
                    </li>
                    <li className="flex gap-3">
                      <span className="font-semibold text-[#A94826]">2.</span>
                      Select delivery frequency
                    </li>
                    <li className="flex gap-3">
                      <span className="font-semibold text-[#A94826]">3.</span>
                      Enjoy fresh coffee, always
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="section-padding">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="overline text-[#A94826] mb-2 block">Choose Your Blend</span>
            <h2 className="font-heading text-4xl text-[#2D2622]">
              Available for Subscription
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="spinner w-8 h-8" />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                      From R {product.price.toFixed(2)} / delivery
                    </p>
                    
                    {isAuthenticated ? (
                      <Link
                        to={`/product/${product.id}`}
                        className="btn-primary w-full block text-center"
                        data-testid={`subscribe-${product.id}`}
                      >
                        Subscribe Now
                      </Link>
                    ) : (
                      <button
                        onClick={() => setAuthModalOpen(true)}
                        className="btn-primary w-full"
                        data-testid={`subscribe-${product.id}`}
                      >
                        Sign In to Subscribe
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
                a: 'You choose! We offer weekly, bi-weekly, and monthly delivery options. You can change your frequency anytime from your account.'
              },
              {
                q: 'Can I cancel my subscription?',
                a: 'Yes, absolutely. You can pause, skip, or cancel your subscription at any time with no penalties. We believe in keeping you because you love our coffee, not because you\'re locked in.'
              },
              {
                q: 'Is there free delivery on subscriptions?',
                a: 'Yes! All subscription orders include free delivery anywhere in South Africa.'
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

      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        initialMode="register"
      />
    </div>
  );
};

export default SubscriptionsPage;
