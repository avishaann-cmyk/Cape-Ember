import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

const ReturnsPage = () => {
  return (
    <div className="min-h-screen pt-20 md:pt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <span className="overline text-[#A94826] mb-2 block">Legal</span>
        <h1 className="font-heading text-4xl md:text-5xl text-[#2D2622] mb-8">
          Returns & Refunds Policy
        </h1>
        
        <div className="prose prose-lg text-[#5C534C] space-y-8">
          <p className="text-lg">
            <strong>Effective Date:</strong> January 2026<br />
            <strong>Last Updated:</strong> January 2026
          </p>

          <p>
            At Cape Ember Coffee Co., we want you to be completely satisfied with your purchase. 
            If you're not happy with your order, we're here to help. This policy outlines our 
            returns and refunds process in accordance with the Consumer Protection Act (CPA) of South Africa.
          </p>

          <section>
            <h2 className="font-heading text-2xl text-[#2D2622] mb-4">Quality Guarantee</h2>
            <p>
              We take pride in the quality of our coffee. If you receive a product that is damaged, 
              defective, or not as described, we will replace it or provide a full refund at no 
              additional cost to you.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-[#2D2622] mb-4">Cooling-Off Period</h2>
            <p>
              In accordance with the Consumer Protection Act, you have the right to return goods 
              purchased online within <strong>7 days</strong> of delivery for a full refund, provided:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The product is unused and in its original, sealed packaging</li>
              <li>You have proof of purchase (order confirmation or receipt)</li>
              <li>The product has not passed its best-before date</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-[#2D2622] mb-4">Items Not Eligible for Return</h2>
            <p>Due to the nature of food products, we cannot accept returns for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Opened or unsealed coffee bags</li>
              <li>Products that have been stored improperly</li>
              <li>Products past their best-before date at time of return</li>
              <li>Items returned without original packaging</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-[#2D2622] mb-4">How to Request a Return</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Contact us within 7 days of receiving your order via email at hello@capeembercoffee.co.za or WhatsApp at +27 81 026 1618</li>
              <li>Provide your order number and reason for return</li>
              <li>We will respond within 2 business days with return instructions</li>
              <li>Ship the product back to us (return shipping costs apply unless the product is defective)</li>
              <li>Once we receive and inspect the return, we will process your refund</li>
            </ol>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-[#2D2622] mb-4">Damaged or Defective Products</h2>
            <p>
              If you receive a damaged or defective product:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Contact us within 48 hours of delivery</li>
              <li>Provide photos of the damaged product and packaging</li>
              <li>We will arrange for a replacement or full refund, including any shipping costs</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-[#2D2622] mb-4">Refund Process</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Refunds will be processed within 7 business days of receiving the returned item</li>
              <li>Refunds will be credited to the original payment method</li>
              <li>PayFast refunds typically appear within 5-10 business days depending on your bank</li>
              <li>You will receive email confirmation when your refund is processed</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-[#2D2622] mb-4">Subscription Cancellations</h2>
            <p>
              You can cancel your subscription at any time through your account dashboard. 
              Cancellations must be made at least 48 hours before the next scheduled delivery 
              to avoid being charged for that delivery. No refunds are provided for subscription 
              orders that have already been dispatched.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-[#2D2622] mb-4">Exchanges</h2>
            <p>
              If you'd like to exchange a product for a different blend, please contact us. 
              Exchanges are subject to product availability and the same conditions as returns.
            </p>
          </section>

          <section className="bg-[#F2EEE8] border border-[#E5DCD0] p-6">
            <h2 className="font-heading text-2xl text-[#2D2622] mb-4">Need Help?</h2>
            <p className="mb-4">
              We're here to help! If you have any questions about returns or need assistance 
              with your order, don't hesitate to reach out.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="mailto:hello@capeembercoffee.co.za"
                className="btn-secondary inline-flex items-center justify-center"
              >
                Email Us
              </a>
              <a
                href="https://wa.me/27810261618"
                target="_blank"
                rel="noopener noreferrer"
                className="whatsapp-btn inline-flex items-center justify-center gap-2 px-6 py-3 font-medium"
              >
                <MessageCircle size={20} />
                WhatsApp Us
              </a>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-[#E5DCD0]">
          <Link to="/" className="text-[#A94826] hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ReturnsPage;
