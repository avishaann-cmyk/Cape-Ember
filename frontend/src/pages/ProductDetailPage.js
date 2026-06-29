import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Minus, Plus, Heart, Share, Coffee, Timer, Thermometer, Drop, Star, Check } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from '../components/AuthModal';
import ProductCard from '../components/ProductCard';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Strength Meter Component
const StrengthMeter = ({ strength = 3, maxStrength = 5 }) => (
  <div className="flex items-center gap-2">
    <span className="text-xs text-[#6B5048] tracking-wide uppercase">Strength</span>
    <div className="flex gap-1">
      {[...Array(maxStrength)].map((_, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full transition-colors ${
            i < strength ? 'bg-[#C86333]' : 'bg-[#E6DCD1]'
          }`}
        />
      ))}
    </div>
  </div>
);

// Tasting Note Component
const TastingNote = ({ note, intensity }) => (
  <div className="flex items-center justify-between py-2 border-b border-[#E6DCD1] last:border-0">
    <span className="text-[#2C1A12] font-medium">{note}</span>
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${
            i < intensity ? 'bg-[#C86333]' : 'bg-[#E6DCD1]'
          }`}
        />
      ))}
    </div>
  </div>
);

// Brewing Method Card
const BrewingMethodCard = ({ method, description, ratio, time, temperature }) => (
  <div className="bg-[#F4EFE6] p-5 border border-[#E6DCD1]">
    <h4 className="font-heading text-lg text-[#2C1A12] mb-2">{method}</h4>
    <p className="text-sm text-[#6B5048] mb-4">{description}</p>
    <div className="grid grid-cols-3 gap-2 text-center">
      <div>
        <Drop size={16} className="mx-auto text-[#C86333] mb-1" />
        <span className="text-xs text-[#6B5048] block">Ratio</span>
        <span className="text-sm font-medium text-[#2C1A12]">{ratio}</span>
      </div>
      <div>
        <Timer size={16} className="mx-auto text-[#C86333] mb-1" />
        <span className="text-xs text-[#6B5048] block">Time</span>
        <span className="text-sm font-medium text-[#2C1A12]">{time}</span>
      </div>
      <div>
        <Thermometer size={16} className="mx-auto text-[#C86333] mb-1" />
        <span className="text-xs text-[#6B5048] block">Temp</span>
        <span className="text-sm font-medium text-[#2C1A12]">{temperature}</span>
      </div>
    </div>
  </div>
);

// Review Stars
const ReviewStars = ({ rating }) => (
  <div className="flex gap-0.5">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={16}
        weight={i < rating ? 'fill' : 'regular'}
        className={i < rating ? 'text-[#C86333]' : 'text-[#E6DCD1]'}
      />
    ))}
  </div>
);

