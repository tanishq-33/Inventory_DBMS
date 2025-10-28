import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import API from "../utils/api";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalShops: 0,
    totalProducts: 0,
    totalInventory: 0,
    totalQuantity: 0,
    shelfQuantity: 0,
  });
  const [shopStats, setShopStats] = useState([]);

  const fetchData = async () => {
    try {
      const [shopsRes, productsRes, inventoryRes] = await Promise.all([
        API.get("/shops"),
        API.get("/products"),
        API.get("/inventory"),
      ]);

      const totalShops = shopsRes.data.length;
      const totalProducts = productsRes.data.length;
      const totalInventory = inventoryRes.data.length;

      const totalQuantity = inventoryRes.data.reduce(
        (sum, item) => sum + (item.total_quantity || 0),
        0
      );
      const shelfQuantity = inventoryRes.data.reduce(
        (sum, item) => sum + (item.shelf_quantity || 0),
        0
      );

      setStats({
        totalShops,
        totalProducts,
        totalInventory,
        totalQuantity,
        shelfQuantity,
      });
      // compute per-shop aggregates for a breakdown view
      const shopMap = {};
      shopsRes.data.forEach((s) => {
        shopMap[s.shop_id] = { shop_id: s.shop_id, shop_name: s.shop_name, totalQuantity: 0, shelfQuantity: 0, productCountSet: new Set() };
      });

      inventoryRes.data.forEach((inv) => {
        const sid = inv.shop_id;
        if (!shopMap[sid]) {
          // in case an inventory row references a shop not returned in shopsRes
          shopMap[sid] = { shop_id: sid, shop_name: `Shop ${sid}`, totalQuantity: 0, shelfQuantity: 0, productCountSet: new Set() };
        }
        shopMap[sid].totalQuantity += Number(inv.total_quantity || 0);
        shopMap[sid].shelfQuantity += Number(inv.shelf_quantity || 0);
        if (inv.product_id) shopMap[sid].productCountSet.add(inv.product_id);
      });

      const shopBreakdown = Object.values(shopMap).map((s) => ({
        shop_id: s.shop_id,
        shop_name: s.shop_name,
        totalQuantity: s.totalQuantity,
        shelfQuantity: s.shelfQuantity,
        productCount: s.productCountSet.size,
      }));

      setShopStats(shopBreakdown);
    } catch (err) {
      console.error("Error fetching dashboard data", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      <Navbar />
      <div className="p-8 bg-gray-50 min-h-screen">
        <h2 className="text-3xl font-semibold mb-6 text-gray-800">
          Retail Dashboard
        </h2>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white shadow rounded-xl p-6 text-center border-t-4 border-blue-500">
            <h3 className="text-lg text-gray-600">Total Shops</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {stats.totalShops}
            </p>
          </div>

          <div className="bg-white shadow rounded-xl p-6 text-center border-t-4 border-green-500">
            <h3 className="text-lg text-gray-600">Total Products</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {stats.totalProducts}
            </p>
          </div>

          <div className="bg-white shadow rounded-xl p-6 text-center border-t-4 border-purple-500">
            <h3 className="text-lg text-gray-600">Inventory Records</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {stats.totalInventory}
            </p>
          </div>
        </div>

        {/* Stock Count Summary */}
        <div className="bg-white shadow rounded-xl p-6 border-t-4 border-yellow-500">
          <h3 className="text-xl font-medium text-gray-700 mb-4">
            🧮 Stock Count Overview
          </h3>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 bg-gray-50 p-4 rounded-lg text-center">
              <h4 className="text-gray-500 text-md">Total Stock Quantity</h4>
              <p className="text-2xl font-semibold text-yellow-600 mt-2">
                {stats.totalQuantity}
              </p>
            </div>

            <div className="flex-1 bg-gray-50 p-4 rounded-lg text-center">
              <h4 className="text-gray-500 text-md">Shelf Quantity</h4>
              <p className="text-2xl font-semibold text-yellow-600 mt-2">
                {stats.shelfQuantity}
              </p>
            </div>

            <div className="flex-1 bg-gray-50 p-4 rounded-lg text-center">
              <h4 className="text-gray-500 text-md">Warehouse Stock</h4>
              <p className="text-2xl font-semibold text-yellow-600 mt-2">
                {stats.totalQuantity - stats.shelfQuantity}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Shop breakdown */}
      <div className="mt-8">
        <h3 className="text-xl font-medium text-gray-700 mb-4">🏬 Inventory by Shop</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {shopStats.length === 0 ? (
            <div className="text-gray-500">No shop data</div>
          ) : (
            shopStats.map((s) => (
              <div key={s.shop_id} className="bg-white p-4 rounded-xl shadow border">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-md font-semibold text-gray-800">{s.shop_name}</h4>
                    <p className="text-sm text-gray-500">ID: {s.shop_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-indigo-600">{s.totalQuantity}</p>
                    <p className="text-xs text-gray-500">Total qty</p>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${s.totalQuantity ? Math.min(100, Math.round((s.shelfQuantity / s.totalQuantity) * 100)) : 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Shelf: {s.shelfQuantity}</span>
                    <span>Products: {s.productCount}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
