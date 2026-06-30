import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MagnifyingGlass, User, Heart, ShoppingBag, List, X } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import AuthModal from './AuthModal';

const FLAME_LOGO_URL = "https://customer-assets.emergentagent.com/job_axis-creator/artifacts/un142drw_999F77B4-7671-405E-AF3F-CE82CEBF30BF.png";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  // Handle scroll effect for header shrinking
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { to: '/shop', label: 'Shop' },
    { to: '/about', label: 'Our Story' },
    { to: '/subscriptions', label: 'Subscribe' },
    { to: '/brew-guide', label: 'Brew Guide' },
  ];

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled 
            ? 'glass-header py-2' 
            : 'bg-[#FDFBF7]/95 backdrop-blur-sm py-4'
        }`}
        data-testid="main-navbar"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo - Flame + Text */}
            <Link 
              to="/" 
              className="flex items-center gap-3 group" 
              data-testid="nav-logo"
            >
              <div className={`relative transition-all duration-500 ${scrolled ? 'w-8 h-8' : 'w-10 h-10'}`}>
                <img 
                  src={FLAME_LOGO_URL} 
                  alt="Cape Ember" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className={`font-heading font-medium text-[#2C1A12] tracking-wide transition-all duration-500 ${
                  scrolled ? 'text-lg' : 'text-xl'
                }`}>
                  Cape Ember Coffee Co.
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-10">
              {navLinks.map((link) => (
                <Link 
                  key={link.to}
                  to={link.to} 
                  className="relative text-[#6B5048] hover:text-[#2C1A12] font-body font-medium text-sm tracking-wide transition-colors link-underline"
                  data-testid={`nav-${link.label.toLowerCase().replace(' ', '-')}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-[#6B5048] hover:text-[#D05C23] transition-colors"
                data-testid="nav-search"
                aria-label="Search"
              >
                <MagnifyingGlass size={22} weight="light" />
              </button>

              {/* Wishlist */}
              <Link 
                to="/account?tab=wishlist" 
                className="hidden sm:block p-2 text-[#6B5048] hover:text-[#D05C23] transition-colors"
                data-testid="nav-wishlist"
                aria-label="Wishlist"
              >
                <Heart size={22} weight="light" />
              </Link>

              {/* Account */}
              {isAuthenticated ? (
                <Link 
                  to="/account" 
                  className="hidden sm:block p-2 text-[#6B5048] hover:text-[#D05C23] transition-colors"
                  data-testid="nav-account"
                  aria-label="Account"
                >
                  <User size={22} weight="light" />
                </Link>
              ) : (
                <button
                  onClick={() => openAuthModal('login')}
                  className="hidden sm:block p-2 text-[#6B5048] hover:text-[#D05C23] transition-colors"
                  data-testid="nav-signin"
                  aria-label="Sign In"
                >
                  <User size={22} weight="light" />
                </button>
              )}

              {/* Cart */}
              <Link 
                to="/cart" 
                className="relative p-2 text-[#6B5048] hover:text-[#D05C23] transition-colors"
                data-testid="nav-cart"
                aria-label="Cart"
              >
                <ShoppingBag size={22} weight="light" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-[#D05C23] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-[#6B5048] hover:text-[#D05C23] transition-colors"
                data-testid="nav-mobile-toggle"
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X size={24} weight="light" /> : <List size={24} weight="light" />}
              </button>
            </div>
          </div>

          {/* Search Bar - Expandable */}
          <div className={`overflow-hidden transition-all duration-300 ${searchOpen ? 'max-h-20 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search our coffees..."
                className="w-full py-3 px-4 pr-12 bg-white border border-[#E6DCD1] focus:border-[#D05C23] focus:outline-none text-[#2C1A12] placeholder-[#6B5048]/60 font-body"
                data-testid="search-input"
              />
              <button 
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B5048] hover:text-[#D05C23] transition-colors"
              >
                <MagnifyingGlass size={20} weight="light" />
              </button>
            </form>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`lg:hidden overflow-hidden transition-all duration-500 ${
          mobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="bg-[#FDFBF7] border-t border-[#E6DCD1] px-4 py-6 space-y-1">
            {navLinks.map((link, index) => (
              <Link 
                key={link.to}
                to={link.to} 
                className="block py-3 text-[#2C1A12] font-body font-medium text-lg border-b border-[#E6DCD1]/50"
                onClick={() => setMobileMenuOpen(false)}
                data-testid={`mobile-nav-${link.label.toLowerCase().replace(' ', '-')}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {link.label}
              </Link>
            ))}
            
            <div className="pt-4 mt-4">
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/account" 
                    className="block py-3 text-[#2C1A12] font-body font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid="mobile-nav-account"
                  >
                    My Account
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="block w-full text-left py-3 text-[#D05C23] font-body font-medium"
                    data-testid="mobile-nav-logout"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => openAuthModal('login')}
                    className="flex-1 btn-secondary py-3"
                    data-testid="mobile-nav-signin"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => openAuthModal('register')}
                    className="flex-1 btn-primary py-3"
                    data-testid="mobile-nav-register"
                  >
                    Register
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
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
