import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Minus, Plus, Coffee } from 'lucide-react';
import axios from 'axios';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from '../components/AuthModal';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ProductDetailPage = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, allRes] = await Promise.all([
          axios.get(`${API}/products/${productId}`),
          axios.get(`${API}/products`)
        ]);
        setProduct(productRes.data);
        // API returns {products: [...]} structure
        const productsData = allRes.data.products || allRes.data;
        setAllProducts(Array.isArray(productsData) ? productsData : []);
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [productId]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    setAdding(true);
    try {
      await addToCart(product.id, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="spinner w-8 h-8" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20">
        <p className="text-[#5C534C] mb-4">Product not found</p>
        <Link to="/shop" className="btn-primary">
          Back to Shop
        </Link>
      </div>
    );
  }

  const bundleProducts = product.is_bundle && product.bundle_items
    ? allProducts.filter(p => product.bundle_items.includes(p.id))
    : [];

  // Helper to get image URL from product (supports both old and new format)
  const getImageUrl = (p) => {
    if (!p) return '/placeholder-coffee.jpg';
    if (p.image_url) return p.image_url;
    if (p.images && p.images.length > 0) {
      const primary = p.images.find(img => img.is_primary);
      return primary?.url || p.images[0]?.url || '/placeholder-coffee.jpg';
    }
    return '/placeholder-coffee.jpg';
  };

  return (
    <div className="min-h-screen pt-20 md:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link 
          to="/shop" 
          className="inline-flex items-center gap-2 text-[#5C534C] hover:text-[#A94826] mb-8 transition-colors"
          data-testid="back-to-shop"
        >
          <ArrowLeft size={18} />
          Back to Shop
        </Link>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Image */}
          <div className="aspect-square bg-[#F2EEE8] overflow-hidden">
            <img
              src={getImageUrl(product)}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details */}
          <div className="animate-slide-in">
            {/* Badges */}
            <div className="flex gap-2 mb-4">
              {product.is_bundle && (
                <span className="badge badge-secondary">Bundle · Save R26</span>
              )}
              {product.id === 'karoo-horizon' && (
                <span className="badge badge-primary">Limited Edition</span>
              )}
            </div>

            <h1 className="font-heading text-4xl md:text-5xl text-[#2D2622] mb-2">
              {product.name}
            </h1>
            
            <p className="text-[#A94826] font-medium mb-4">{product.flavor_notes}</p>
            
            <p className="text-[#5C534C] text-lg mb-6">{product.description}</p>

            {/* Product Info */}
            <div className="grid grid-cols-2 gap-4 mb-8 py-6 border-y border-[#E5DCD0]">
              <div>
                <span className="overline text-[#5C534C] block mb-1">Roast Level</span>
                <span className="font-medium text-[#2D2622]">{product.roast_level}</span>
              </div>
              <div>
                <span className="overline text-[#5C534C] block mb-1">Weight</span>
                <span className="font-medium text-[#2D2622]">{product.weight}</span>
              </div>
            </div>

            {/* Bundle contents */}
            {product.is_bundle && bundleProducts.length > 0 && (
              <div className="mb-8">
                <span className="overline text-[#5C534C] block mb-3">What's Included</span>
                <ul className="space-y-2">
                  {bundleProducts.map(p => (
                    <li key={p.id} className="flex items-center gap-2 text-[#5C534C]">
                      <Coffee size={16} className="text-[#A94826]" />
                      <strong className="text-[#2D2622]">{p.name}</strong> — {p.flavor_notes}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Price */}
            <div className="mb-6">
              <span className="font-heading text-4xl text-[#A94826]">
                R {product.price.toFixed(2)}
              </span>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-6">
              <span className="overline text-[#5C534C]">Quantity</span>
              <div className="flex items-center">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="qty-btn"
                  data-testid="qty-decrease"
                >
                  <Minus size={16} />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="qty-btn"
                  data-testid="qty-increase"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className={`w-full py-4 flex items-center justify-center gap-2 font-semibold tracking-wide transition-all ${
                added 
                  ? 'bg-[#388E3C] text-white' 
                  : 'btn-primary'
              }`}
              data-testid="add-to-cart-btn"
            >
              {adding ? (
                <span className="spinner border-white border-t-transparent" />
              ) : added ? (
                'Added to Cart!'
              ) : (
                <>
                  <ShoppingBag size={20} />
                  Add to Cart — R {(product.price * quantity).toFixed(2)}
                </>
              )}
            </button>

            {/* Shipping info */}
            <p className="text-center text-sm text-[#5C534C] mt-4">
              Free delivery on orders over R399
            </p>
          </div>
        </div>
      </div>

      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        initialMode="register"
      />
    </div>
  );
};

export default ProductDetailPage;
