import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package,
  Warning,
  Check,
  X
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminInventory = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [newStock, setNewStock] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    fetchInventory();
  }, [user, authLoading, navigate]);

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInventory(response.data.inventory);
      setSummary(response.data.summary);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (productId, variantId) => {
    if (!newStock || isNaN(parseInt(newStock))) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/admin/inventory/${productId}/${variantId}`,
        { stock_quantity: parseInt(newStock) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setInventory(prev => prev.map(item => 
        item.product_id === productId && item.variant_id === variantId
          ? { ...item, stock_quantity: parseInt(newStock), stock_status: parseInt(newStock) === 0 ? 'out_of_stock' : parseInt(newStock) < 10 ? 'low_stock' : 'in_stock' }
          : item
      ));
      
      setEditingItem(null);
      setNewStock('');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update inventory');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const getStockStatusBadge = (status) => {
    const badges = {
      in_stock: 'bg-green-100 text-green-800',
      low_stock: 'bg-yellow-100 text-yellow-800',
      out_of_stock: 'bg-red-100 text-red-800'
    };
    const labels = {
      in_stock: 'In Stock',
      low_stock: 'Low Stock',
      out_of_stock: 'Out of Stock'
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      {/* Header */}
      <div className="bg-[#2C1A12] text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/admin" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4">
            <ArrowLeft size={20} />
            Back to Dashboard
          </Link>
          <h1 className="font-heading text-3xl">Inventory</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-2xl font-heading text-[#2C1A12]">{summary.total_products || 0}</p>
            <p className="text-sm text-[#6B5048]">Products</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-2xl font-heading text-green-600">{summary.in_stock || 0}</p>
            <p className="text-sm text-[#6B5048]">In Stock</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-2xl font-heading text-yellow-600">{summary.low_stock || 0}</p>
            <p className="text-sm text-[#6B5048]">Low Stock</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-2xl font-heading text-red-600">{summary.out_of_stock || 0}</p>
            <p className="text-sm text-[#6B5048]">Out of Stock</p>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#D05C23] border-t-transparent mx-auto"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="inventory-table">
                <thead className="bg-[#F8F5F0]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5048] uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5048] uppercase tracking-wider">
                      Variant
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5048] uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5048] uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5048] uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5048] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5048] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DCD1]">
                  {inventory.map((item) => (
                    <motion.tr 
                      key={`${item.product_id}-${item.variant_id}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`hover:bg-[#F8F5F0]/50 ${item.stock_status === 'out_of_stock' ? 'bg-red-50' : item.stock_status === 'low_stock' ? 'bg-yellow-50' : ''}`}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {item.stock_status === 'out_of_stock' && (
                            <Warning size={16} className="text-red-500" />
                          )}
                          <p className="font-medium text-[#2C1A12]">{item.product_name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-[#6B5048]">{item.variant_name}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-mono text-[#6B5048]">{item.sku || 'N/A'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-[#2C1A12]">{formatCurrency(item.price)}</p>
                      </td>
                      <td className="px-4 py-4">
                        {editingItem === `${item.product_id}-${item.variant_id}` ? (
                          <input
                            type="number"
                            value={newStock}
                            onChange={(e) => setNewStock(e.target.value)}
                            className="w-20 px-2 py-1 border border-[#E6DCD1] rounded"
                            autoFocus
                          />
                        ) : (
                          <p className={`font-medium ${item.stock_quantity < 10 ? 'text-red-600' : 'text-[#2C1A12]'}`}>
                            {item.stock_quantity}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {getStockStatusBadge(item.stock_status)}
                      </td>
                      <td className="px-4 py-4">
                        {editingItem === `${item.product_id}-${item.variant_id}` ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateStock(item.product_id, item.variant_id)}
                              className="p-1 text-green-600 hover:bg-green-100 rounded"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => { setEditingItem(null); setNewStock(''); }}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingItem(`${item.product_id}-${item.variant_id}`); setNewStock(item.stock_quantity.toString()); }}
                            className="text-[#D05C23] hover:underline text-sm"
                          >
                            Edit Stock
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Stock changes are stored in memory for this demo. In production, inventory would be persisted to the database.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminInventory;
