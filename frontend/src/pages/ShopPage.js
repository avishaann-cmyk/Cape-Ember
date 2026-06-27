import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import AuthModal from '../components/AuthModal';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ShopPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${API}/products`);
        // API returns {products: [...]} structure
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
  }, []);

  const filteredProducts = filter === 'all' 
    ? products 
    : filter === 'bundle' 
      ? products.filter(p => p.is_bundle)
      : products.filter(p => !p.is_bundle);

  return (
    <div className="min-h-screen pt-20 md:pt-24">
      {/* Header */}
      <div className="bg-[#F2EEE8] section-padding">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="overline text-[#A94826] mb-2 block">Shop</span>
          <h1 className="font-heading text-4xl md:text-5xl text-[#2D2622] mb-4">
            Our Coffee Collection
          </h1>
          <p className="text-[#5C534C] max-w-2xl mx-auto">
            Premium small-batch roasted coffee beans, inspired by the landscapes of South Africa. 
            Free delivery on orders over R399.
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center gap-4">
          {[
            { value: 'all', label: 'All Products' },
            { value: 'single', label: 'Single Origin' },
            { value: 'bundle', label: 'Bundles' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-6 py-2 text-sm font-medium tracking-wide transition-all ${
                filter === value 
                  ? 'bg-[#2D2622] text-white' 
                  : 'bg-transparent text-[#5C534C] border border-[#E5DCD0] hover:border-[#2D2622]'
              }`}
              data-testid={`filter-${value}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner w-8 h-8" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, idx) => (
              <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                <ProductCard 
                  product={product} 
                  onAuthRequired={() => setAuthModalOpen(true)}
                />
              </div>
            ))}
          </div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#5C534C]">No products found.</p>
          </div>
        )}
      </div>

      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        initialMode="register"
      />
    </div>
  );
};

export default ShopPage;
