import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { WhatsappLogo, Envelope, MapPin, Phone, InstagramLogo, FacebookLogo, TiktokLogo, XLogo } from '@phosphor-icons/react';
const FLAME_LOGO_URL = "https://customer-assets.emergentagent.com/job_axis-creator/artifacts/un142drw_999F77B4-7671-405E-AF3F-CE82CEBF30BF.png";
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Footer = () => {
  const [publicSettings, setPublicSettings] = useState({
    contact_email: 'hello@capeembercoffee.co.za',
    whatsapp_number: '+27810261618',
    social_links: {
      instagram: 'https://instagram.com/capeembercoffee',
      facebook: 'https://facebook.com/capeembercoffee'
    }
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API}/settings/public`);
        setPublicSettings((prev) => ({ ...prev, ...(res.data || {}) }));
        // Cache WhatsApp number for other pages that don't fetch settings themselves
        if (res.data?.whatsapp_number) {
          localStorage.setItem('public_whatsapp', res.data.whatsapp_number);
        }
      } catch (e) {
        // Keep defaults if settings are not available.
      }
    };
    fetchSettings();
  }, []);

  const whatsappDigits = useMemo(
    () => String(publicSettings.whatsapp_number || '').replace(/\D/g, ''),
    [publicSettings.whatsapp_number]
  );

  const whatsappHref = whatsappDigits ? `https://wa.me/${whatsappDigits}` : 'https://wa.me/27810261618';

  return (
    <footer className="bg-[#2C1A12] text-white" data-testid="main-footer">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <img 
                src={FLAME_LOGO_URL} 
                alt="Cape Ember" 
                className="h-10 w-10 object-contain"
              />
              <span className="font-heading text-xl text-white">Cape Ember Coffee Co.</span>
            </Link>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Premium coffee inspired by South African landscapes. 
              Experience the beauty of the Cape in every cup.
            </p>
            <div className="flex gap-4">
              <a 
                href={publicSettings.social_links?.instagram || 'https://instagram.com/capeembercoffee'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-[#C86333] transition-colors"
                aria-label="Instagram"
              >
                <InstagramLogo size={22} weight="light" />
              </a>
              <a 
                href={publicSettings.social_links?.facebook || 'https://facebook.com/capeembercoffee'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-[#C86333] transition-colors"
                aria-label="Facebook"
              >
                <FacebookLogo size={22} weight="light" />
              </a>
              {publicSettings.social_links?.tiktok && (
                <a
                  href={publicSettings.social_links.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-[#C86333] transition-colors"
                  aria-label="TikTok"
                >
                  <TiktokLogo size={22} weight="light" />
                </a>
              )}
              {publicSettings.social_links?.x && (
                <a
                  href={publicSettings.social_links.x}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-[#C86333] transition-colors"
                  aria-label="X"
                >
                  <XLogo size={22} weight="light" />
                </a>
              )}
              <a 
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-[#25D366] transition-colors"
                aria-label="WhatsApp"
                data-testid="footer-whatsapp"
              >
                <WhatsappLogo size={22} weight="light" />
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h5 className="text-white font-medium text-sm tracking-wide uppercase mb-6">Shop</h5>
            <ul className="space-y-3">
              {[
                { to: '/products/landscape-bundle', label: 'Landscape Bundle' },
                { to: '/shop', label: 'All Coffees' },
                { to: '/shop?category=single-origin', label: 'Single Origin' },
                { to: '/shop?category=blends', label: 'Blends' },
                { to: '/subscriptions', label: 'Subscriptions' },
                { to: '/shop?category=bundle', label: 'Bundles & Gift Sets' },
              ].map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="text-white/60 hover:text-[#C86333] transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help Links */}
          <div>
            <h5 className="text-white font-medium text-sm tracking-wide uppercase mb-6">Help</h5>
            <ul className="space-y-3">
              {[
                { to: '/', label: 'Home' },
                { to: '/brew-guide', label: 'Brew Guide' },
                { to: '/about', label: 'Our Story' },
                { to: '/contact', label: 'Contact Us' },
                { to: '/account', label: 'My Account' },
                { to: '/returns', label: 'Shipping & Returns' },
                { to: '/privacy', label: 'Privacy Policy' },
                { to: '/terms', label: 'Terms & Conditions' },
              ].map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="text-white/60 hover:text-[#C86333] transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h5 className="text-white font-medium text-sm tracking-wide uppercase mb-6">Contact</h5>
            <ul className="space-y-4">
              <li>
                <a 
                  href={`mailto:${publicSettings.contact_email || 'hello@capeembercoffee.co.za'}`} 
                  className="flex items-center gap-3 text-white/60 hover:text-[#C86333] transition-colors text-sm group"
                >
                  <Envelope size={18} weight="light" className="group-hover:text-[#C86333]" />
                  {publicSettings.contact_email || 'hello@capeembercoffee.co.za'}
                </a>
              </li>
              <li>
                <a 
                  href={`tel:${publicSettings.whatsapp_number || '+27810261618'}`} 
                  className="flex items-center gap-3 text-white/60 hover:text-[#C86333] transition-colors text-sm group"
                >
                  <Phone size={18} weight="light" className="group-hover:text-[#C86333]" />
                  {publicSettings.whatsapp_number || '+27 81 026 1618'}
                </a>
              </li>
              <li className="flex items-start gap-3 text-white/60 text-sm">
                <MapPin size={18} weight="light" className="mt-0.5 flex-shrink-0" />
                <span>Garden Route<br/>Western Cape, South Africa</span>
              </li>
            </ul>

            {/* WhatsApp CTA */}
            <a 
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-[#25D366] hover:bg-[#20BD5A] text-white text-sm font-medium transition-colors"
              data-testid="footer-whatsapp-cta"
            >
              <WhatsappLogo size={18} weight="fill" />
              Chat with us
            </a>

          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/40 text-sm">
              © {new Date().getFullYear()} Cape Ember Coffee Co. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <img 
                src="https://www.payfast.co.za/assets/images/logos/PayFast_logo_colour.svg" 
                alt="PayFast" 
                className="h-6 opacity-60 hover:opacity-100 transition-opacity"
              />
              <div className="flex gap-2">
                <span className="text-white/40 text-xs">Secure Payments</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
