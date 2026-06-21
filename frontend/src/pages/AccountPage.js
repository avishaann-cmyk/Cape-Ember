import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Package, RefreshCw, LogOut, Calendar, Pause, Play, X } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AccountPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    fetchData();
  }, [isAuthenticated, navigate]);

  const fetchData = async () => {
    try {
      const [ordersRes, subsRes] = await Promise.all([
        axios.get(`${API}/orders`),
        axios.get(`${API}/subscriptions`)
      ]);
      setOrders(ordersRes.data);
      setSubscriptions(subsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePauseSubscription = async (subId) => {
    try {
      await axios.put(`${API}/subscriptions/${subId}/pause`);
      fetchData();
    } catch (error) {
      console.error('Failed to pause subscription:', error);
    }
  };

  const handleResumeSubscription = async (subId) => {
    try {
      await axios.put(`${API}/subscriptions/${subId}/resume`);
      fetchData();
    } catch (error) {
      console.error('Failed to resume subscription:', error);
    }
  };

  const handleCancelSubscription = async (subId) => {
    if (!window.confirm('Are you sure you want to cancel this subscription?')) return;
    try {
      await axios.delete(`${API}/subscriptions/${subId}`);
      fetchData();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'text-[#388E3C] bg-[#388E3C]/10';
      case 'pending_payment': return 'text-[#F59E0B] bg-[#F59E0B]/10';
      case 'active': return 'text-[#388E3C] bg-[#388E3C]/10';
      case 'paused': return 'text-[#F59E0B] bg-[#F59E0B]/10';
      case 'cancelled': return 'text-[#D32F2F] bg-[#D32F2F]/10';
      default: return 'text-[#5C534C] bg-[#5C534C]/10';
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen pt-20 md:pt-24 bg-[#FAFAF7]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-4xl text-[#2D2622] mb-2">
              Welcome back, {user.first_name}
            </h1>
            <p className="text-[#5C534C]">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 md:mt-0 inline-flex items-center gap-2 text-[#5C534C] hover:text-[#A94826] transition-colors"
            data-testid="account-logout"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-[#E5DCD0]">
          {[
            { id: 'orders', label: 'Orders', icon: Package },
            { id: 'subscriptions', label: 'Subscriptions', icon: RefreshCw },
            { id: 'profile', label: 'Profile', icon: User },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                activeTab === id 
                  ? 'text-[#A94826] border-b-2 border-[#A94826] -mb-[1px]' 
                  : 'text-[#5C534C] hover:text-[#2D2622]'
              }`}
              data-testid={`tab-${id}`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner w-8 h-8" />
          </div>
        ) : (
          <>
            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <div className="text-center py-12 bg-[#F2EEE8] border border-[#E5DCD0]">
                    <Package size={48} className="mx-auto text-[#E5DCD0] mb-4" />
                    <p className="text-[#5C534C] mb-4">No orders yet</p>
                    <Link to="/shop" className="btn-primary">
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div 
                      key={order.id} 
                      className="bg-[#F2EEE8] border border-[#E5DCD0] p-6"
                      data-testid={`order-${order.id}`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                        <div>
                          <p className="font-mono text-sm text-[#5C534C]">
                            Order #{order.id.slice(0, 8)}
                          </p>
                          <p className="text-sm text-[#5C534C]">
                            {new Date(order.created_at).toLocaleDateString('en-ZA', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 mt-2 md:mt-0">
                          <span className={`badge ${getStatusColor(order.status)}`}>
                            {order.status.replace('_', ' ')}
                          </span>
                          <span className="font-semibold text-[#2D2622]">
                            R {order.total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {order.items.map((item, idx) => (
                          <span key={idx} className="text-sm text-[#5C534C] bg-white px-3 py-1">
                            {item.product_name} × {item.quantity}
                          </span>
                        ))}
                      </div>
                      {order.is_subscription && (
                        <p className="mt-2 text-sm text-[#A94826]">
                          <RefreshCw size={14} className="inline mr-1" />
                          Subscription Order
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Subscriptions Tab */}
            {activeTab === 'subscriptions' && (
              <div className="space-y-4">
                {subscriptions.length === 0 ? (
                  <div className="text-center py-12 bg-[#F2EEE8] border border-[#E5DCD0]">
                    <RefreshCw size={48} className="mx-auto text-[#E5DCD0] mb-4" />
                    <p className="text-[#5C534C] mb-4">No active subscriptions</p>
                    <Link to="/subscriptions" className="btn-primary">
                      Explore Subscriptions
                    </Link>
                  </div>
                ) : (
                  subscriptions.map((sub) => (
                    <div 
                      key={sub.id} 
                      className="bg-[#F2EEE8] border border-[#E5DCD0] p-6"
                      data-testid={`subscription-${sub.id}`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                        <div>
                          <h3 className="font-heading text-xl text-[#2D2622]">
                            {sub.product_name}
                          </h3>
                          <p className="text-[#5C534C]">
                            {sub.quantity} × R {sub.price_per_delivery.toFixed(2)} / {sub.frequency}
                          </p>
                        </div>
                        <span className={`badge ${getStatusColor(sub.status)}`}>
                          {sub.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-[#5C534C] mb-4">
                        <Calendar size={16} />
                        Next delivery: {new Date(sub.next_delivery).toLocaleDateString('en-ZA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>

                      <div className="flex gap-2">
                        {sub.status === 'active' && (
                          <button
                            onClick={() => handlePauseSubscription(sub.id)}
                            className="btn-secondary text-sm py-2 px-4 flex items-center gap-1"
                            data-testid={`pause-sub-${sub.id}`}
                          >
                            <Pause size={14} />
                            Pause
                          </button>
                        )}
                        {sub.status === 'paused' && (
                          <button
                            onClick={() => handleResumeSubscription(sub.id)}
                            className="btn-primary text-sm py-2 px-4 flex items-center gap-1"
                            data-testid={`resume-sub-${sub.id}`}
                          >
                            <Play size={14} />
                            Resume
                          </button>
                        )}
                        {sub.status !== 'cancelled' && (
                          <button
                            onClick={() => handleCancelSubscription(sub.id)}
                            className="text-[#D32F2F] hover:bg-[#D32F2F]/10 px-4 py-2 text-sm font-medium flex items-center gap-1 transition-colors"
                            data-testid={`cancel-sub-${sub.id}`}
                          >
                            <X size={14} />
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="max-w-md">
                <div className="bg-[#F2EEE8] border border-[#E5DCD0] p-6 space-y-4">
                  <div>
                    <label className="overline block mb-1">Name</label>
                    <p className="text-[#2D2622] font-medium">
                      {user.first_name} {user.last_name}
                    </p>
                  </div>
                  <div>
                    <label className="overline block mb-1">Email</label>
                    <p className="text-[#2D2622] font-medium">{user.email}</p>
                  </div>
                  {user.phone && (
                    <div>
                      <label className="overline block mb-1">Phone</label>
                      <p className="text-[#2D2622] font-medium">{user.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AccountPage;
