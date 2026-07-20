import React, { useState } from 'react';
import { Envelope, Phone, MapPin, WhatsappLogo, InstagramLogo, FacebookLogo, TiktokLogo, XLogo } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { setPageSEO } from '../lib/seo';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const CONTACT_HERO_IMAGE = 'https://images.unsplash.com/photo-1504630083234-14187a9df0f5?auto=format&fit=crop&w=2000&q=80';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    website: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [publicSettings, setPublicSettings] = useState({
    contact_email: 'hello@capeembercoffee.co.za',
    whatsapp_number: '+27810261618',
    social_links: {
      instagram: 'https://instagram.com/capeembercoffee',
      facebook: 'https://facebook.com/capeembercoffee'
    }
  });

  React.useEffect(() => {
    setPageSEO({
      title: 'Contact Cape Ember Coffee Co. | Premium South African Coffee',
      description: 'Get in touch with Cape Ember Coffee Co. for coffee questions, wholesale enquiries, and support.',
      canonicalPath: '/contact',
      image: '/assets/cape-ember/cape-ember-fynbos-lifestyle.jpeg'
    });
  }, []);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API}/settings/public`);
        setPublicSettings((prev) => ({ ...prev, ...(res.data || {}) }));
      } catch (e) {
        // Keep default public contact channels if endpoint is unavailable.
      }
    };
    fetchSettings();
  }, []);

  const whatsappDigits = String(publicSettings.whatsapp_number || '').replace(/\D/g, '');
  const whatsappHref = whatsappDigits ? `https://wa.me/${whatsappDigits}` : 'https://wa.me/27810261618';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.message) {
      setError('Please fill in all required fields.');
      return;
    }

    setSending(true);
    try {
      await axios.post(`${API}/contact`, {
        name: formData.name,
        email: formData.email,
        subject: formData.subject || 'General Enquiry',
        message: formData.message,
        website: formData.website
      });
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '', website: '' });
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again or WhatsApp us.');
    } finally {
      setSending(false);
    }
  };

  const contactInfo = [
    {
      icon: Envelope,
      label: 'Email',
      value: publicSettings.contact_email || 'hello@capeembercoffee.co.za',
      href: `mailto:${publicSettings.contact_email || 'hello@capeembercoffee.co.za'}`
    },
    {
      icon: WhatsappLogo,
      label: 'WhatsApp',
      value: publicSettings.whatsapp_number || '+27 (0)81 026 1618',
      href: whatsappHref
    },
    {
      icon: Phone,
      label: 'Phone',
      value: publicSettings.whatsapp_number || '+27 (0)81 026 1618',
      href: `tel:${publicSettings.whatsapp_number || '+27810261618'}`
    },
    {
      icon: MapPin,
      label: 'Location',
      value: 'Garden Route, South Africa',
      href: null
    }
  ];

  const socialLinks = [
    { icon: InstagramLogo, href: publicSettings.social_links?.instagram || 'https://instagram.com/capeembercoffee', label: 'Instagram' },
    { icon: FacebookLogo, href: publicSettings.social_links?.facebook || 'https://facebook.com/capeembercoffee', label: 'Facebook' },
    { icon: TiktokLogo, href: publicSettings.social_links?.tiktok || '', label: 'TikTok' },
    { icon: XLogo, href: publicSettings.social_links?.x || '', label: 'X' },
    { icon: WhatsappLogo, href: whatsappHref, label: 'WhatsApp' }
  ].filter((link) => Boolean(link.href));

  return (
    <div className="min-h-screen pt-20 md:pt-24 bg-[#FDFBF7]">
      {/* Hero Section */}
      <section className="section-padding relative text-white overflow-hidden">
        <img
          src={CONTACT_HERO_IMAGE}
          alt="Coffee lifestyle scene with people enjoying coffee"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-[#2C1A12]/70" />
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h1 className="font-heading text-5xl md:text-6xl mb-4">Get in Touch</h1>
          <p className="text-lg text-white/80">
            Have a question about our coffee? We'd love to hear from you.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#E6DCD1] p-8"
          >
            <h2 className="font-heading text-2xl text-[#2C1A12] mb-6">Send us a Message</h2>
            
            {submitted ? (
              <div className="bg-[#2F855A]/10 border border-[#2F855A] text-[#2F855A] p-4 text-center">
                <p className="font-medium">Thank you, your message has been sent.</p>
                <p className="text-sm mt-1">We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-[#C53030]/10 border border-[#C53030] text-[#C53030] p-3 text-sm">
                    {error}
                  </div>
                )}

                <input
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                />
                
                <div>
                  <label className="block text-sm font-medium text-[#2C1A12] mb-2">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-[#E6DCD1] focus:border-[#D05C23] focus:outline-none"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2C1A12] mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-[#E6DCD1] focus:border-[#D05C23] focus:outline-none"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2C1A12] mb-2">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-[#E6DCD1] focus:border-[#D05C23] focus:outline-none"
                    placeholder="How can we help?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2C1A12] mb-2">Message *</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    className="w-full px-4 py-3 border border-[#E6DCD1] focus:border-[#D05C23] focus:outline-none resize-none"
                    placeholder="Your message..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="btn-primary w-full disabled:opacity-60"
                >
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-8"
          >
            <div>
              <h2 className="font-heading text-2xl text-[#2C1A12] mb-6">Contact Information</h2>
              
              <div className="space-y-4">
                {contactInfo.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <Icon size={24} className="text-[#D05C23] mt-1" />
                      </div>
                      <div>
                        <p className="text-sm text-[#6B5048] font-medium">{item.label}</p>
                        {item.href ? (
                          <a
                            href={item.href}
                            className="text-[#2C1A12] font-medium hover:text-[#D05C23] transition-colors"
                            target={item.href.startsWith('http') ? '_blank' : undefined}
                            rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                          >
                            {item.value}
                          </a>
                        ) : (
                          <p className="text-[#2C1A12] font-medium">{item.value}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Response Time */}
            <div className="bg-[#D05C23]/5 border border-[#D05C23]/20 p-6">
              <h3 className="font-medium text-[#2C1A12] mb-3">Response Time</h3>
              <p className="text-[#6B5048] text-sm mb-2">
                We aim to respond to all inquiries within 24 business hours.
              </p>
              <p className="text-[#6B5048] text-sm">
                For urgent matters, please reach out via WhatsApp or phone during business hours.
              </p>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="font-medium text-[#2C1A12] mb-4">Follow Us</h3>
              <div className="flex gap-4">
                {socialLinks.map((link, index) => {
                  const Icon = link.icon;
                  return (
                    <a
                      key={index}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-white border border-[#E6DCD1] flex items-center justify-center hover:bg-[#D05C23] hover:border-[#D05C23] hover:text-white transition-colors"
                      title={link.label}
                    >
                      <Icon size={20} />
                    </a>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* FAQ Section */}
      <section className="section-padding bg-[#F2EEE8]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl text-[#2C1A12] mb-3">Frequently Asked Questions</h2>
            <p className="text-[#6B5048]">Can't find what you're looking for? Check our FAQ.</p>
          </div>

          <div className="space-y-6">
            {[
              {
                q: 'How long does delivery take?',
                a: 'Standard delivery takes 3-5 business days nationwide. Express delivery (1-2 days) is available for most areas.'
              },
              {
                q: 'Do you offer international shipping?',
                a: 'Currently, we deliver within South Africa only. Contact us for bulk orders or international inquiries.'
              },
              {
                q: 'What is your return policy?',
                a: 'We offer a 30-day money-back guarantee. If you\'re not satisfied, we\'ll refund your order. See our Returns page for details.'
              },
              {
                q: 'Are your coffees freshly roasted?',
                a: 'Yes! All our coffees are freshly roasted by our trusted roasting partners within 48 hours of your order.'
              },
              {
                q: 'Do you have a wholesale/bulk program?',
                a: 'We\'d love to work with cafes, restaurants, and offices! Contact us at hello@capeembercoffee.co.za for bulk pricing.'
              }
            ].map((item, index) => (
              <div key={index} className="bg-white border border-[#E6DCD1] p-6">
                <h3 className="font-medium text-[#2C1A12] mb-2">{item.q}</h3>
                <p className="text-[#6B5048]">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
