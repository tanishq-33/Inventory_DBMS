import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import API from "../utils/api";
import { toast } from "react-toastify";

export default function Shops() {
  const [shops, setShops] = useState([]);
  const [newShop, setNewShop] = useState({
    shop_name: "",
    city: "",
    state: "",
    country: "",
    location: "",
    type: "",
  });

  // Fetch all shops
  const fetchShops = async () => {
    const res = await API.get("/shops");
    setShops(res.data);
  };

  useEffect(() => {
    fetchShops();
  }, []);

  // Add a new shop
  const handleAddShop = async (e) => {
    e.preventDefault();
    try {
      await API.post("/shops", newShop);
      toast.success("Shop added successfully!");
      setNewShop({ shop_name: "", city: "", state: "", country: "", location: "", type: "" });
      fetchShops();
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.response?.data?.error || err.message;
      toast.error("Error adding shop: " + serverMsg);
    }
  };

  // Delete a shop
  const handleDeleteShop = async (id) => {
    if (!window.confirm("Delete this shop?")) return;
    try {
      await API.delete(`/shops/${id}`);
      fetchShops();
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.message || "Error deleting shop";
      toast.error(serverMsg);
    }
  };

  return (
    <>
      <Navbar />
      <div className="p-6">
        <h2 className="text-2xl mb-4 font-semibold">Manage Shops</h2>

        {/* Add Shop Form */}
        <form onSubmit={handleAddShop} className="bg-white p-4 rounded shadow mb-6 w-2/3">
          <h3 className="text-lg font-medium mb-3">Add New Shop</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Shop Name"
              className="border p-2 rounded"
              value={newShop.shop_name}
              onChange={(e) => setNewShop({ ...newShop, shop_name: e.target.value })}
            />
            <input
              type="text"
              placeholder="City"
              className="border p-2 rounded"
              value={newShop.city}
              onChange={(e) => setNewShop({ ...newShop, city: e.target.value })}
            />
            <input
              type="text"
              placeholder="State"
              className="border p-2 rounded"
              value={newShop.state}
              onChange={(e) => setNewShop({ ...newShop, state: e.target.value })}
            />
            <input
              type="text"
              placeholder="Country"
              className="border p-2 rounded"
              value={newShop.country}
              onChange={(e) => setNewShop({ ...newShop, country: e.target.value })}
            />
            <input
              type="text"
              placeholder="Location"
              className="border p-2 rounded"
              value={newShop.location}
              onChange={(e) => setNewShop({ ...newShop, location: e.target.value })}
            />
            <input
              type="text"
              placeholder="Type"
              className="border p-2 rounded"
              value={newShop.type}
              onChange={(e) => setNewShop({ ...newShop, type: e.target.value })}
            />
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded mt-4">
            Add Shop
          </button>
        </form>

        {/* Shop List */}
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Shop Name</th>
              <th className="border p-2">City</th>
              <th className="border p-2">Country</th>
              <th className="border p-2">Type</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shops.map((shop) => (
              <tr key={shop.shop_id}>
                <td className="border p-2">{shop.shop_name}</td>
                <td className="border p-2">{shop.city}</td>
                <td className="border p-2">{shop.country}</td>
                <td className="border p-2">{shop.type}</td>
                <td className="border p-2">
                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded"
                    onClick={() => handleDeleteShop(shop.shop_id)}
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
