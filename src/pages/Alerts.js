import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import API from "../utils/api";
import { toast } from "react-toastify";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, unread, read
  const [selectedShop, setSelectedShop] = useState("");
  const [shops, setShops] = useState([]);

  useEffect(() => {
    fetchShops();
    fetchAlerts();
  }, [filter, selectedShop]);

  const fetchShops = async () => {
    try {
      const res = await API.get("/shops");
      setShops(res.data);
    } catch (err) {
      console.error("Error fetching shops:", err);
    }
  };

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedShop) params.shop_id = selectedShop;
      if (filter !== "all") params.is_read = filter === "read";

      const res = await API.get("/roboflow/alerts", { params });
      setAlerts(res.data);
    } catch (err) {
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId) => {
    try {
      await API.put(`/roboflow/alerts/${alertId}/read`);
      fetchAlerts();
      toast.success("Alert marked as read");
    } catch (err) {
      toast.error("Failed to update alert");
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.put("/roboflow/alerts/read-all", {
        shop_id: selectedShop || null,
      });
      fetchAlerts();
      toast.success("All alerts marked as read");
    } catch (err) {
      toast.error("Failed to update alerts");
    }
  };

  const deleteAlert = async (alertId) => {
    if (!window.confirm("Delete this alert?")) return;
    try {
      await API.delete(`/roboflow/alerts/${alertId}`);
      fetchAlerts();
      toast.success("Alert deleted");
    } catch (err) {
      toast.error("Failed to delete alert");
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case "LOW_STOCK":
        return "⚠️";
      case "OUT_OF_STOCK":
        return "🚫";
      default:
        return "🔔";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Alerts</h2>
          <button
            onClick={markAllAsRead}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Mark All as Read
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Filter by Status</label>
              <select
                className="w-full border rounded p-2"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Alerts</option>
                <option value="unread">Unread Only</option>
                <option value="read">Read Only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Filter by Shop</label>
              <select
                className="w-full border rounded p-2"
                value={selectedShop}
                onChange={(e) => setSelectedShop(e.target.value)}
              >
                <option value="">All Shops</option>
                {shops.map((shop) => (
                  <option key={shop.shop_id} value={shop.shop_id}>
                    {shop.shop_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <p className="text-gray-400 text-lg">No alerts found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.alert_id}
                className={`bg-white p-4 rounded-lg shadow-md border-l-4 ${
                  alert.is_read
                    ? "border-gray-300 opacity-75"
                    : "border-red-500"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{getAlertIcon(alert.alert_type)}</span>
                      <h3 className="font-semibold text-lg">
                        {alert.product_name || "Unknown Product"}
                      </h3>
                      {!alert.is_read && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 mb-2">{alert.message}</p>
                    <div className="flex gap-4 text-sm text-gray-500">
                      {alert.shop_name && (
                        <span>🏪 {alert.shop_name}</span>
                      )}
                      <span>📦 Count: {alert.detected_count}</span>
                      <span>📊 Threshold: {alert.threshold_count}</span>
                      <span>🕒 {formatDate(alert.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {!alert.is_read && (
                      <button
                        onClick={() => markAsRead(alert.alert_id)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        title="Mark as read"
                      >
                        ✓
                      </button>
                    )}
                    <button
                      onClick={() => deleteAlert(alert.alert_id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}