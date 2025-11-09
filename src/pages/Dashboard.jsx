import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import API from "../utils/api";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalShops: 0,
    lowStockAlerts: 0,
    totalInventoryItems: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [recentDetections, setRecentDetections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [productsRes, shopsRes, inventoryRes, alertsRes, detectionsRes] = await Promise.all([
        API.get("/products"),
        API.get("/shops"),
        API.get("/inventory"),
        API.get("/roboflow/alerts?is_read=false"),
        API.get("/roboflow/history"),
      ]);

      // Calculate stats
      setStats({
        totalProducts: productsRes.data.length,
        totalShops: shopsRes.data.length,
        lowStockAlerts: alertsRes.data.length,
        totalInventoryItems: inventoryRes.data.reduce((sum, item) => sum + item.total_quantity, 0),
      });

      // Find low stock products (shelf_quantity < 5)
      const lowStock = inventoryRes.data
        .filter(item => item.shelf_quantity < 5)
        .sort((a, b) => a.shelf_quantity - b.shelf_quantity)
        .slice(0, 5);
      
      setLowStockProducts(lowStock);
      setRecentDetections(detectionsRes.data.slice(0, 5));
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Products</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalProducts}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📦</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Shops</p>
                  <p className="text-3xl font-bold text-green-600">{stats.totalShops}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🏪</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Low Stock Alerts</p>
                  <p className="text-3xl font-bold text-red-600">{stats.lowStockAlerts}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⚠️</span>
                </div>
              </div>
              {stats.lowStockAlerts > 0 && (
                <Link to="/alerts" className="text-xs text-red-600 hover:underline mt-2 inline-block">
                  View alerts →
                </Link>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Inventory</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.totalInventoryItems}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Low Stock Products */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                Low Stock Products
              </h2>

              {lowStockProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-lg">✅ All products have adequate stock!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStockProducts.map((item) => (
                    <div
                      key={item.inventory_id}
                      className="p-4 bg-red-50 border border-red-200 rounded-lg hover:border-red-300 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-800">{item.product_name}</h3>
                          <p className="text-sm text-gray-600">{item.shop_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-red-600">{item.shelf_quantity}</p>
                          <p className="text-xs text-gray-500">on shelf</p>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-4 text-sm text-gray-600">
                        <span>Total: {item.total_quantity}</span>
                        <span>•</span>
                        <Link to="/manage" className="text-indigo-600 hover:underline">
                          Restock →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Detections */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">🔍</span>
                Recent Detections
              </h2>

              {recentDetections.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-lg">No detections yet</p>
                  <Link to="/detect" className="text-indigo-600 hover:underline text-sm mt-2 inline-block">
                    Start detecting products →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentDetections.map((detection) => (
                    <div
                      key={detection.detection_id}
                      className="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {detection.shop_name || "Unknown Shop"}
                          </p>
                          <p className="text-xs text-gray-500">{formatDate(detection.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-indigo-600">{detection.total_items_detected}</p>
                          <p className="text-xs text-gray-500">items</p>
                        </div>
                      </div>
                      <div className="flex gap-3 text-sm">
                        <span className="text-gray-600">
                          {detection.unique_products} unique products
                        </span>
                        {detection.low_stock_alerts > 0 && (
                          <span className="text-red-600 font-medium">
                            • {detection.low_stock_alerts} alerts
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/detect"
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">🔍</span>
                <div>
                  <h3 className="text-lg font-semibold">Detect Products</h3>
                  <p className="text-sm text-indigo-100">Upload or capture shelf images</p>
                </div>
              </div>
            </Link>

            <Link
              to="/manage"
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">⚙️</span>
                <div>
                  <h3 className="text-lg font-semibold">Manage Stock</h3>
                  <p className="text-sm text-green-100">Update shelf and inventory</p>
                </div>
              </div>
            </Link>

            <Link
              to="/inventory"
              className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">📊</span>
                <div>
                  <h3 className="text-lg font-semibold">View Inventory</h3>
                  <p className="text-sm text-blue-100">See all products and stock</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}