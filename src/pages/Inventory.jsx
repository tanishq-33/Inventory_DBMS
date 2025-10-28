import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import API from "../utils/api";

export default function Inventory() {
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    const fetchInventory = async () => {
      const res = await API.get("/inventory");
      setInventory(res.data);
    };
    fetchInventory();
  }, []);

  return (
    <>
      <Navbar />
      <div className="p-6">
        <h2 className="text-2xl mb-4">Inventory List</h2>
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Inventory ID</th>
              <th className="p-2 border">Shop ID</th>
              <th className="p-2 border">Total Qty</th>
              <th className="p-2 border">Shelf Qty</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((inv) => (
              <tr key={inv.inventory_id}>
                <td className="p-2 border">{inv.inventory_id}</td>
                <td className="p-2 border">{inv.shop_id}</td>
                <td className="p-2 border">{inv.total_quantity}</td>
                <td className="p-2 border">{inv.shelf_quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
