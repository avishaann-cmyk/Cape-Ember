import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingBag, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import AuthModal from './AuthModal';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const openAuthModal = (mode) => {
    setAuthMode(mode);
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="nav-glass fixed top-0 left-0 right-0 z-40 border-b border-[#E5DCD0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center" data-testid="nav-logo">
              <span className="font-heading text-xl md:text-2xl text-[#2D2622] tracking-tight">
                Cape Ember Coffee Co.
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                to="/shop" 
                className="text-[#5C534C] hover:text-[#A94826] font-medium transition-colors"
                data-testid="nav-shop"
              >
                Shop
              </Link>
              <Link 
                to="/about" 
                className="text-[#5C534C] hover:text-[#A94826] font-medium transition-colors"
                data-testid="nav-about"
              >
                Our Story
              </Link>
              <Link 
                to="/subscriptions" 
                className="text-[#5C534C] hover:text-[#A94826] font-medium transition-colors"
                data-testid="nav-subscriptions"
              >
                Subscribe
              </Link>
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {/* Cart */}
              <Link 
                to="/cart" 
                className="relative text-[#5C534C] hover:text-[#A94826] transition-colors"
                data-testid="nav-cart"
              >
                <ShoppingBag size={24} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#A94826] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* User menu */}
              {isAuthenticated ? (
                <div className="hidden md:flex items-center space-x-4">
                  <Link 
                    to="/account" 
                    className="text-[#5C534C] hover:text-[#A94826] transition-colors"
                    data-testid="nav-account"
                  >
                    <User size={24} />
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="text-[#5C534C] hover:text-[#A94826] transition-colors"
                    data-testid="nav-logout"
                  >
                    <LogOut size={24} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => openAuthModal('login')}
                  className="hidden md:block btn-primary text-sm py-2 px-4"
                  data-testid="nav-signin"
                >
                  Sign In
                </button>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-[#5C534C]"
                data-testid="nav-mobile-toggle"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#FAFAF7] border-t border-[#E5DCD0] animate-slide-in">
            <div className="px-4 py-6 space-y-4">
              <Link 
                to="/shop" 
                className="block text-[#2D2622] font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
                data-testid="mobile-nav-shop"
              >
                Shop
              </Link>
              <Link 
                to="/about" 
                className="block text-[#2D2622] font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
                data-testid="mobile-nav-about"
              >
                Our Story
              </Link>
              <Link 
                to="/subscriptions" 
                className="block text-[#2D2622] font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
                data-testid="mobile-nav-subscriptions"
              >
                Subscribe
              </Link>
              
              <div className="border-t border-[#E5DCD0] pt-4 mt-4">
                {isAuthenticated ? (
                  <>
                    <Link 
                      to="/account" 
                      className="block text-[#2D2622] font-medium py-2"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid="mobile-nav-account"
                    >
                      My Account
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left text-[#A94826] font-medium py-2"
                      data-testid="mobile-nav-logout"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => openAuthModal('login')}
                      className="block w-full text-[#2D2622] font-medium py-2"
                      data-testid="mobile-nav-signin"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => openAuthModal('register')}
                      className="block w-full text-[#A94826] font-medium py-2"
                      data-testid="mobile-nav-register"
                    >
                      Create Account
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        initialMode={authMode}
      />
    </>
  );
};

export default Navbar;
