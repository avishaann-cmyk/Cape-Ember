import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, MessageCircle } from 'lucide-react';
import axios from 'axios';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, refreshCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubscription, setIsSubscription] = useState(false);
  const [subscriptionFrequency, setSubscriptionFrequency] = useState('monthly');
  
  const [address, setAddress] = useState({
    street: '',
    city: '',
    province: '',
    postal_code: '',
    country: 'South Africa'
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/cart');
    }
  }, [isAuthenticated, navigate]);

  const handleAddressChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const validateAddress = () => {
    return address.street && address.city && address.province && address.postal_code;
  };

  const handleCheckout = async () => {
    if (!validateAddress()) {
      setError('Please fill in all address fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create order
      const orderRes = await axios.post(`${API}/orders`, {
        shipping_address: address,
        is_subscription: isSubscription,
        subscription_frequency: isSubscription ? subscriptionFrequency : null,
        payment_method: 'payfast'
      });

      const { order_id, whatsapp_link } = orderRes.data;

      // Store whatsapp link for after payment
      localStorage.setItem('whatsapp_link', whatsapp_link);
      localStorage.setItem('order_id', order_id);

      // Create PayFast payment
      const paymentRes = await axios.post(`${API}/payfast/create-payment`, {
        order_id
      });

      const { payfast_host, fields } = paymentRes.data;

      // Create and submit PayFast form
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `https://${payfast_host}/eng/process`;

      Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();

    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.response?.data?.detail || 'Checkout failed. Please try again.');
      setLoading(false);
    }
  };

  if (cart.items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen pt-20 md:pt-24 bg-[#FAFAF7]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button 
          onClick={() => navigate('/cart')}
          className="inline-flex items-center gap-2 text-[#5C534C] hover:text-[#A94826] mb-8 transition-colors"
          data-testid="back-to-cart"
        >
          <ArrowLeft size={18} />
          Back to Cart
        </button>

        <h1 className="font-heading text-4xl text-[#2D2622] mb-8">Checkout</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-12">
          {/* Shipping Form */}
          <div>
            <h2 className="font-heading text-2xl text-[#2D2622] mb-6">Shipping Address</h2>
            
            <div className="space-y-6">
              <div>
                <label className="overline block mb-2">Street Address</label>
                <input
                  type="text"
                  name="street"
                  value={address.street}
                  onChange={handleAddressChange}
                  className="input-field bg-[#F2EEE8] px-4"
                  placeholder="123 Main Street"
                  required
                  data-testid="address-street"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="overline block mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={address.city}
                    onChange={handleAddressChange}
                    className="input-field bg-[#F2EEE8] px-4"
                    placeholder="Cape Town"
                    required
                    data-testid="address-city"
                  />
                </div>
                <div>
                  <label className="overline block mb-2">Province</label>
                  <select
                    name="province"
                    value={address.province}
                    onChange={handleAddressChange}
                    className="input-field bg-[#F2EEE8] px-4"
                    required
                    data-testid="address-province"
                  >
                    <option value="">Select Province</option>
                    <option value="Western Cape">Western Cape</option>
                    <option value="Gauteng">Gauteng</option>
                    <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                    <option value="Eastern Cape">Eastern Cape</option>
                    <option value="Free State">Free State</option>
                    <option value="Limpopo">Limpopo</option>
                    <option value="Mpumalanga">Mpumalanga</option>
                    <option value="North West">North West</option>
                    <option value="Northern Cape">Northern Cape</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="overline block mb-2">Postal Code</label>
                <input
                  type="text"
                  name="postal_code"
                  value={address.postal_code}
                  onChange={handleAddressChange}
                  className="input-field bg-[#F2EEE8] px-4"
                  placeholder="8001"
                  required
                  data-testid="address-postal"
                />
              </div>
            </div>

            {/* Subscription Option */}
            <div className="mt-8 p-6 bg-[#F2EEE8] border border-[#E5DCD0]">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSubscription}
                  onChange={(e) => setIsSubscription(e.target.checked)}
                  className="mt-1 w-5 h-5 accent-[#A94826]"
                  data-testid="subscription-checkbox"
                />
                <div>
                  <span className="font-semibold text-[#2D2622]">Subscribe & Save</span>
                  <p className="text-sm text-[#5C534C] mt-1">
                    Get fresh coffee delivered automatically. Cancel anytime.
                  </p>
                </div>
              </label>

              {isSubscription && (
                <div className="mt-4 pl-8">
                  <label className="overline block mb-2">Delivery Frequency</label>
                  <select
                    value={subscriptionFrequency}
                    onChange={(e) => setSubscriptionFrequency(e.target.value)}
                    className="input-field bg-white px-4"
                    data-testid="subscription-frequency"
                  >
                    <option value="weekly">Every Week</option>
                    <option value="biweekly">Every 2 Weeks</option>
                    <option value="monthly">Every Month</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-[#F2EEE8] border border-[#E5DCD0] p-6 sticky top-24">
              <h2 className="font-heading text-2xl text-[#2D2622] mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                {cart.items.map((item) => (
                  <div key={item.product_id} className="flex justify-between text-[#5C534C]">
                    <span>{item.product_name} × {item.quantity}</span>
                    <span>R {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                
                <div className="border-t border-[#E5DCD0] pt-4">
                  <div className="flex justify-between text-[#5C534C]">
                    <span>Subtotal</span>
                    <span>R {cart.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#5C534C] mt-2">
                    <span>Shipping</span>
                    <span>{cart.shipping === 0 ? 'Free' : `R ${cart.shipping.toFixed(2)}`}</span>
                  </div>
                </div>

                <div className="border-t border-[#E5DCD0] pt-4 flex justify-between font-semibold text-xl text-[#2D2622]">
                  <span>Total</span>
                  <span>R {cart.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method - PayFast Only (Stitch coming soon) */}
              <div className="mb-6">
                <h3 className="font-heading text-lg text-[#2D2622] mb-4">Payment Method</h3>
                <div className="p-4 border border-[#A94826] bg-[#A94826]/5">
                  <div className="flex items-center gap-3">
                    <CreditCard size={20} className="text-[#2D2622]" />
                    <div className="flex-1">
                      <span className="font-medium text-[#2D2622]">PayFast</span>
                      <p className="text-xs text-[#5C534C]">Credit/Debit Card, EFT, Instant EFT</p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
                data-testid="pay-now-btn"
              >
                {loading ? (
                  <span className="spinner border-white border-t-transparent" />
                ) : (
                  <>
                    <CreditCard size={20} />
                    Pay with PayFast
                  </>
                )}
              </button>

              <p className="text-center text-xs text-[#5C534C] mt-4">
                Secure payment via PayFast. We accept credit cards, debit cards, and EFT.
              </p>

              <div className="mt-6 pt-6 border-t border-[#E5DCD0]">
                <a
                  href="https://wa.me/27810261618"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-[#5C534C] hover:text-[#25D366] transition-colors"
                  data-testid="checkout-whatsapp"
                >
                  <MessageCircle size={20} />
                  Need help? Chat with us
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
