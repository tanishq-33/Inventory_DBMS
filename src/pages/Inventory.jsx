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

        {/* Inventory Table */}
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Shop</th>
              <th className="border p-2">Product</th>
              <th className="border p-2">Total Qty</th>
              <th className="border p-2">Shelf Qty</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((inv) => (
              <tr key={inv.inventory_id}>
                <td className="border p-2">{inv.shop_name || `Shop ${inv.shop_id}`}</td>
                <td className="border p-2">{inv.product_name || `Product ${inv.product_id}`}</td>
                <td className="border p-2">{inv.total_quantity}</td>
                <td className="border p-2">{inv.shelf_quantity}</td>
                <td className="border p-2">
                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded"
                    onClick={() => handleDeleteInventory(inv.inventory_id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
