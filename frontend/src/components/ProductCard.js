import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingBag, Heart } from '@phosphor-icons/react';

const ProductCard = ({ product, onAuthRequired }) => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [adding, setAdding] = React.useState(false);
  const [added, setAdded] = React.useState(false);

  // Support both old image_url and new images array format
  const imageUrl = product.image_url || 
    (product.images && product.images.length > 0 
      ? (product.images.find(img => img.is_primary)?.url || product.images[0]?.url)
      : '/placeholder-coffee.jpg');

  // Get weight from variants or old weight field
  const productWeight = product.weight || 
    (product.variants && product.variants.length > 0 
      ? product.variants[0]?.weight 
      : '250g');

  // Get roast level for display
  const roastLevel = product.roast_level || product.roast || 'Medium';

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      onAuthRequired?.();
      return;
    }

    setAdding(true);
    try {
      await addToCart(product.id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Link 
      to={`/product/${product.slug || product.id}`} 
      className="group block"
      data-testid={`product-card-${product.id}`}
    >
      <div className="premium-card overflow-hidden bg-white">
        {/* Image Container */}
        <div className="product-image-container aspect-[4/5] bg-[#F4EFE6] relative">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
          
          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          
          {/* Wishlist Button */}
          <button 
            className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // TODO: Add to wishlist
            }}
            aria-label="Add to wishlist"
          >
            <Heart size={20} weight="light" className="text-[#2C1A12]" />
          </button>

          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {product.is_bundle && (
              <span className="luxury-badge bg-[#2C1A12] text-white border-0">
                Bundle
              </span>
            )}
            {product.id === 'karoo-horizon' && (
              <span className="luxury-badge">
                Limited
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Roast Level Tag */}
          <span className="text-[10px] text-[#C86333] tracking-[0.2em] uppercase mb-2 block">
            {roastLevel} Roast
          </span>

          <h3 className="font-heading text-xl text-[#2C1A12] mb-1 group-hover:text-[#D05C23] transition-colors">
            {product.name}
          </h3>
          
          <p className="text-[#6B5048] text-sm mb-4 line-clamp-1">
            {product.flavor_notes || product.short_description || 'Rich, aromatic coffee'}
          </p>
          
          <div className="flex items-center justify-between mb-4">
            <span className="font-heading text-xl text-[#2C1A12]">
              R {product.price?.toFixed(2)}
            </span>
            <span className="text-xs text-[#6B5048] tracking-wide">{productWeight}</span>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={adding}
            className={`w-full py-3 flex items-center justify-center gap-2 font-medium tracking-wide text-xs uppercase transition-all duration-300 ${
              added 
                ? 'bg-[#2F855A] text-white' 
                : 'bg-[#2C1A12] text-white hover:bg-[#D05C23]'
            }`}
            data-testid={`add-to-cart-${product.id}`}
          >
            {adding ? (
              <span className="spinner border-white border-t-transparent w-4 h-4" />
            ) : added ? (
              'Added to Cart'
            ) : (
              <>
                <ShoppingBag size={16} weight="light" />
                Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
