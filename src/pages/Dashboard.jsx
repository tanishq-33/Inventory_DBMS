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
  const [summary, setSummary] = useState({ totalItems: 0, totalValue: 0, categories: 0, lowStockCount: 0 });
  const [lowStockItem, setLowStockItem] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

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

      // total value = sum(product.price * inventory.total_quantity)
      const productById = {};
      productsRes.data.forEach((p) => (productById[p.product_id] = p));
      const totalValue = inventoryRes.data.reduce((sum, inv) => {
        const price = productById[inv.product_id]?.price || 0;
        return sum + price * (inv.total_quantity || 0);
      }, 0);

      // categories (distinct product types)
      const categories = new Set(productsRes.data.map((p) => p.type)).size;

      // low stock: define minimum threshold either by absolute (5) or percent (10%)
      const minAbsolute = 5;
      const lowItems = inventoryRes.data.filter((inv) => {
        const total = Number(inv.total_quantity || 0);
        const shelf = Number(inv.shelf_quantity || 0);
        if (shelf < minAbsolute) return true;
        if (total > 0 && shelf / total < 0.1) return true;
        return false;
      });

      setSummary({ totalItems: totalQuantity, totalValue, categories, lowStockCount: lowItems.length });
      setLowStockItem(lowItems.length > 0 ? lowItems[0] : null);

      const recent = [...inventoryRes.data]
        .sort((a, b) => (b.inventory_id || 0) - (a.inventory_id || 0))
        .slice(0, 6)
        .map((inv) => ({
          inventory_id: inv.inventory_id,
          product_name: inv.product_name || productById[inv.product_id]?.name || `Product ${inv.product_id}`,
          units: inv.total_quantity || 0,
          date: inv.created_at || null,
        }));
      setRecentActivity(recent);

      setStats({
        totalShops,
        totalProducts,
        totalInventory,
        totalQuantity,
        shelfQuantity,
      });
      const shopMap = {};
      shopsRes.data.forEach((s) => {
        shopMap[s.shop_id] = { shop_id: s.shop_id, shop_name: s.shop_name, totalQuantity: 0, shelfQuantity: 0, productCountSet: new Set() };
      });

      inventoryRes.data.forEach((inv) => {
        const sid = inv.shop_id;
        if (!shopMap[sid]) {
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
      <div className="p-8 bg-gray-50">
        <h2 className="text-3xl font-semibold mb-6 text-gray-800">
          Retail Dashboard
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* left column: summary cards stacked */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white shadow rounded-xl p-6 text-center border-t-4 border-blue-500">
              <h3 className="text-sm text-gray-500">Total Items</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{summary.totalItems}</p>
            </div>

            <div className="bg-white shadow rounded-xl p-6 text-center border-t-4 border-green-500">
              <h3 className="text-sm text-gray-500">Total Value</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">₹{summary.totalValue?.toFixed ? summary.totalValue.toFixed(2) : summary.totalValue}</p>
            </div>

            <div className="bg-white shadow rounded-xl p-6 text-center border-t-4 border-purple-500">
              <h3 className="text-sm text-gray-500">Categories</h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">{summary.categories}</p>
            </div>

            <div className="bg-white shadow rounded-xl p-6 text-center border-t-4 border-red-500">
              <h3 className="text-sm text-gray-500">Low Stock</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">{summary.lowStockCount}</p>
            </div>
          </div>

          {/* right column: stock overview spans two columns on md */}
          <div className="md:col-span-2">
            <div className="bg-white shadow rounded-xl p-6 border-t-4 border-yellow-500">
              <h3 className="text-xl font-medium text-gray-700 mb-4">🧮 Stock Count Overview</h3>

              <div className="flex flex-col lg:flex-row gap-6 items-center">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <h4 className="text-gray-500 text-md">Total Stock Quantity</h4>
                    <p className="text-2xl font-semibold text-yellow-600 mt-2">{stats.totalQuantity}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <h4 className="text-gray-500 text-md">Shelf Quantity</h4>
                    <p className="text-2xl font-semibold text-yellow-600 mt-2">{stats.shelfQuantity}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <h4 className="text-gray-500 text-md">Warehouse Stock</h4>
                    <p className="text-2xl font-semibold text-yellow-600 mt-2">{stats.totalQuantity - stats.shelfQuantity}</p>
                  </div>
                </div>

                <div className="w-56 flex-shrink-0 flex items-center justify-center">
                  {/* Simple SVG donut chart */}
                  {(() => {
                    const shelf = Number(stats.shelfQuantity || 0);
                    const warehouse = Number((stats.totalQuantity || 0) - shelf);
                    const total = shelf + warehouse;
                    const pct = total > 0 ? Math.round((shelf / total) * 100) : 0;
                    const r = 60;
                    const c = 2 * Math.PI * r;
                    const dash = (pct / 100) * c;
                    const gap = c - dash;
                    return (
                      <svg width="140" height="140" viewBox="0 0 160 160" aria-hidden>
                        <g transform="translate(80,80)">
                          <circle r={r} fill="transparent" stroke="#f3f4f6" strokeWidth="18" />
                          <circle r={r} fill="transparent" stroke="#f59e0b" strokeWidth="18" strokeLinecap="round"
                            strokeDasharray={`${dash} ${gap}`} strokeDashoffset={c * 0.25} transform="rotate(-90)" />
                          <text x="0" y="6" textAnchor="middle" className="text-sm" style={{ fontSize: 18, fontWeight: 700, fill: '#111827' }}>{pct}%</text>
                          <text x="0" y="28" textAnchor="middle" className="text-xs" style={{ fill: '#6b7280' }}>on shelf</text>
                        </g>
                      </svg>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Low stock alert */}
      {lowStockItem ? (
        <div className="mt-6 p-4 rounded-lg bg-red-50 border border-red-100 text-center text-red-700">
          <div className="flex items-center justify-center gap-3">
            <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <div>
              <div className="font-semibold">Low Stock Alert</div>
              <div className="text-sm">{(lowStockItem.product_name || `Product ${lowStockItem.product_id}`)} - Only {lowStockItem.shelf_quantity} left (Min: 5)</div>
            </div>
          </div>
        </div>
      ) : null}

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
      
      {/* Recent Activity */}
      <div className="mt-8">
        <h3 className="text-xl font-medium text-gray-700 mb-4">Recent Activity</h3>
        <div className="bg-white rounded-xl shadow border">
          <ul>
            {recentActivity.map((r) => (
              <li key={r.inventory_id} className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-4">
                  <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" d="M3 7l9-4 9 4v10l-9 4-9-4z"/></svg>
                  <div>
                    <div className="font-semibold text-gray-800">{r.product_name}</div>
                    <div className="text-sm text-gray-500">{r.date ? new Date(r.date).toLocaleDateString() : "Added recently"}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-700">{r.units} units</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
