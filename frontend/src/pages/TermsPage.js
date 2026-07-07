import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const TermsPage = () => {
  useEffect(() => {
    document.title = 'Terms & Conditions | Cape Ember Coffee Co.';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.content = 'Terms and conditions for shopping at Cape Ember Coffee Co. Learn about our policies and guidelines.';
    }
  }, []);

  return (
    <div className="min-h-screen pt-20 md:pt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <span className="overline text-[#A94826] mb-2 block">Legal</span>
        <h1 className="font-heading text-4xl md:text-5xl text-[#2D2622] mb-8">
          Terms & Conditions
        </h1>
        
        <div className="prose prose-lg text-[#5C534C] space-y-8">
          <p className="text-lg">
            <strong>Effective Date:</strong> January 2026<br />
            <strong>Last Updated:</strong> January 2026
          </p>

          <p>
            Welcome to Cape Ember Coffee Co. These Terms and Conditions govern your use of our website 
            (capeembercoffee.co.za) and the purchase of products from our online store. By accessing 
            our website or placing an order, you agree to be bound by these terms.
          </p>

          <section>
            <h2 className="font-heading text-2xl text-[#2D2622] mb-4">1. Company Information</h2>
            <p>
              Cape Ember Coffee Co. is a South African registered business operating from Cape Town, 
              Western Cape. For any queries, please contact us at hello@capeembercoffee.co.za or 
              via WhatsApp at +27 81 026 1618.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-[#2D2622] mb-4">2. Products & Pricing</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>All prices are displayed in South African Rand (ZAR) and include VAT where applicable.</li>
              <li>We reserve the right to modify prices without prior notice.</li>
              <li>Product images are for illustration purposes. Actual packaging may vary slightly.</li>
              <li>Coffee is a natural product; flavor profiles may have subtle variations between batches.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-[#2D2622] mb-4">3. Orders & Payment</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Orders are confirmed once payment is successfully processed via PayFast.</li>
              <li>We accept credit cards, debit cards, and EFT payments.</li>
              <li>Order confirmation will be sent to your registered email address.</li>
              <li>We reserve the right to cancel orders if fraud is suspected.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-[#2D2622] mb-4">4. Delivery</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>We deliver throughout South Africa.</li>
              <li>Free delivery on orders over R399.</li>
              <li>Standard delivery fee is R75 for orders under R399.</li>
              <li>Estimated delivery times: 3-5 business days for major cities, 5-7 business days for other areas.</li>
              <li>Delivery times are estimates and not guaranteed.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-[#2D2622] mb-4">5. Subscriptions</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Subscriptions can be paused, modified, or cancelled at any time via your account dashboard.</li>
              <li>Subscription orders include free delivery.</li>
              <li>You will be charged on each delivery cycle (weekly, bi-weekly, or monthly).</li>
              <li>Cancellation must be done at least 48 hours before the next scheduled delivery.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-[#2D2622] mb-4">6. Returns & Refunds</h2>
            <p>
              Please refer to our <Link to="/returns" className="text-[#A94826] hover:underline">Returns Policy</Link> for 
              detailed information on returns, exchanges, and refunds.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-[#2D2622] mb-4">7. Intellectual Property</h2>
            <p>
              All content on this website, including logos, images, text, and design elements, is the 
              property of Cape Ember Coffee Co. and is protected by South African intellectual property laws. 
              Unauthorized use is prohibited.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-[#2D2622] mb-4">8. Limitation of Liability</h2>
            <p>
              Cape Ember Coffee Co. shall not be liable for any indirect, incidental, or consequential 
              damages arising from the use of our products or services. Our liability is limited to the 
              value of the products purchased.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-[#2D2622] mb-4">9. Governing Law</h2>
            <p>
              These terms are governed by the laws of the Republic of South Africa. Any disputes shall 
              be subject to the jurisdiction of the South African courts.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-[#2D2622] mb-4">10. Contact Us</h2>
            <p>
              For any questions about these Terms & Conditions, please contact us:<br />
              Email: hello@capeembercoffee.co.za<br />
              WhatsApp: +27 81 026 1618<br />
              Location: Cape Town, South Africa
            </p>
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

export default TermsPage;
