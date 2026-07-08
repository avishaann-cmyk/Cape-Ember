import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import { PaymentSuccessPage, PaymentCancelPage } from './pages/PaymentPages';
import AccountPage from './pages/AccountPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import ReturnsPage from './pages/ReturnsPage';
import BrewGuidePage from './pages/BrewGuidePage';
// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrders from './pages/admin/AdminOrders';
import AdminOrderDetail from './pages/admin/AdminOrderDetail';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminInventory from './pages/admin/AdminInventory';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminProducts from './pages/admin/AdminProducts';
import AdminDeliveries from './pages/admin/AdminDeliveries';
import AdminReviews from './pages/admin/AdminReviews';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';
import AdminContent from './pages/admin/AdminContent';
import AdminSubscribers from './pages/admin/AdminSubscribers';
import AdminSubscriptions from './pages/admin/AdminSubscriptions';
import AdminRoute from './components/admin/AdminRoute';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-[#FAFAF7] flex flex-col">
            <Navbar />
            <main className="flex-1" id="main-content">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/product/:productId" element={<ProductDetailPage />} />
                <Route path="/products/:productId" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/payment/success" element={<PaymentSuccessPage />} />
                <Route path="/payment/cancel" element={<PaymentCancelPage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/subscriptions" element={<SubscriptionsPage />} />
                <Route path="/brew-guide" element={<BrewGuidePage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/returns" element={<ReturnsPage />} />
                {/* Admin Routes */}
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
                <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
                <Route path="/admin/orders/:orderId" element={<AdminRoute><AdminOrderDetail /></AdminRoute>} />
                <Route path="/admin/customers" element={<AdminRoute><AdminCustomers /></AdminRoute>} />
                <Route path="/admin/inventory" element={<AdminRoute><AdminInventory /></AdminRoute>} />
                <Route path="/admin/coupons" element={<AdminRoute><AdminCoupons /></AdminRoute>} />
                <Route path="/admin/deliveries" element={<AdminRoute><AdminDeliveries /></AdminRoute>} />
                <Route path="/admin/reviews" element={<AdminRoute><AdminReviews /></AdminRoute>} />
                <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
                <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
                <Route path="/admin/content" element={<AdminRoute><AdminContent /></AdminRoute>} />
                <Route path="/admin/subscribers" element={<AdminRoute><AdminSubscribers /></AdminRoute>} />
                <Route path="/admin/subscriptions" element={<AdminRoute><AdminSubscriptions /></AdminRoute>} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