const ProductDetailPage = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [zoomActive, setZoomActive] = useState(false);

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
        const productsData = allRes.data.products || allRes.data;
        setAllProducts(Array.isArray(productsData) ? productsData : []);
        
        // Set default variant
        if (productRes.data.variants?.length > 0) {
          setSelectedVariant(productRes.data.variants[0]);
        }
        
        // Update document title for SEO
        document.title = `${productRes.data.name} | Cape Ember Coffee Co.`;
        
        // Update meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
          metaDesc.setAttribute('content', productRes.data.short_description || productRes.data.description?.substring(0, 160));
        }
        
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    window.scrollTo(0, 0);
    
    // Reset title on unmount
    return () => {
      document.title = 'Cape Ember Coffee Co. | Premium South African Coffee';
    };
  }, [productId]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    setAdding(true);
    try {
      await addToCart(product.id, quantity, selectedVariant?.id);
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
        <div className="spinner border-[#D05C23] border-t-transparent w-10 h-10" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20">
        <p className="text-[#6B5048] mb-4">Product not found</p>
        <Link to="/shop" className="btn-primary">Back to Shop</Link>
      </div>
    );
  }

  // Get all images
  const images = product.images?.length > 0 
    ? product.images 
    : [{ url: product.image_url || '/placeholder-coffee.jpg', alt: product.name, is_primary: true }];

  // Related products (same category, exclude current)
  const relatedProducts = allProducts
    .filter(p => p.id !== product.id && !p.is_bundle)
    .slice(0, 4);

  // Bundle products
  const bundleProducts = product.is_bundle && product.bundle_items
    ? allProducts.filter(p => product.bundle_items.includes(p.id))
    : [];

  // Current price based on selected variant
  const currentPrice = selectedVariant?.price || product.price;
  const stockQuantity = selectedVariant?.stock_quantity ?? product.stock_quantity ?? 50;
  const inStock = stockQuantity > 0;

  // Product Schema JSON-LD for SEO
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": images[0]?.url,
    "brand": {
      "@type": "Brand",
      "name": "Cape Ember Coffee Co."
    },
    "offers": {
      "@type": "Offer",
      "url": `https://capeembercoffee.co.za/product/${product.slug}`,
      "priceCurrency": "ZAR",
      "price": currentPrice,
      "availability": inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Cape Ember Coffee Co."
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.7",
      "reviewCount": "23"
    }
  };

  // Mock reviews (in production, fetch from API)
  const reviews = [
    { id: 1, author: 'Sarah M.', location: 'Cape Town', rating: 5, date: '2 weeks ago', text: 'Absolutely love this coffee! The flavor notes are spot on and it makes the perfect morning cup.' },
    { id: 2, author: 'David K.', location: 'Johannesburg', rating: 5, date: '1 month ago', text: 'Best coffee I\'ve had in years. Will definitely be ordering again.' },
    { id: 3, author: 'Lisa P.', location: 'Durban', rating: 4, date: '1 month ago', text: 'Great quality and fast delivery. The tasting notes are accurate.' },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-20 md:pt-24">
      {/* Product Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center gap-2 text-sm text-[#6B5048]">
          <Link to="/" className="hover:text-[#D05C23] transition-colors">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-[#D05C23] transition-colors">Shop</Link>
          <span>/</span>
          <span className="text-[#2C1A12]">{product.name}</span>
        </nav>
      </div>

      {/* Main Product Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image with Zoom */}
            <motion.div 
              className="aspect-square bg-[#F4EFE6] overflow-hidden relative cursor-zoom-in"
              onClick={() => setZoomActive(!zoomActive)}
              layoutId="product-image"
            >
              <motion.img
                src={images[selectedImage]?.url}
                alt={images[selectedImage]?.alt || product.name}
                className="w-full h-full object-cover"
                initial={{ scale: 1 }}
                animate={{ scale: zoomActive ? 1.5 : 1 }}
                transition={{ duration: 0.3 }}
              />
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.is_bundle && (
                  <span className="luxury-badge bg-[#2C1A12] text-white border-0">Bundle</span>
                )}
                {product.id === 'karoo-horizon' && (
                  <span className="luxury-badge">Limited Edition</span>
                )}
                {!inStock && (
                  <span className="luxury-badge bg-[#C53030] text-white border-0">Sold Out</span>
                )}
              </div>
            </motion.div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="flex gap-3">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-20 h-20 border-2 transition-colors ${
                      selectedImage === index ? 'border-[#D05C23]' : 'border-transparent'
                    }`}
                  >
                    <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            {/* Header */}
            <div className="mb-6">
              <span className="overline block mb-2">{product.origin || 'Single Origin'}</span>
              <h1 className="font-heading text-4xl lg:text-5xl text-[#2C1A12] mb-3">
                {product.name}
              </h1>
              <p className="text-[#C86333] font-medium text-lg">{product.flavor_notes}</p>
            </div>

            {/* Strength & Rating */}
            <div className="flex items-center justify-between py-4 border-y border-[#E6DCD1] mb-6">
              <StrengthMeter strength={product.strength || 3} />
              <div className="flex items-center gap-2">
                <ReviewStars rating={5} />
                <span className="text-sm text-[#6B5048]">({reviews.length} reviews)</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-[#6B5048] leading-relaxed mb-6">
              {product.description}
            </p>

            {/* Variants Selection */}
            {product.variants?.length > 0 && (
              <div className="mb-6">
                <span className="block text-sm font-medium text-[#2C1A12] mb-3">Size & Grind</span>
                <div className="grid grid-cols-2 gap-3">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`p-3 border text-left transition-all ${
                        selectedVariant?.id === variant.id
                          ? 'border-[#D05C23] bg-[#D05C23]/5'
                          : 'border-[#E6DCD1] hover:border-[#D05C23]/50'
                      }`}
                      disabled={variant.stock_quantity === 0}
                    >
                      <span className="block text-sm font-medium text-[#2C1A12]">{variant.name}</span>
                      <span className="block text-sm text-[#6B5048]">R {variant.price.toFixed(2)}</span>
                      {variant.stock_quantity === 0 && (
                        <span className="text-xs text-[#C53030]">Out of stock</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-4 mb-6">
              <span className="font-heading text-4xl text-[#2C1A12]">
                R {currentPrice.toFixed(2)}
              </span>
              {product.is_bundle && (
                <span className="text-[#6B5048] line-through">
                  R {(currentPrice * 1.2).toFixed(2)}
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2 mb-6">
              {inStock ? (
                <>
                  <Check size={18} className="text-[#2F855A]" />
                  <span className="text-sm text-[#2F855A]">
                    In Stock {stockQuantity <= 10 && `(Only ${stockQuantity} left)`}
                  </span>
                </>
              ) : (
                <span className="text-sm text-[#C53030]">Out of Stock</span>
              )}
            </div>

            {/* Quantity & Add to Cart */}
            <div className="flex gap-4 mb-6">
              <div className="flex items-center border border-[#E6DCD1]">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-[#F4EFE6] transition-colors"
                  data-testid="qty-decrease"
                >
                  <Minus size={18} />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(stockQuantity, quantity + 1))}
                  className="p-3 hover:bg-[#F4EFE6] transition-colors"
                  data-testid="qty-increase"
                >
                  <Plus size={18} />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={adding || !inStock}
                className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium tracking-wide transition-all ${
                  added 
                    ? 'bg-[#2F855A] text-white' 
                    : !inStock
                    ? 'bg-[#E6DCD1] text-[#6B5048] cursor-not-allowed'
                    : 'btn-primary'
                }`}
                data-testid="add-to-cart-btn"
              >
                {adding ? (
                  <span className="spinner border-white border-t-transparent w-5 h-5" />
                ) : added ? (
                  'Added to Cart!'
                ) : !inStock ? (
                  'Out of Stock'
                ) : (
                  <>
                    <ShoppingBag size={20} weight="light" />
                    Add to Cart — R {(currentPrice * quantity).toFixed(2)}
                  </>
                )}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-8">
              <button className="flex-1 btn-secondary flex items-center justify-center gap-2">
                <Heart size={18} weight="light" />
                Add to Wishlist
              </button>
              <button className="flex-1 btn-secondary flex items-center justify-center gap-2">
                <Share size={18} weight="light" />
                Share
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 py-6 border-t border-[#E6DCD1]">
              <div className="text-center">
                <span className="text-lg mb-1 block">🚚</span>
                <span className="text-xs text-[#6B5048]">Free delivery over R399</span>
              </div>
              <div className="text-center">
                <span className="text-lg mb-1 block">☕</span>
                <span className="text-xs text-[#6B5048]">Roasted within 48hrs</span>
              </div>
              <div className="text-center">
                <span className="text-lg mb-1 block">↩️</span>
                <span className="text-xs text-[#6B5048]">30-day returns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bundle Contents */}
        {product.is_bundle && bundleProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="font-heading text-2xl text-[#2C1A12] mb-6">What's Included</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {bundleProducts.map(p => (
                <Link 
                  key={p.id} 
                  to={`/product/${p.slug || p.id}`}
                  className="flex items-center gap-4 p-4 bg-[#F4EFE6] hover:bg-[#E6DCD1] transition-colors"
                >
                  <img 
                    src={p.images?.[0]?.url || p.image_url} 
                    alt={p.name} 
                    className="w-16 h-16 object-cover"
                  />
                  <div>
                    <span className="font-medium text-[#2C1A12] block">{p.name}</span>
                    <span className="text-sm text-[#6B5048]">{p.flavor_notes}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Tabs: Details, Brewing, Reviews */}
        <div className="mt-16">
          <div className="flex border-b border-[#E6DCD1]">
            {[
              { id: 'details', label: 'Tasting Notes' },
              { id: 'brewing', label: 'Brewing Guide' },
              { id: 'reviews', label: `Reviews (${reviews.length})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium tracking-wide transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-[#2C1A12]'
                    : 'text-[#6B5048] hover:text-[#2C1A12]'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D05C23]"
                  />
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="py-8"
            >
              {activeTab === 'details' && (
                <div className="grid md:grid-cols-2 gap-12">
                  <div>
                    <h3 className="font-heading text-xl text-[#2C1A12] mb-4">Flavor Profile</h3>
                    {product.tasting_notes?.length > 0 ? (
                      <div className="space-y-1">
                        {product.tasting_notes.map((note, i) => (
                          <TastingNote key={i} note={note.note} intensity={note.intensity} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-[#6B5048]">{product.flavor_notes}</p>
                    )}
                  </div>
                  <div>
                    <h3 className="font-heading text-xl text-[#2C1A12] mb-4">Origin & Processing</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-[#E6DCD1]">
                        <span className="text-[#6B5048]">Origin</span>
                        <span className="text-[#2C1A12] font-medium">{product.origin || 'South America'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-[#E6DCD1]">
                        <span className="text-[#6B5048]">Roast Level</span>
                        <span className="text-[#2C1A12] font-medium capitalize">{product.roast_level || 'Medium'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-[#E6DCD1]">
                        <span className="text-[#6B5048]">Processing</span>
                        <span className="text-[#2C1A12] font-medium">Washed</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-[#6B5048]">Altitude</span>
                        <span className="text-[#2C1A12] font-medium">1,200 - 1,800m</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'brewing' && (
                <div>
                  <p className="text-[#6B5048] mb-8 max-w-2xl">
                    The perfect cup starts with the right method. Here are our recommended brewing guides for {product.name}.
                  </p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {product.brewing_methods?.length > 0 ? (
                      product.brewing_methods.map((method, i) => (
                        <BrewingMethodCard key={i} {...method} />
                      ))
                    ) : (
                      <>
                        <BrewingMethodCard method="French Press" description="Full-bodied extraction" ratio="1:15" time="4 min" temperature="93°C" />
                        <BrewingMethodCard method="Pour Over" description="Clean, bright cup" ratio="1:16" time="3 min" temperature="92°C" />
                        <BrewingMethodCard method="AeroPress" description="Smooth concentrate" ratio="1:12" time="1.5 min" temperature="88°C" />
                      </>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <span className="font-heading text-5xl text-[#2C1A12]">4.9</span>
                      <div>
                        <ReviewStars rating={5} />
                        <span className="text-sm text-[#6B5048]">Based on {reviews.length} reviews</span>
                      </div>
                    </div>
                    <button className="btn-secondary">Write a Review</button>
                  </div>
                  <div className="space-y-6">
                    {reviews.map(review => (
                      <div key={review.id} className="border-b border-[#E6DCD1] pb-6 last:border-0">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-medium text-[#2C1A12]">{review.author}</span>
                            <span className="text-sm text-[#6B5048] ml-2">{review.location}</span>
                          </div>
                          <span className="text-sm text-[#6B5048]">{review.date}</span>
                        </div>
                        <ReviewStars rating={review.rating} />
                        <p className="text-[#6B5048] mt-3">{review.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-16 border-t border-[#E6DCD1]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-heading text-2xl text-[#2C1A12]">You May Also Like</h2>
              <Link to="/shop" className="text-sm text-[#D05C23] hover:underline">View All</Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} onAuthRequired={() => setAuthModalOpen(true)} />
              ))}
            </div>
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

export default ProductDetailPage;
