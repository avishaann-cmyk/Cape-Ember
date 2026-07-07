import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const PrivacyPage = () => {
  useEffect(() => {
    document.title = 'Privacy Policy | Cape Ember Coffee Co.';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.content = 'Learn how Cape Ember Coffee Co. protects your privacy and personal information.';
    }
  }, []);

  return (
    <div className="min-h-screen pt-20 md:pt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <span className="overline text-[#A94826] mb-2 block">Legal</span>
        <h1 className="font-heading text-4xl md:text-5xl text-[#2D2622] mb-8">
          Privacy Policy
        </h1>
        
        <div className="prose prose-lg text-[#5C534C] space-y-8">
          <p className="text-lg">
            <strong>Effective Date:</strong> January 2026<br />
            <strong>Last Updated:</strong> January 2026
          </p>

          <p>
            Cape Ember Coffee Co. ("we," "our," or "us") is committed to protecting your privacy. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
            when you visit our website and make purchases. This policy complies with the Protection of 
            Personal Information Act (POPIA) of South Africa.
          </p>

          <section>
            <h2 className="font-heading text-2xl text-[#2D2622] mb-4">1. Information We Collect</h2>
            <h3 className="font-semibold text-[#2D2622] mt-4 mb-2">Personal Information</h3>
            <p>When you create an account or place an order, we collect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Full name</li>
              <li>Email address</li>
              <li>Phone number (optional)</li>
              <li>Delivery address</li>
              <li>Payment information (processed securely via PayFast)</li>
            </ul>

            <h3 className="font-semibold text-[#2D2622] mt-4 mb-2">Automatically Collected Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Pages visited and time spent</li>
              <li>Referring website</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-[#2D2622] mb-4">2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Process and fulfill your orders</li>
              <li>Communicate order status and delivery updates</li>
              <li>Manage your account and subscriptions</li>
              <li>Send promotional emails (only with your consent)</li>
              <li>Improve our website and services</li>
              <li>Prevent fraud and ensure security</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-[#2D2622] mb-4">3. Information Sharing</h2>
            <p>We do not sell your personal information. We may share your information with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Payment Processors:</strong> PayFast processes payments securely. We do not store your full card details.</li>
              <li><strong>Delivery Partners:</strong> Courier companies receive only the information necessary to deliver your order.</li>
              <li><strong>Service Providers:</strong> Trusted third parties who assist with website hosting and email services.</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-[#2D2622] mb-4">4. Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>SSL encryption for all data transmission</li>
              <li>Secure password hashing</li>
              <li>Regular security assessments</li>
              <li>Limited access to personal data</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-[#2D2622] mb-4">5. Your Rights Under POPIA</h2>
            <p>As a South African data subject, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal information</li>
              <li><strong>Correction:</strong> Request correction of inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Object:</strong> Object to processing of your information for marketing</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent for marketing communications</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, contact us at hello@capeembercoffee.co.za
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-[#2D2622] mb-4">6. Cookies</h2>
            <p>
              We use essential cookies to enable basic website functionality such as maintaining your 
              shopping cart and login session. These are necessary for the website to function properly.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-[#2D2622] mb-4">7. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to fulfill the purposes 
              outlined in this policy, comply with legal obligations, and resolve disputes. Order 
              history is retained for 5 years for tax and legal purposes.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-[#2D2622] mb-4">8. Children's Privacy</h2>
            <p>
              Our website is not intended for children under 18. We do not knowingly collect 
              personal information from children.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-[#2D2622] mb-4">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this 
              page with an updated effective date. We encourage you to review this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-[#2D2622] mb-4">10. Contact Us</h2>
            <p>
              For privacy-related questions or to exercise your rights, contact our Information Officer:<br />
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

export default PrivacyPage;
