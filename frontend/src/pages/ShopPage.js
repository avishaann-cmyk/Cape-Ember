import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FunnelSimple, X, MagnifyingGlass, CaretDown, GridFour, Rows } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import AuthModal from '../components/AuthModal';
import { setPageSEO } from '../lib/seo';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Filter options
const ROAST_OPTIONS = [
  { value: 'light', label: 'Light Roast' },
  { value: 'medium', label: 'Medium Roast' },
  { value: 'dark', label: 'Dark Roast' },
];

const STRENGTH_OPTIONS = [
  { value: '1', label: 'Mild (1)' },
  { value: '2', label: 'Light (2)' },
  { value: '3', label: 'Medium (3)' },
  { value: '4', label: 'Strong (4)' },
  { value: '5', label: 'Bold (5)' },
];

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
  { value: 'newest', label: 'Newest' },
];

const normalizeCategory = (rawCategory) => {
  if (!rawCategory) return 'all';
  if (rawCategory === 'single-origin' || rawCategory === 'blends') return 'single';
  if (rawCategory === 'single' || rawCategory === 'bundle' || rawCategory === 'all') return rawCategory;
  return 'all';
};

const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [activeFilters, setActiveFilters] = useState({
    category: normalizeCategory(searchParams.get('category')),
    roast: searchParams.get('roast') || '',
    strength: searchParams.get('strength') || '',
    priceRange: searchParams.get('price') || '',
  });
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'featured');

  useEffect(() => {
    setPageSEO({
      title: 'Shop Premium South African Coffee | Cape Ember Coffee Co.',
      description: 'Shop Fynbos Roast, Garden Route Blend, Karoo Horizon, and Ember Reserve. Premium coffee inspired by South African landscapes.',
      canonicalPath: '/shop',
      image: '/assets/cape-ember/cape-ember-garden-route-lifestyle.jpeg'
    });
    
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${API}/products`);
        const productsData = response.data.products || response.data;
        setProducts(Array.isArray(productsData) ? productsData : []);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
    
    return () => {};
  }, []);

  // Apply filters and sorting
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.flavor_notes?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (activeFilters.category === 'bundle') {
      result = result.filter(p => p.is_bundle);
    } else if (activeFilters.category === 'single') {
      result = result.filter(p => !p.is_bundle);
    }

    // Roast filter
    if (activeFilters.roast) {
      result = result.filter(p => p.roast_level === activeFilters.roast);
    }

    // Strength filter
    if (activeFilters.strength) {
      result = result.filter(p => p.strength === parseInt(activeFilters.strength));
    }

    // Price filter
    if (activeFilters.priceRange) {
      const [min, max] = activeFilters.priceRange.split('-').map(Number);
      result = result.filter(p => {
        const price = p.price;
        if (max) return price >= min && price <= max;
        return price >= min;
      });
    }

    // Sorting
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'newest':
        result.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
        break;
      default:
        // Featured - bundles first, then by name
        result.sort((a, b) => {
          if (a.is_bundle && !b.is_bundle) return -1;
          if (!a.is_bundle && b.is_bundle) return 1;
          return a.name.localeCompare(b.name);
        });
    }

    return result;
  }, [products, searchQuery, activeFilters, sortBy]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (activeFilters.category !== 'all') params.set('category', activeFilters.category);
    if (activeFilters.roast) params.set('roast', activeFilters.roast);
    if (activeFilters.strength) params.set('strength', activeFilters.strength);
    if (activeFilters.priceRange) params.set('price', activeFilters.priceRange);
    if (sortBy !== 'featured') params.set('sort', sortBy);
    setSearchParams(params, { replace: true });
  }, [searchQuery, activeFilters, sortBy, setSearchParams]);

  const updateFilter = (key, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: prev[key] === value ? '' : value
    }));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setActiveFilters({
      category: 'all',
      roast: '',
      strength: '',
      priceRange: '',
    });
    setSortBy('featured');
  };

  const hasActiveFilters = searchQuery || 
    activeFilters.category !== 'all' || 
    activeFilters.roast || 
    activeFilters.strength || 
    activeFilters.priceRange;

  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-20 md:pt-24">
      {/* Hero Header */}
      <div className="relative h-[40vh] min-h-[300px] flex items-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url('/assets/cape-ember/Garden%20Route%20Home.PNG')`
          }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full">
          <span className="text-[#C86333] text-sm tracking-[0.3em] uppercase block mb-3">Our Collection</span>
          <h1 className="font-heading text-4xl md:text-5xl text-white mb-4">
            Shop Coffee
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto">
            Premium small-batch roasted coffee beans, inspired by the landscapes of South Africa. 
            Complimentary delivery on orders over R399.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B5048]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search coffees..."
              className="w-full pl-12 pr-4 py-3 border border-[#E6DCD1] bg-white focus:border-[#D05C23] focus:outline-none text-[#2C1A12] placeholder-[#6B5048]/60"
              data-testid="shop-search"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B5048] hover:text-[#2C1A12]"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="md:hidden btn-secondary flex items-center justify-center gap-2"
          >
            <FunnelSimple size={20} />
            Filters
          </button>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none w-full md:w-48 px-4 py-3 pr-10 border border-[#E6DCD1] bg-white focus:border-[#D05C23] focus:outline-none text-[#2C1A12] cursor-pointer"
              data-testid="shop-sort"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <CaretDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B5048] pointer-events-none" />
          </div>

          {/* View Mode Toggle */}
          <div className="hidden md:flex border border-[#E6DCD1]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 transition-colors ${viewMode === 'grid' ? 'bg-[#2C1A12] text-white' : 'text-[#6B5048] hover:bg-[#F4EFE6]'}`}
              aria-label="Grid view"
            >
              <GridFour size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 transition-colors ${viewMode === 'list' ? 'bg-[#2C1A12] text-white' : 'text-[#6B5048] hover:bg-[#F4EFE6]'}`}
              aria-label="List view"
            >
              <Rows size={20} />
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-28 space-y-8">
              {/* Category */}
              <div>
                <h3 className="font-medium text-[#2C1A12] mb-4 flex items-center justify-between">
                  Category
                </h3>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'All Products' },
                    { value: 'single', label: 'Single Origin' },
                    { value: 'bundle', label: 'Bundles & Gift Sets' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => updateFilter('category', opt.value)}
                      className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
                        activeFilters.category === opt.value
                          ? 'bg-[#D05C23] text-white'
                          : 'text-[#6B5048] hover:bg-[#F4EFE6]'
                      }`}
                      data-testid={`filter-category-${opt.value}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Roast Level */}
              <div>
                <h3 className="font-medium text-[#2C1A12] mb-4">Roast Level</h3>
                <div className="space-y-2">
                  {ROAST_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => updateFilter('roast', opt.value)}
                      className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
                        activeFilters.roast === opt.value
                          ? 'bg-[#D05C23] text-white'
                          : 'text-[#6B5048] hover:bg-[#F4EFE6]'
                      }`}
                      data-testid={`filter-roast-${opt.value}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Strength */}
              <div>
                <h3 className="font-medium text-[#2C1A12] mb-4">Strength</h3>
                <div className="space-y-2">
                  {STRENGTH_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => updateFilter('strength', opt.value)}
                      className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
                        activeFilters.strength === opt.value
                          ? 'bg-[#D05C23] text-white'
                          : 'text-[#6B5048] hover:bg-[#F4EFE6]'
                      }`}
                      data-testid={`filter-strength-${opt.value}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="font-medium text-[#2C1A12] mb-4">Price</h3>
                <div className="space-y-2">
                  {[
                    { value: '0-150', label: 'Under R150' },
                    { value: '150-200', label: 'R150 - R200' },
                    { value: '200-300', label: 'R200 - R300' },
                    { value: '300', label: 'Over R300' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => updateFilter('priceRange', opt.value)}
                      className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
                        activeFilters.priceRange === opt.value
                          ? 'bg-[#D05C23] text-white'
                          : 'text-[#6B5048] hover:bg-[#F4EFE6]'
                      }`}
                      data-testid={`filter-price-${opt.value}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full btn-secondary text-sm"
                  data-testid="clear-filters"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Results Count & Active Filters */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <span className="text-[#6B5048]">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
              </span>
              
              {/* Active Filter Tags */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2">
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#F4EFE6] text-sm text-[#2C1A12]">
                      "{searchQuery}"
                      <button onClick={() => setSearchQuery('')} className="hover:text-[#D05C23]">
                        <X size={14} />
                      </button>
                    </span>
                  )}
                  {activeFilters.roast && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#F4EFE6] text-sm text-[#2C1A12]">
                      {ROAST_OPTIONS.find(o => o.value === activeFilters.roast)?.label}
                      <button onClick={() => updateFilter('roast', '')} className="hover:text-[#D05C23]">
                        <X size={14} />
                      </button>
                    </span>
                  )}
                  {activeFilters.strength && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#F4EFE6] text-sm text-[#2C1A12]">
                      Strength: {activeFilters.strength}
                      <button onClick={() => updateFilter('strength', '')} className="hover:text-[#D05C23]">
                        <X size={14} />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="spinner border-[#D05C23] border-t-transparent w-10 h-10" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-[#6B5048] mb-4">No products match your filters.</p>
                <button onClick={clearFilters} className="btn-primary">
                  Clear Filters
                </button>
              </div>
            ) : (
              <motion.div 
                className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'sm:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-1'
                } items-stretch`}
                layout
              >
                <AnimatePresence>
                  {filteredProducts.map((product, idx) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <ProductCard 
                        product={product} 
                        onAuthRequired={() => setAuthModalOpen(true)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween' }}
              className="fixed inset-y-0 right-0 w-80 bg-[#FDFBF7] z-50 md:hidden overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-heading text-xl text-[#2C1A12]">Filters</h2>
                  <button onClick={() => setMobileFiltersOpen(false)}>
                    <X size={24} className="text-[#6B5048]" />
                  </button>
                </div>

                {/* Mobile filter options - same as desktop */}
                <div className="space-y-6">
                  {/* Category */}
                  <div>
                    <h3 className="font-medium text-[#2C1A12] mb-3">Category</h3>
                    <div className="space-y-2">
                      {[
                        { value: 'all', label: 'All Products' },
                        { value: 'single', label: 'Single Origin' },
                        { value: 'bundle', label: 'Bundles & Gift Sets' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => updateFilter('category', opt.value)}
                          className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
                            activeFilters.category === opt.value
                              ? 'bg-[#D05C23] text-white'
                              : 'text-[#6B5048] hover:bg-[#F4EFE6]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Roast */}
                  <div>
                    <h3 className="font-medium text-[#2C1A12] mb-3">Roast Level</h3>
                    <div className="space-y-2">
                      {ROAST_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => updateFilter('roast', opt.value)}
                          className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
                            activeFilters.roast === opt.value
                              ? 'bg-[#D05C23] text-white'
                              : 'text-[#6B5048] hover:bg-[#F4EFE6]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Strength */}
                  <div>
                    <h3 className="font-medium text-[#2C1A12] mb-3">Strength</h3>
                    <div className="space-y-2">
                      {STRENGTH_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => updateFilter('strength', opt.value)}
                          className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
                            activeFilters.strength === opt.value
                              ? 'bg-[#D05C23] text-white'
                              : 'text-[#6B5048] hover:bg-[#F4EFE6]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Apply & Clear Buttons */}
                <div className="mt-8 space-y-3">
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="w-full btn-primary"
                  >
                    Show {filteredProducts.length} Products
                  </button>
                  {hasActiveFilters && (
                    <button
                      onClick={() => {
                        clearFilters();
                        setMobileFiltersOpen(false);
                      }}
                      className="w-full btn-secondary"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        initialMode="register"
      />
    </div>
  );
};

export default ShopPage;
