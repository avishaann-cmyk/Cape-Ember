import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Mail, MapPin, Phone } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_axis-creator/artifacts/se338umo_Cape%20Ember%20Coffee%20Co%20Logo.jpeg";

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    try {
      await axios.post(`${API}/newsletter/subscribe?email=${encodeURIComponent(email)}`);
      setSubscribed(true);
      setEmail('');
    } catch (error) {
      console.error('Newsletter subscription failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-[#2D2622] text-white">
      {/* Newsletter Section */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-xl mx-auto text-center">
            <span className="overline text-[#A94826]">Join the Ember Circle</span>
            <h3 className="font-heading text-3xl mt-2 mb-4">Stay Close to New Roasts</h3>
            <p className="text-white/70 mb-8">
              Be the first to hear about new blends, limited releases and refined coffee updates.
            </p>
            
            {subscribed ? (
              <p className="text-[#A94826] font-medium">Thank you for subscribing!</p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-[#A94826]"
                  required
                  data-testid="newsletter-email"
                />
                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-primary"
                  data-testid="newsletter-submit"
                >
                  {loading ? <span className="spinner border-white border-t-transparent" /> : 'Subscribe'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <img 
              src={LOGO_URL} 
              alt="Cape Ember Coffee Co." 
              className="h-16 w-auto mb-4"
            />
            <p className="text-white/70 mb-6 max-w-md">
              Premium small-batch coffee inspired by the beautiful landscapes of South Africa. 
              Experience the Cape in every cup.
            </p>
            <a 
              href="https://wa.me/27810261618"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 whatsapp-btn px-4 py-2 font-medium transition-colors"
              data-testid="footer-whatsapp"
            >
              <MessageCircle size={20} />
              Chat with us
            </a>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="overline text-white mb-4">Quick Links</h5>
            <ul className="space-y-3">
              <li>
                <Link to="/shop" className="text-white/70 hover:text-[#A94826] transition-colors">
                  Shop All
                </Link>
              </li>
              <li>
                <Link to="/subscriptions" className="text-white/70 hover:text-[#A94826] transition-colors">
                  Subscriptions
                </Link>
              </li>
              <li>
                <Link to="/brew-guide" className="text-white/70 hover:text-[#A94826] transition-colors">
                  Brew Guide
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-white/70 hover:text-[#A94826] transition-colors">
                  Our Story
                </Link>
              </li>
              <li>
                <Link to="/account" className="text-white/70 hover:text-[#A94826] transition-colors">
                  My Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h5 className="overline text-white mb-4">Contact</h5>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-white/70">
                <Mail size={16} />
                <a href="mailto:hello@capeembercoffee.co.za" className="hover:text-[#A94826] transition-colors">
                  hello@capeembercoffee.co.za
                </a>
              </li>
              <li className="flex items-center gap-2 text-white/70">
                <Phone size={16} />
                <a href="tel:+27810261618" className="hover:text-[#A94826] transition-colors">
                  +27 81 026 1618
                </a>
              </li>
              <li className="flex items-start gap-2 text-white/70">
                <MapPin size={16} className="mt-1" />
                <span>Cape Town, South Africa</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/50 text-sm">
            © {new Date().getFullYear()} Cape Ember Coffee Co. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-white/50">
            <Link to="/terms" className="hover:text-[#A94826] transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-[#A94826] transition-colors">Privacy</Link>
            <Link to="/returns" className="hover:text-[#A94826] transition-colors">Returns</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
