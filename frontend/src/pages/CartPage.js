import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

const CartPage = () => {
  const { cart, updateQuantity, removeFromCart, loading } = useCart();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-20 md:pt-24 flex flex-col items-center justify-center">
        <ShoppingBag size={48} className="text-[#E5DCD0] mb-4" />
        <h1 className="font-heading text-3xl text-[#2D2622] mb-2">Your Cart</h1>
        <p className="text-[#5C534C] mb-6">Sign in to view your cart</p>
        <Link to="/shop" className="btn-primary">
          Continue Shopping
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-20 md:pt-24 flex items-center justify-center">
        <div className="spinner w-8 h-8" />
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen pt-20 md:pt-24 flex flex-col items-center justify-center">
        <ShoppingBag size={48} className="text-[#E5DCD0] mb-4" />
        <h1 className="font-heading text-3xl text-[#2D2622] mb-2">Your Cart is Empty</h1>
        <p className="text-[#5C534C] mb-6">Looks like you haven't added anything yet.</p>
        <Link to="/shop" className="btn-primary" data-testid="continue-shopping">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 md:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-heading text-4xl text-[#2D2622] mb-8">Your Cart</h1>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cart.items.map((item) => (
              <div 
                key={item.product_id} 
                className="flex gap-6 p-6 bg-[#F2EEE8] border border-[#E5DCD0]"
                data-testid={`cart-item-${item.product_id}`}
              >
                <div className="w-24 h-24 flex-shrink-0 overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.product_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-heading text-xl text-[#2D2622]">{item.product_name}</h3>
                      <p className="text-[#5C534C]">R {item.price.toFixed(2)} each</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      className="text-[#5C534C] hover:text-[#D32F2F] transition-colors"
                      data-testid={`remove-${item.product_id}`}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        className="qty-btn"
                        data-testid={`qty-decrease-${item.product_id}`}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-12 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="qty-btn"
                        data-testid={`qty-increase-${item.product_id}`}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <span className="font-semibold text-[#2D2622]">
                      R {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-[#F2EEE8] border border-[#E5DCD0] p-6 sticky top-24">
              <h2 className="font-heading text-2xl text-[#2D2622] mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-[#5C534C]">
                  <span>Subtotal</span>
                  <span>R {cart.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#5C534C]">
                  <span>Shipping</span>
                  <span>{cart.shipping === 0 ? 'Free' : `R ${cart.shipping.toFixed(2)}`}</span>
                </div>
                {cart.subtotal < 399 && cart.subtotal > 0 && (
                  <p className="text-sm text-[#A94826]">
                    Add R {(399 - cart.subtotal).toFixed(2)} more for free shipping!
                  </p>
                )}
                <div className="border-t border-[#E5DCD0] pt-4 flex justify-between font-semibold text-[#2D2622]">
                  <span>Total</span>
                  <span>R {cart.total.toFixed(2)}</span>
                </div>
              </div>

              <Link 
                to="/checkout" 
                className="btn-primary w-full flex items-center justify-center gap-2"
                data-testid="proceed-to-checkout"
              >
                Proceed to Checkout
                <ArrowRight size={18} />
              </Link>

              <Link 
                to="/shop" 
                className="block text-center mt-4 text-[#5C534C] hover:text-[#A94826] transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
