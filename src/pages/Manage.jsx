import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import API from "../utils/api";
import { toast } from "react-toastify";

export default function Manage() {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedShop) {
      setFilteredInventory(inventory.filter(item => item.shop_id === parseInt(selectedShop)));
    } else {
      setFilteredInventory(inventory);
    }
  }, [selectedShop, inventory]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [inventoryRes, shopsRes] = await Promise.all([
        API.get("/inventory"),
        API.get("/shops"),
      ]);
      setInventory(inventoryRes.data);
      setFilteredInventory(inventoryRes.data);
      setShops(shopsRes.data);
    } catch (err) {
      toast.error("Failed to load data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStockChange = async (inventoryId, action, amount) => {
    const item = inventory.find(inv => inv.inventory_id === inventoryId);
    if (!item) return;

    let newShelfQty = item.shelf_quantity;
    let newTotalQty = item.total_quantity;

    if (action === "add_to_shelf") {
      // Move from inventory to shelf
      if (item.total_quantity < amount) {
        toast.error("Not enough items in inventory!");
        return;
      }
      newShelfQty = item.shelf_quantity + amount;
      newTotalQty = item.total_quantity - amount;
    } else if (action === "remove_from_shelf") {
      // Move from shelf back to inventory
      if (item.shelf_quantity < amount) {
        toast.error("Not enough items on shelf!");
        return;
      }
      newShelfQty = item.shelf_quantity - amount;
      newTotalQty = item.total_quantity + amount;
    }

    setUpdating(inventoryId);
    try {
      await API.put(`/inventory/${inventoryId}`, {
        total_quantity: newTotalQty,
        shelf_quantity: newShelfQty,
      });
      
      toast.success("Stock updated successfully!");
      fetchData();
    } catch (err) {
      toast.error("Failed to update stock");
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  const StockCard = ({ item }) => {
    const [addAmount, setAddAmount] = useState(1);
    const [removeAmount, setRemoveAmount] = useState(1);

    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{item.product_name}</h3>
            <p className="text-sm text-gray-600">{item.shop_name}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            item.shelf_quantity < 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {item.shelf_quantity < 5 ? 'Low Stock' : 'In Stock'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-600 mb-1">On Shelf</p>
            <p className="text-2xl font-bold text-indigo-600">{item.shelf_quantity}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-600 mb-1">In Inventory</p>
            <p className="text-2xl font-bold text-gray-700">{item.total_quantity}</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Add to Shelf */}
          <div className="border border-gray-200 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Add to Shelf</p>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max={item.total_quantity}
                value={addAmount}
                onChange={(e) => setAddAmount(parseInt(e.target.value) || 1)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={() => handleStockChange(item.inventory_id, "add_to_shelf", addAmount)}
                disabled={updating === item.inventory_id || item.total_quantity === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {updating === item.inventory_id ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>→ Shelf</span>
                )}
              </button>
            </div>
          </div>

          {/* Remove from Shelf */}
          <div className="border border-gray-200 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Remove from Shelf</p>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max={item.shelf_quantity}
                value={removeAmount}
                onChange={(e) => setRemoveAmount(parseInt(e.target.value) || 1)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => handleStockChange(item.inventory_id, "remove_from_shelf", removeAmount)}
                disabled={updating === item.inventory_id || item.shelf_quantity === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {updating === item.inventory_id ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>← Inventory</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
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
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Manage Stock</h1>
            <p className="text-gray-600">Move products between inventory and shelf</p>
          </div>

          {/* Filter by Shop */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Shop
            </label>
            <select
              value={selectedShop}
              onChange={(e) => setSelectedShop(e.target.value)}
              className="w-full md:w-1/3 px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Shops</option>
              {shops.map((shop) => (
                <option key={shop.shop_id} value={shop.shop_id}>
                  {shop.shop_name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Cards Grid */}
          {filteredInventory.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <p className="text-xl text-gray-400 mb-4">No inventory items found</p>
              <a href="/inventory" className="text-indigo-600 hover:underline">
                Add inventory items →
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInventory.map((item) => (
                <StockCard key={item.inventory_id} item={item} />
              ))}
            </div>
          )}

          {/* Info Box */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <span className="text-xl">ℹ️</span>
              How it works
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Add to Shelf:</strong> Moves items from inventory to shelf (reduces inventory count)</li>
              <li>• <strong>Remove from Shelf:</strong> Moves items from shelf back to inventory (increases inventory count)</li>
              <li>• Products with less than 5 items on shelf are marked as "Low Stock"</li>
              <li>• Use AI detection to automatically update shelf counts from images</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}