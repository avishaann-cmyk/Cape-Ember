import React, { useState, useEffect } from 'react';
import { X, Gift, ArrowRight } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ExitIntentPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user has already seen/dismissed the popup
    const hasSeenPopup = localStorage.getItem('exitPopupDismissed');
    if (hasSeenPopup) return;

    let timeoutId;

    const handleMouseLeave = (e) => {
      // Only trigger when mouse leaves through the top of the page
      if (e.clientY <= 0) {
        setIsVisible(true);
      }
    };

    // Also show popup after 30 seconds if user hasn't seen it
    timeoutId = setTimeout(() => {
      const stillNotDismissed = !localStorage.getItem('exitPopupDismissed');
      if (stillNotDismissed) {
        setIsVisible(true);
      }
    }, 30000);

    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(timeoutId);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // Set a session-based dismissal (will show again next session)
    localStorage.setItem('exitPopupDismissed', 'true');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post(`${API}/newsletter/subscribe?email=${encodeURIComponent(email)}`);
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100]"
            onClick={handleClose}
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            data-testid="exit-intent-popup"
          >
            <div className="bg-white max-w-md w-full shadow-2xl relative overflow-hidden">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-[#6B5048] hover:text-[#2C1A12] transition-colors z-10"
                data-testid="exit-popup-close"
              >
                <X size={24} />
              </button>

              {/* Decorative top bar */}
              <div className="h-1 bg-gradient-to-r from-[#D05C23] to-[#C86333]" />

              <div className="p-8 text-center">
                {!success ? (
                  <>
                    {/* Icon */}
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#D05C23]/10 flex items-center justify-center">
                      <Gift size={32} weight="light" className="text-[#D05C23]" />
                    </div>

                    {/* Content */}
                    <h2 className="font-heading text-3xl text-[#2C1A12] mb-3">
                      Wait! Before You Go...
                    </h2>
                    <p className="text-[#6B5048] mb-6">
                      Join the Ember Circle and get <span className="font-semibold text-[#D05C23]">10% off</span> your first order, 
                      plus exclusive access to new roasts and offers.
                    </p>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full px-4 py-3 border border-[#E6DCD1] focus:border-[#D05C23] focus:ring-1 focus:ring-[#D05C23] outline-none transition-colors text-center"
                        data-testid="exit-popup-email"
                      />
                      {error && (
                        <p className="text-sm text-red-500">{error}</p>
                      )}
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary flex items-center justify-center gap-2"
                        data-testid="exit-popup-submit"
                      >
                        {loading ? (
                          <span className="spinner border-white border-t-transparent w-5 h-5" />
                        ) : (
                          <>
                            Claim My 10% Off
                            <ArrowRight size={18} />
                          </>
                        )}
                      </button>
                    </form>

                    {/* No thanks link */}
                    <button
                      onClick={handleClose}
                      className="mt-4 text-sm text-[#6B5048] hover:text-[#2C1A12] transition-colors"
                    >
                      No thanks, I&apos;ll pay full price
                    </button>
                  </>
                ) : (
                  <>
                    {/* Success state */}
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#2F855A]/10 flex items-center justify-center">
                      <svg className="w-8 h-8 text-[#2F855A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h2 className="font-heading text-3xl text-[#2C1A12] mb-3">
                      Welcome to the Circle!
                    </h2>
                    <p className="text-[#6B5048]">
                      Check your inbox for your 10% discount code. Happy brewing!
                    </p>
                  </>
                )}
              </div>

              {/* Trust badges */}
              <div className="bg-[#F4EFE6] px-8 py-4 flex justify-center gap-6 text-xs text-[#6B5048]">
                <span>No Spam</span>
                <span>•</span>
                <span>Unsubscribe Anytime</span>
                <span>•</span>
                <span>SA Privacy Compliant</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ExitIntentPopup;
