import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Coffee, Truck, Star, Leaf, Fire, Package, CaretLeft, CaretRight, ShieldCheck, Medal, CreditCard, Users, GoogleLogo, Quotes } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import AuthModal from '../components/AuthModal';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Premium hero images
const HERO_IMAGE = "https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?auto=format&fit=crop&w=2000&q=80";

// South African Landscape Images for Story Carousel
const LANDSCAPE_IMAGES = [
  {
    url: "https://customer-assets.emergentagent.com/job_axis-creator/artifacts/iu170te7_8FCEC634-E08A-49A5-B9F5-A1FADCEE6008.png",
    alt: "Cape Ember - South African Landscape",
    caption: "Our Story"
  },
  {
    url: "https://customer-assets.emergentagent.com/job_axis-creator/artifacts/vkx5y4m0_IMG_6527.jpeg",
    alt: "Karoo sunset with campfire - South African landscape",
    caption: "The Karoo"
  },
  {
    url: "https://customer-assets.emergentagent.com/job_axis-creator/artifacts/ho8c9nic_IMG_6530.jpeg",
    alt: "Karoo windmill landscape - South African plains",
    caption: "Karoo Horizon"
  },
  {
    url: "https://customer-assets.emergentagent.com/job_axis-creator/artifacts/uyhgy2rt_IMG_6529.jpeg",
    alt: "Golden sunset beach - South African coastline",
    caption: "The Wild Coast"
  },
  {
    url: "https://customer-assets.emergentagent.com/job_axis-creator/artifacts/mrw0wk8a_IMG_6536.jpeg",
    alt: "Rocky coastline with surfers - Garden Route",
    caption: "Garden Route"
  },
  {
    url: "https://customer-assets.emergentagent.com/job_axis-creator/artifacts/ny52w6fh_IMG_6535.jpeg",
    alt: "Kaaimans River Bridge - Wilderness",
    caption: "Wilderness"
  }
];

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [testimonials, setTestimonials] = useState([]);

  // SEO metadata
  useEffect(() => {
    document.title = 'Cape Ember Coffee Co. | Premium South African Coffee';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = 'Premium small-batch coffee inspired by South African landscapes. Experience handcrafted blends from partners we trust. Nationwide delivery.';
  }, []);

  // Auto-rotate carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % LANDSCAPE_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % LANDSCAPE_IMAGES.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + LANDSCAPE_IMAGES.length) % LANDSCAPE_IMAGES.length);
  };

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axios.get(`${API}/reviews/public?limit=6`);
        setTestimonials(Array.isArray(response.data?.reviews) ? response.data.reviews : []);
      } catch (error) {
        setTestimonials([]);
      }
    };
    fetchReviews();
  }, []);

  const individualProducts = products.filter(p => !p.is_bundle);
  const bundle = products.find(p => p.is_bundle);

  const getImageUrl = (product) => {
    if (!product) return '/placeholder-coffee.jpg';
    if (product.image_url) return product.image_url;
    if (product.images && product.images.length > 0) {
      const primary = product.images.find(img => img.is_primary);
      return primary?.url || product.images[0]?.url || '/placeholder-coffee.jpg';
    }
    return '/placeholder-coffee.jpg';
  };

  const features = [
    { icon: Truck, title: 'Nationwide Delivery', desc: 'Reliable courier delivery across South Africa' },
    { icon: ShieldCheck, title: 'Secure Checkout', desc: 'Safe encrypted payments with trusted gateways' },
    { icon: Fire, title: 'Small-Batch Roasted', desc: 'Crafted with trusted roasting partners' },
    { icon: Coffee, title: 'Whole Bean or Ground', desc: 'Choose your grind option at checkout' },
    { icon: Package, title: 'Freshly Packed', desc: 'Packed for freshness and shipped quickly' },
  ];

  const landscapeProfiles = [
    { name: 'Fynbos Roast', profile: 'Smooth • Nutty • Balanced' },
    { name: 'Garden Route Blend', profile: 'Smooth • Cocoa • Gentle Citrus' },
    { name: 'Karoo Horizon', profile: 'Floral • Blueberry • Bright' },
    { name: 'Ember Reserve', profile: 'Rich • Dark Chocolate • Intense' },
  ];

  const googleReviewStats = {
    rating: testimonials.length ? (testimonials.reduce((sum, t) => sum + Number(t.rating || 0), 0) / testimonials.length) : 0,
    totalReviews: testimonials.length,
    distribution: [
      { stars: 5, percentage: testimonials.length ? Math.round((testimonials.filter(t => Number(t.rating) === 5).length / testimonials.length) * 100) : 0 },
      { stars: 4, percentage: testimonials.length ? Math.round((testimonials.filter(t => Number(t.rating) === 4).length / testimonials.length) * 100) : 0 },
      { stars: 3, percentage: testimonials.length ? Math.round((testimonials.filter(t => Number(t.rating) === 3).length / testimonials.length) * 100) : 0 },
      { stars: 2, percentage: testimonials.length ? Math.round((testimonials.filter(t => Number(t.rating) === 2).length / testimonials.length) * 100) : 0 },
      { stars: 1, percentage: testimonials.length ? Math.round((testimonials.filter(t => Number(t.rating) === 1).length / testimonials.length) * 100) : 0 },
    ]
  };

  // Brewing method icons for the section
  const brewingMethods = [
    { name: 'French Press', icon: '☕', time: '4 min' },
    { name: 'Pour Over', icon: '💧', time: '3 min' },
    { name: 'Espresso', icon: '⚡', time: '25 sec' },
    { name: 'Cold Brew', icon: '❄️', time: '12-24 hrs' },
    { name: 'AeroPress', icon: '🔄', time: '1.5 min' },
    { name: 'Moka Pot', icon: '🔥', time: '5 min' },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center" data-testid="hero-section">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${HERO_IMAGE}')` }}
        >
          <div className="absolute inset-0 hero-overlay" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <motion.div 
            className="max-w-2xl"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.span 
              className="inline-block text-white/80 text-sm tracking-[0.3em] uppercase mb-6"
              variants={fadeInUp}
            >
              Premium Small-Batch Coffee · South Africa
            </motion.span>
            
            <motion.h1 
              className="font-heading text-5xl sm:text-6xl lg:text-7xl text-white leading-none mb-8"
              variants={fadeInUp}
            >
              South African Landscapes
              <br />
              <span className="text-gradient bg-gradient-to-r from-[#D05C23] to-[#C86333] bg-clip-text text-transparent">
                in Every Cup
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-white/90 text-lg sm:text-xl max-w-lg mb-10 leading-relaxed font-light"
              variants={fadeInUp}
            >
              Premium coffee crafted with trusted roasting partners and inspired by the landscapes we love — from fynbos-covered mountains to coastal roads, Karoo horizons, and ember-lit evenings.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4"
              variants={fadeInUp}
            >
              <Link 
                to="/shop" 
                className="btn-primary inline-flex items-center gap-3 group"
                data-testid="hero-shop-btn"
              >
                Shop Coffee
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                to="/brew-guide" 
                className="btn-secondary-light"
                data-testid="hero-story-btn"
              >
                Find Your Roast
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/60">
          <span className="text-xs tracking-[0.2em] uppercase">Scroll</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-white/60 to-transparent" />
        </div>
      </section>

      {/* Features Strip */}
      <section className="bg-[#0B0705] py-6" data-testid="features-strip">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 text-white/90"
              >
                <feature.icon size={24} weight="light" className="text-[#C86333] flex-shrink-0" />
                <div>
                  <span className="block text-sm font-medium">{feature.title}</span>
                  <span className="block text-xs text-white/60">{feature.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Choose Your Landscape */}
      <section className="py-14 bg-[#F3E4CC]" data-testid="landscape-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="overline block mb-3">Choose Your Landscape</span>
            <h2 className="font-heading text-4xl sm:text-5xl text-[#15110E]">Find Your Signature Roast</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {landscapeProfiles.map((item) => (
              <div key={item.name} className="bg-white border border-[#D7B98C] p-5">
                <p className="font-heading text-2xl text-[#3A2418] mb-2">{item.name}</p>
                <p className="text-[#6F7A52] text-sm tracking-wide">{item.profile}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Coffees Section */}
      <section className="section-padding-lg" data-testid="products-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="overline block mb-4">Our Collection</span>
            <h2 className="font-heading text-4xl sm:text-5xl text-[#2C1A12] mb-6">
              Exceptional Coffees
            </h2>
            <div className="divider mx-auto" />
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="spinner border-[#D05C23] border-t-transparent" />
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {individualProducts.map((product, index) => (
                <motion.div key={product.id} variants={fadeInUp}>
                  <ProductCard product={product} onAuthRequired={() => setAuthModalOpen(true)} />
                </motion.div>
              ))}
            </motion.div>
          )}

          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <Link 
              to="/shop" 
              className="inline-flex items-center gap-2 text-[#D05C23] font-medium hover:gap-4 transition-all link-underline"
              data-testid="view-all-products"
            >
              View All Products
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Featured Bundle - Asymmetric Layout */}
      {bundle && (
        <section className="section-padding bg-[#F4EFE6]" data-testid="bundle-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <motion.div 
                className="order-2 lg:order-1"
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <span className="overline block mb-4">Best Value</span>
                <h2 className="font-heading text-4xl sm:text-5xl text-[#2C1A12] mb-6">
                  {bundle.name}
                </h2>
                <p className="text-[#6B5048] text-lg leading-relaxed mb-8">
                  {bundle.description || 'Experience all four of our signature roasts in one beautifully curated collection. Perfect for discovering your new favourite or as a gift for the coffee lover in your life.'}
                </p>
                <div className="flex items-baseline gap-4 mb-8">
                  <span className="text-4xl font-heading text-[#2C1A12]">
                    R {bundle.price?.toFixed(2)}
                  </span>
                  <span className="text-[#6B5048] line-through">
                    R {(bundle.price * 1.2)?.toFixed(2)}
                  </span>
                  <span className="luxury-badge">Save 20%</span>
                </div>
                <Link 
                  to={`/product/${bundle.slug || bundle.id}`}
                  className="btn-primary inline-flex items-center gap-3"
                  data-testid="bundle-cta"
                >
                  View Bundle
                  <ArrowRight size={18} />
                </Link>
              </motion.div>
              
              <motion.div 
                className="order-1 lg:order-2"
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div className="aspect-square bg-[#FDFBF7] overflow-hidden">
                  <img
                    src={getImageUrl(bundle)}
                    alt={bundle.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* Our Story Section */}
      <section className="section-padding-lg" data-testid="story-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative">
                {/* Image Carousel */}
                <div className="aspect-[4/5] overflow-hidden relative group">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={currentImageIndex}
                      src={LANDSCAPE_IMAGES[currentImageIndex].url}
                      alt={LANDSCAPE_IMAGES[currentImageIndex].alt}
                      className="w-full h-full object-cover"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    />
                  </AnimatePresence>
                  
                  {/* Navigation Arrows */}
                  <button 
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Previous image"
                  >
                    <CaretLeft size={20} className="text-[#2C1A12]" />
                  </button>
                  <button 
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Next image"
                  >
                    <CaretRight size={20} className="text-[#2C1A12]" />
                  </button>
                  
                  {/* Dots Indicator */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {LANDSCAPE_IMAGES.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === currentImageIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80'
                        }`}
                        aria-label={`Go to image ${idx + 1}`}
                      />
                    ))}
                  </div>
                  
                  {/* Caption */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
                    <span className="text-white text-sm tracking-wide uppercase">
                      {LANDSCAPE_IMAGES[currentImageIndex].caption}
                    </span>
                  </div>
                </div>
                
                {/* Floating Badge */}
                <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-[#D05C23] flex items-center justify-center text-white p-6 z-10">
                  <div className="text-center">
                    <span className="block text-3xl font-heading">From</span>
                    <span className="text-sm tracking-wide">Landscape<br/>to Cup</span>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="overline block mb-4">The Cape Ember Experience</span>
              <h2 className="font-heading text-4xl sm:text-5xl text-[#2C1A12] mb-6">
                From Landscape<br/>to Cup
              </h2>
              <div className="space-y-4 text-[#6B5048] leading-relaxed mb-8">
                <p>
                  Cape Ember Coffee Co. was created to bring the feeling of South Africa&apos;s landscapes into the everyday coffee ritual.
                </p>
                <p>
                  We work with trusted roasting partners to craft premium coffee experiences inspired by the places we love.
                </p>
              </div>
              <Link 
                to="/about"
                className="btn-secondary inline-flex items-center gap-3"
                data-testid="story-cta"
              >
                Discover Our Story
                <ArrowRight size={18} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof - Google Style Reviews */}
      {testimonials.length > 0 && (
      <section className="section-padding bg-[#2C1A12]" data-testid="testimonials-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-[#C86333] text-sm tracking-[0.3em] uppercase block mb-4">
              Verified Reviews
            </span>
            <h2 className="font-heading text-4xl sm:text-5xl text-white mb-4">
              Loved by Coffee Enthusiasts
            </h2>
            <p className="text-white/60 text-lg max-w-xl mx-auto">
              Join hundreds of satisfied customers who&apos;ve discovered their perfect cup
            </p>
          </motion.div>

          {/* Google-Style Review Summary */}
          <motion.div 
            className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 mb-10 max-w-lg mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <span className="text-5xl font-heading text-white block">{googleReviewStats.rating.toFixed(1)}</span>
                <div className="flex gap-0.5 justify-center my-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={20} weight="fill" className="text-[#FBBC04]" />
                  ))}
                </div>
                <span className="text-white/60 text-sm">{googleReviewStats.totalReviews} reviews</span>
              </div>
              <div className="w-px h-24 bg-white/20" />
              <div className="space-y-1">
                {googleReviewStats.distribution.map((d) => (
                  <div key={d.stars} className="flex items-center gap-2 text-xs">
                    <span className="text-white/60 w-3">{d.stars}</span>
                    <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#FBBC04] rounded-full" 
                        style={{ width: `${d.percentage}%` }}
                      />
                    </div>
                    <span className="text-white/40 w-8">{d.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Review Carousel */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div 
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 p-6"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#D05C23] flex items-center justify-center text-white font-medium">
                    {(testimonial.user_name || 'C').charAt(0)}
                  </div>
                  <div>
                    <span className="block text-white font-medium text-sm">{testimonial.user_name}</span>
                    <span className="text-white/50 text-xs">Customer Review</span>
                  </div>
                  {testimonial.is_verified_purchase && (
                    <span className="ml-auto flex items-center gap-1 text-[#2F855A] text-xs">
                      <ShieldCheck size={14} weight="fill" />
                      Verified
                    </span>
                  )}
                </div>
                <div className="flex gap-0.5 mb-3">
                  {[...Array(Number(testimonial.rating || 0))].map((_, i) => (
                    <Star key={i} size={14} weight="fill" className="text-[#FBBC04]" />
                  ))}
                </div>
                <p className="text-white/80 text-sm leading-relaxed">
                  &ldquo;{testimonial.content}&rdquo;
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Brewing Methods Section */}
      <section className="section-padding" data-testid="brewing-methods-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="overline block mb-4">How to Brew</span>
            <h2 className="font-heading text-4xl sm:text-5xl text-[#2C1A12] mb-4">
              Your Perfect Cup Awaits
            </h2>
            <p className="text-[#6B5048] max-w-xl mx-auto">
              Our coffees are crafted to shine with any brewing method. Here are our favorites.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {brewingMethods.map((method, index) => (
              <motion.div
                key={method.name}
                className="text-center p-6 bg-[#F4EFE6] hover:bg-[#E6DCD1] transition-colors"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <span className="text-3xl mb-3 block">{method.icon}</span>
                <span className="font-medium text-[#2C1A12] text-sm block">{method.name}</span>
                <span className="text-xs text-[#6B5048]">{method.time}</span>
              </motion.div>
            ))}
          </div>

          <motion.div 
            className="text-center mt-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Link 
              to="/brew-guide" 
              className="inline-flex items-center gap-2 text-[#D05C23] font-medium hover:gap-4 transition-all link-underline"
            >
              View Full Brew Guide
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="section-padding bg-[#F4EFE6]" data-testid="newsletter-section">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="overline block mb-4">Join the Ember Circle</span>
            <h2 className="font-heading text-4xl sm:text-5xl text-[#2C1A12] mb-6">
              Stay Close to New Roasts and Offers
            </h2>
            <p className="text-[#6B5048] mb-8">
              Be the first to hear about new blends, limited releases, and refined coffee updates from Cape Ember Coffee Co.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="input-field flex-1"
                data-testid="newsletter-email"
              />
              <button 
                type="submit" 
                className="btn-primary whitespace-nowrap"
                data-testid="newsletter-submit"
              >
                Subscribe
              </button>
            </form>
            <p className="text-[#6B5048]/60 text-sm mt-4">
              No spam, ever. Unsubscribe anytime.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Trust Badges */}
      <section className="py-12 border-t border-[#E6DCD1]" data-testid="trust-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: 'Secure Checkout', icon: ShieldCheck, desc: 'SSL Encrypted' },
              { label: 'Small-Batch Quality', icon: Medal, desc: 'Artisan Crafted' },
              { label: 'Proudly South African', icon: Fire, desc: 'Local Excellence' },
              { label: 'Nationwide Delivery', icon: Truck, desc: 'Free Over R399' },
            ].map((badge, index) => (
              <motion.div 
                key={index} 
                className="flex flex-col items-center gap-2"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-12 h-12 rounded-full bg-[#F4EFE6] flex items-center justify-center">
                  <badge.icon size={24} weight="light" className="text-[#D05C23]" />
                </div>
                <span className="text-[#2C1A12] text-sm font-medium">{badge.label}</span>
                <span className="text-[#6B5048] text-xs">{badge.desc}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        initialMode="login"
      />
    </div>
  );
};

export default HomePage;
