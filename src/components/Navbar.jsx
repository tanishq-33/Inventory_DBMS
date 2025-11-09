import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import API from "../utils/api";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread alert count
  useEffect(() => {
    fetchUnreadCount();
    // Poll every 30 seconds for new alerts
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await API.get("/roboflow/alerts/unread-count");
      setUnreadCount(res.data.unread_count);
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const isActive = (path) => {
    return location.pathname === path ? "bg-indigo-700" : "";
  };

  return (
    <nav className="bg-indigo-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link to="/dashboard" className="text-xl font-bold hover:text-indigo-200">
              📦 Smart Inventory
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            <Link
              to="/dashboard"
              className={`px-4 py-2 rounded hover:bg-indigo-700 transition ${isActive("/dashboard")}`}
            >
              🏠 Dashboard
            </Link>

            <Link
              to="/products"
              className={`px-4 py-2 rounded hover:bg-indigo-700 transition ${isActive("/products")}`}
            >
              📦 Products
            </Link>

            <Link
              to="/shops"
              className={`px-4 py-2 rounded hover:bg-indigo-700 transition ${isActive("/shops")}`}
            >
              🏪 Shops
            </Link>

            <Link
              to="/inventory"
              className={`px-4 py-2 rounded hover:bg-indigo-700 transition ${isActive("/inventory")}`}
            >
              📊 Inventory
            </Link>

            {/* Manage Link - New */}
            <Link
              to="/manage"
              className={`px-4 py-2 rounded hover:bg-indigo-700 transition ${isActive("/manage")}`}
            >
              ⚙️ Manage
            </Link>

            {/* Detection Link - New */}
            <Link
              to="/detect"
              className={`px-4 py-2 rounded hover:bg-indigo-700 transition ${isActive("/detect")}`}
            >
              🔍 Detection
            </Link>

            {/* Alerts Link with Badge - New */}
            <Link
              to="/alerts"
              className={`px-4 py-2 rounded hover:bg-indigo-700 transition relative ${isActive("/alerts")}`}
            >
              🔔 Alerts
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 transition ml-2"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}