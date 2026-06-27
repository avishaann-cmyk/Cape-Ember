import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Leaf, MapPin, Coffee, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import AuthModal from '../components/AuthModal';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Hero carousel images - lifestyle & landscape shots
const HERO_IMAGES = [
  {
    url: "https://images.pexels.com/photos/33641653/pexels-photo-33641653.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    title: "The Garden Route",
    subtitle: "South Africa's iconic coastline"
  },
  {
    url: "https://images.pexels.com/photos/4927237/pexels-photo-4927237.jpeg",
    title: "Crafted with Care",
    subtitle: "Artisan coffee creation"
  },
  {
    url: "https://images.pexels.com/photos/6248548/pexels-photo-6248548.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    title: "Moments of Joy",
    subtitle: "Coffee brings people together"
  },
  {
    url: "https://images.pexels.com/photos/31890552/pexels-photo-31890552.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    title: "Freshly Roasted",
    subtitle: "Small-batch perfection"
  }
];

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000); // Change every 5 seconds
    return () => clearInterval(timer);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % HERO_IMAGES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + HERO_IMAGES.length) % HERO_IMAGES.length);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${API}/products`);
        setProducts(response.data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const individualProducts = products.filter(p => !p.is_bundle);
  const bundle = products.find(p => p.is_bundle);

  return (
    <div className="min-h-screen">
      {/* Hero Section with Carousel */}
      <section className="relative h-screen flex items-center overflow-hidden">
        {/* Carousel Images */}
        {HERO_IMAGES.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url('${image.url}')` }}
          />
        ))}
        <div className="absolute inset-0 hero-overlay" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
          <div className="max-w-2xl animate-fade-in">
            <span className="overline text-[#A94826] mb-4 block">
              Premium Small-Batch Coffee · South Africa
            </span>
            <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl text-white leading-tight mb-6">
              Experience South Africa in Every Cup
            </h1>
            <p className="text-white/80 text-lg md:text-xl mb-8 max-w-xl">
              From the wild fynbos coast to the vast Karoo plains — Cape Ember Coffee Co. brings together coffee, landscape, and ritual in one refined collection.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/shop" 
                className="btn-primary inline-flex items-center justify-center gap-2"
                data-testid="hero-shop-btn"
              >
                Explore Collection
                <ArrowRight size={18} />
              </Link>
              {bundle && (
                <Link 
                  to={`/product/${bundle.id}`}
                  className="btn-secondary bg-white/10 border-white/30 text-white hover:bg-white/20 inline-flex items-center justify-center"
                  data-testid="hero-bundle-btn"
                >
                  Discover the Bundle
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Carousel Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all backdrop-blur-sm"
          aria-label="Previous slide"
          data-testid="carousel-prev"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all backdrop-blur-sm"
          aria-label="Next slide"
          data-testid="carousel-next"
        >
          <ChevronRight size={24} />
        </button>

        {/* Carousel Indicators */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex gap-3">
          {HERO_IMAGES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide 
                  ? 'bg-[#A94826] w-8' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
              data-testid={`carousel-dot-${index}`}
            />
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/50 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-white/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* Featured Bundle */}
      {bundle && (
        <section className="section-padding bg-[#F2EEE8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="product-image-container aspect-square">
                <img
                  src={bundle.image_url}
                  alt={bundle.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="animate-slide-in">
                <span className="overline text-[#A94826] mb-4 block">Curated Selection</span>
                <h2 className="font-heading text-4xl md:text-5xl text-[#2D2622] mb-4">
                  The Landscape Range Bundle
                </h2>
                <p className="text-[#5C534C] text-lg mb-6">
                  A considered introduction to the Cape Ember range — four signature coffees, each inspired by a distinct South African landscape.
                </p>
                <p className="font-heading text-3xl text-[#A94826] mb-6">
                  R {bundle.price.toFixed(2)} <span className="text-base text-[#5C534C] font-body">· 4 x 250g</span>
                </p>
                <ul className="space-y-3 mb-8">
                  {individualProducts.map(p => (
                    <li key={p.id} className="flex items-center gap-2 text-[#5C534C]">
                      <Coffee size={16} className="text-[#A94826]" />
                      <strong>{p.name}</strong> — {p.flavor_notes}
                    </li>
                  ))}
                </ul>
                <Link 
                  to={`/product/${bundle.id}`}
                  className="btn-primary inline-flex items-center gap-2"
                  data-testid="bundle-cta"
                >
                  Begin with the Full Range
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Products Grid */}
      <section className="section-padding">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="overline text-[#A94826] mb-2 block">The Collection</span>
            <h2 className="font-heading text-4xl md:text-5xl text-[#2D2622] mb-4">
              Explore the Signature Blends
            </h2>
            <p className="text-[#5C534C] max-w-2xl mx-auto">
              Each blend carries its own character — from smooth and balanced to bold, expressive, and deeply comforting.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="spinner w-8 h-8" />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {individualProducts.map((product, idx) => (
                <div key={product.id} className={`animate-fade-in stagger-${idx + 1}`}>
                  <ProductCard 
                    product={product} 
                    onAuthRequired={() => setAuthModalOpen(true)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="section-padding bg-[#2D2622]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Coffee, title: 'Small-Batch Freshness', desc: 'Roasted in small batches to preserve flavour, aroma and character.' },
              { icon: Leaf, title: 'Landscape Inspired', desc: 'Every blend reflects a unique South African landscape.' },
              { icon: MapPin, title: 'Proudly South African', desc: 'Inspired by the beauty and spirit of South Africa.' },
              { icon: Truck, title: 'Nationwide Delivery', desc: 'Fresh coffee delivered throughout South Africa. Free over R399.' },
            ].map((feature, idx) => (
              <div key={idx} className="text-center animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-[#A94826]/20 text-[#A94826]">
                  <feature.icon size={28} />
                </div>
                <h3 className="font-heading text-xl text-white mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Teaser */}
      <section className="section-padding">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="overline text-[#A94826] mb-4 block">The Cape Ember Experience</span>
              <h2 className="font-heading text-4xl md:text-5xl text-[#2D2622] mb-6">
                From Landscape to Cup
              </h2>
              <p className="text-[#5C534C] text-lg mb-4">
                A visual journey through the places, rituals and moments that inspire every Cape Ember blend.
              </p>
              <p className="text-[#5C534C] mb-8">
                We source premium beans and roast them with care, honoring the diverse terrains of our beautiful country. Each cup tells a story of mountains, coastlines, and everything in between.
              </p>
              <Link 
                to="/about" 
                className="btn-secondary inline-flex items-center gap-2"
                data-testid="story-cta"
              >
                Read Our Story
                <ArrowRight size={18} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-[3/4] overflow-hidden">
                <img
                  src="https://customer-assets.emergentagent.com/job_axis-creator/artifacts/urotn845_DA24A032-67E2-4343-9612-0534B6EA7394.jpeg"
                  alt="Ember Reserve Coffee"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="aspect-[3/4] overflow-hidden mt-8">
                <img
                  src="https://customer-assets.emergentagent.com/job_axis-creator/artifacts/7rra3n1s_38C77683-E4ED-4917-95F8-08997E2C06FE.jpeg"
                  alt="Karoo Horizon Coffee"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        initialMode="register"
      />
    </div>
  );
};

export default HomePage;
