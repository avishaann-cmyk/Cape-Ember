import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, MessageCircle } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { trackEvent } from '../lib/analytics';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const { refreshCart } = useCart();
  const [whatsappLink, setWhatsappLink] = useState('');
  const orderId = searchParams.get('order_id') || localStorage.getItem('order_id');

  useEffect(() => {
    // Refresh cart after successful payment
    refreshCart();

    trackEvent('purchase', {
      order_id: orderId || null
    });
    
    // Get whatsapp link
    const link = localStorage.getItem('whatsapp_link');
    if (link) {
      setWhatsappLink(link);
    }
    
    // Clean up
    localStorage.removeItem('whatsapp_link');
    localStorage.removeItem('order_id');
  }, [refreshCart, orderId]);

  return (
    <div className="min-h-screen pt-20 md:pt-24 flex items-center justify-center">
      <div className="max-w-lg mx-auto px-4 text-center animate-scale-in">
        <div className="w-20 h-20 mx-auto mb-6 bg-[#388E3C]/10 rounded-full flex items-center justify-center">
          <CheckCircle size={48} className="text-[#388E3C]" />
        </div>
        
        <h1 className="font-heading text-4xl text-[#2D2622] mb-4">
          Thank You!
        </h1>
        
        <p className="text-[#5C534C] text-lg mb-2">
          Your order has been placed successfully.
        </p>
        
        {orderId && (
          <p className="text-[#5C534C] mb-6">
            Order ID: <span className="font-mono font-semibold">{orderId.slice(0, 8)}</span>
          </p>
        )}

        <div className="bg-[#F2EEE8] border border-[#E5DCD0] p-6 mb-8">
          <p className="text-[#5C534C] mb-4">
            We'll send you a confirmation email with your order details and tracking information.
          </p>
          
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-btn inline-flex items-center gap-2 px-6 py-3 font-medium"
              data-testid="order-whatsapp"
            >
              <MessageCircle size={20} />
              Send Order to WhatsApp
            </a>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/account" className="btn-primary" data-testid="view-orders">
            View My Orders
          </Link>
          <Link to="/shop" className="btn-secondary" data-testid="continue-shopping">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

const PaymentCancelPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    trackEvent('payment_cancelled', {
      order_id: orderId || null
    });
  }, [orderId]);

  return (
    <div className="min-h-screen pt-20 md:pt-24 flex items-center justify-center">
      <div className="max-w-lg mx-auto px-4 text-center animate-scale-in">
        <div className="w-20 h-20 mx-auto mb-6 bg-[#D32F2F]/10 rounded-full flex items-center justify-center">
          <XCircle size={48} className="text-[#D32F2F]" />
        </div>
        
        <h1 className="font-heading text-4xl text-[#2D2622] mb-4">
          Payment Cancelled
        </h1>
        
        <p className="text-[#5C534C] text-lg mb-8">
          Your payment was not completed. Your cart items are still saved.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/checkout" className="btn-primary" data-testid="retry-payment">
            Try Again
          </Link>
          <Link to="/cart" className="btn-secondary" data-testid="back-to-cart">
            Back to Cart
          </Link>
        </div>

        <p className="text-[#5C534C] mt-8">
          Need help?{' '}
          <a
            href="https://wa.me/27810261618"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#A94826] hover:underline"
          >
            Chat with us on WhatsApp
          </a>
        </p>
      </div>
    </div>
  );
};

export { PaymentSuccessPage, PaymentCancelPage };
