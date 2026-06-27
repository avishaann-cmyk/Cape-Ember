import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingBag } from 'lucide-react';

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
      to={`/product/${product.id}`} 
      className="group block"
      data-testid={`product-card-${product.id}`}
    >
      <div className="card overflow-hidden">
        {/* Image */}
        <div className="product-image-container aspect-square bg-[#F2EEE8]">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Badges */}
          {product.is_bundle && (
            <span className="badge badge-secondary mb-3">Bundle</span>
          )}
          {product.id === 'karoo-horizon' && (
            <span className="badge badge-primary mb-3">Limited Edition</span>
          )}

          <h3 className="font-heading text-xl text-[#2D2622] mb-1 group-hover:text-[#A94826] transition-colors">
            {product.name}
          </h3>
          
          <p className="text-[#5C534C] text-sm mb-3">{product.flavor_notes}</p>
          
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#2D2622]">
              R {product.price.toFixed(2)}
            </span>
            <span className="text-sm text-[#5C534C]">{product.weight}</span>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={adding}
            className={`w-full mt-4 py-3 flex items-center justify-center gap-2 font-medium tracking-wide text-sm transition-all ${
              added 
                ? 'bg-[#388E3C] text-white' 
                : 'bg-[#2D2622] text-white hover:bg-[#A94826]'
            }`}
            data-testid={`add-to-cart-${product.id}`}
          >
            {adding ? (
              <span className="spinner border-white border-t-transparent" />
            ) : added ? (
              'Added!'
            ) : (
              <>
                <ShoppingBag size={18} />
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
