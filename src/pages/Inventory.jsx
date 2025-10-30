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
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);

  const fetchInventory = async () => {
    const res = await API.get("/inventory");
    setInventory(res.data);
  };

  const fetchProducts = async () => {
    try {
      const res = await API.get("/products");
      setProducts(res.data);
    } catch (err) {
      console.error("fetchProducts error:", err);
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
    fetchProducts();
    fetchShops();
  }, []);

  const handleAddInventory = async (e) => {
    e.preventDefault();
    try {
      // coerce numeric fields to numbers
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
      fetchInventory();
    } catch {
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
            >
              <option value="">Select Shop</option>
              {shops.map((s) => (
                <option key={s.shop_id} value={s.shop_id}>
                  {s.shop_id} - {s.shop_name}
                </option>
              ))}
            </select>

            <select
              className="border p-2 rounded"
              value={newInv.product_id}
              onChange={(e) => setNewInv({ ...newInv, product_id: e.target.value })}
            >
              <option value="">Select Product</option>
              {products.map((p) => (
                <option key={p.product_id} value={p.product_id}>
                  {p.product_id} - {p.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Total Quantity"
              className="border p-2 rounded"
              value={newInv.total_quantity}
              onChange={(e) => setNewInv({ ...newInv, total_quantity: e.target.value })}
            />
            <input
              type="number"
              placeholder="Shelf Quantity"
              className="border p-2 rounded"
              value={newInv.shelf_quantity}
              onChange={(e) => setNewInv({ ...newInv, shelf_quantity: e.target.value })}
            />
          </div>
          <button className="bg-purple-600 text-white px-4 py-2 rounded mt-4">
            Add Inventory
          </button>
        </form>

        {/* Inventory Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {inventory.map((inv) => {
            const prod = products.find((p) => p.product_id === inv.product_id) || {};
            const shopName = inv.shop_name || `Shop ${inv.shop_id}`;
            const productName = inv.product_name || prod.name || `Product ${inv.product_id}`;
            const price = prod.price;
            const total = Number(inv.total_quantity || 0);
            const shelf = Number(inv.shelf_quantity || 0);
            const shelfPct = total > 0 ? Math.round((shelf / total) * 100) : 0;
            const lowThreshold = 10;
            const isLow = shelfPct > 0 && shelfPct < lowThreshold;

            return (
              <div key={inv.inventory_id} className="bg-white rounded-xl shadow border overflow-hidden">
                <div className="h-40 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                  <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7l9-4 9 4v10l-9 4-9-4z" />
                  </svg>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-800">{productName}</h4>
                      <p className="text-sm text-gray-500">{prod.type || inv.product_type || ""}</p>
                    </div>
                    <button onClick={() => handleDeleteInventory(inv.inventory_id)} className="text-red-500 ml-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H3a1 1 0 100 2h14a1 1 0 100-2h-2V3a1 1 0 00-1-1H6zm2 6a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 10-2 0v6a1 1 0 102 0V8z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div>
                      {price ? <p className="text-xl font-bold">₹{price}</p> : <div className="h-6" />}
                    </div>

                    <div>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${isLow ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                        {shelf} in stock
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <button onClick={() => updateInventoryCount(inv.inventory_id, -1)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded">-</button>
                    <button onClick={() => updateInventoryCount(inv.inventory_id, 1)} className="flex-1 bg-black text-white py-2 rounded">+</button>
                  </div>

                  <div className="mt-3">
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${shelfPct}%` }} />
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
      </div>
    </>
  );
}
