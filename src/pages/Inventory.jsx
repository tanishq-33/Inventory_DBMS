import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import API from "../utils/api";
import { toast } from "react-toastify";

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [newInv, setNewInv] = useState({
    shop_id: "",
    product_id: "",
    total_quantity: "",
    shelf_quantity: "",
  });
  const [catalogProducts, setCatalogProducts] = useState([]); // All products for selection
  const [shops, setShops] = useState([]);

  const fetchInventory = async () => {
    const res = await API.get("/inventory");
    setInventory(res.data);
  };

  const fetchCatalogProducts = async () => {
    try {
      // Fetch from catalog endpoint - shows ALL products
      const res = await API.get("/products/catalog");
      setCatalogProducts(res.data);
    } catch (err) {
      console.error("fetchCatalogProducts error:", err);
    }
  };

  const fetchShops = async () => {
    try {
      const res = await API.get("/shops");
      setShops(res.data);
    } catch (err) {
      console.error("fetchShops error:", err);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchCatalogProducts();
    fetchShops();
  }, []);

  const handleAddInventory = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        shop_id: Number(newInv.shop_id),
        product_id: Number(newInv.product_id),
        total_quantity: Number(newInv.total_quantity),
        shelf_quantity: Number(newInv.shelf_quantity),
      };

      await API.post("/inventory", payload);
      toast.success("Inventory added successfully!");
      setNewInv({ shop_id: "", product_id: "", total_quantity: "", shelf_quantity: "" });
      fetchInventory();
    } catch (err) {
      const serverMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Unknown error";
      toast.error("Error adding inventory: " + serverMsg);
    }
  };

  const handleDeleteInventory = async (id) => {
    if (!window.confirm("Delete this inventory record?")) return;
    try {
      await API.delete(`/inventory/${id}`);
      toast.success("Inventory deleted");
      fetchInventory();
    } catch (err) {
      toast.error("Error deleting inventory");
    }
  };

  const updateInventoryCount = async (invId, delta) => {
    try {
      const inv = inventory.find((i) => i.inventory_id === invId);
      if (!inv) return;
      const newTotal = Number(inv.total_quantity || 0) + delta;
      const newShelf = Number(inv.shelf_quantity || 0) + delta;
      if (newTotal < 0 || newShelf < 0) return;

      await API.put(`/inventory/${invId}`, { total_quantity: newTotal, shelf_quantity: newShelf });
      toast.success("Inventory updated");
      fetchInventory();
    } catch (err) {
      const serverMsg = err?.response?.data?.message || err?.message || "Error updating inventory";
      toast.error(serverMsg);
    }
  };

  return (
    <>
      <Navbar />
      <div className="p-6">
        <h2 className="text-2xl mb-4 font-semibold">Manage Inventory</h2>

        {/* Add Inventory */}
        <form onSubmit={handleAddInventory} className="bg-white p-4 rounded shadow mb-6 w-2/3">
          <h3 className="text-lg font-medium mb-3">Add New Inventory</h3>
          <div className="grid grid-cols-2 gap-3">
            <select
              className="border p-2 rounded"
              value={newInv.shop_id}
              onChange={(e) => setNewInv({ ...newInv, shop_id: e.target.value })}
              required
            >
              <option value="">Select Shop</option>
              {shops.map((s) => (
                <option key={s.shop_id} value={s.shop_id}>
                  {s.shop_name}
                </option>
              ))}
            </select>

            <select
              className="border p-2 rounded"
              value={newInv.product_id}
              onChange={(e) => setNewInv({ ...newInv, product_id: e.target.value })}
              required
            >
              <option value="">Select Product</option>
              {catalogProducts.map((p) => (
                <option key={p.product_id} value={p.product_id}>
                  {p.name} - ₹{p.price}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Total Quantity"
              className="border p-2 rounded"
              value={newInv.total_quantity}
              onChange={(e) => setNewInv({ ...newInv, total_quantity: e.target.value })}
              required
              min="0"
            />
            <input
              type="number"
              placeholder="Shelf Quantity"
              className="border p-2 rounded"
              value={newInv.shelf_quantity}
              onChange={(e) => setNewInv({ ...newInv, shelf_quantity: e.target.value })}
              required
              min="0"
            />
          </div>
          <button className="bg-purple-600 text-white px-4 py-2 rounded mt-4 hover:bg-purple-700">
            Add Inventory
          </button>
        </form>

        {/* Inventory Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {inventory.map((inv) => {
            const shopName = inv.shop_name || `Shop ${inv.shop_id}`;
            const productName = inv.product_name || `Product ${inv.product_id}`;
            const price = inv.price;
            const total = Number(inv.total_quantity || 0);
            const shelf = Number(inv.shelf_quantity || 0);
            const shelfPct = total > 0 ? Math.round((shelf / total) * 100) : 0;
            const lowThreshold = 10;
            const isLow = shelf > 0 && shelf < 5;

            return (
              <div key={inv.inventory_id} className="bg-white rounded-xl shadow border overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-40 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                  <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-800">{productName}</h4>
                      <p className="text-sm text-gray-500">{shopName}</p>
                      {inv.product_type && (
                        <p className="text-xs text-gray-400">{inv.product_type}</p>
                      )}
                    </div>
                    <button 
                      onClick={() => handleDeleteInventory(inv.inventory_id)} 
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="Delete inventory"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div>
                      {price && <p className="text-xl font-bold text-gray-800">₹{price}</p>}
                    </div>

                    <div>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        isLow ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                      }`}>
                        {isLow ? "⚠️ Low" : "✓ Stock"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <button 
                      onClick={() => updateInventoryCount(inv.inventory_id, -1)} 
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition-colors font-medium"
                      disabled={total === 0 && shelf === 0}
                    >
                      −
                    </button>
                    <button 
                      onClick={() => updateInventoryCount(inv.inventory_id, 1)} 
                      className="flex-1 bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition-colors font-medium"
                    >
                      +
                    </button>
                  </div>

                  <div className="mt-4">
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          isLow ? "bg-red-500" : "bg-indigo-500"
                        }`}
                        style={{ width: `${shelfPct}%` }} 
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>Total: {total}</span>
                      <span>Shelf: {shelf} ({shelfPct}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {inventory.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <svg className="w-24 h-24 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-lg font-medium mb-2">No inventory items yet</p>
            <p className="text-sm">Add products to your shops to get started</p>
          </div>
        )}
      </div>
    </>
  );
}
