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
  const [lowStockItems, setLowStockItems] = useState([]);
  const [showLowStockAlert, setShowLowStockAlert] = useState(false);
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

      const productById = {};
      productsRes.data.forEach((p) => (productById[p.product_id] = p));
      const totalValue = inventoryRes.data.reduce((sum, inv) => {
        const price = productById[inv.product_id]?.price || 0;
        return sum + price * (inv.total_quantity || 0);
      }, 0);

      const categories = new Set(productsRes.data.map((p) => p.type)).size;

      const minAbsolute = 5;
      const lowItems = inventoryRes.data.filter((inv) => {
        const total = Number(inv.total_quantity || 0);
        const shelf = Number(inv.shelf_quantity || 0);
        if (shelf < minAbsolute) return true;
        if (total > 0 && shelf / total < 0.1) return true;
        return false;
      });

      setSummary({ totalItems: totalQuantity, totalValue, categories, lowStockCount: lowItems.length });
      // map low items to display-friendly shape
      const mappedLow = lowItems.map((inv) => ({
        inventory_id: inv.inventory_id,
        product_name: inv.product_name || productById[inv.product_id]?.name || `Product ${inv.product_id}`,
        total: inv.total_quantity || 0,
        shelf: inv.shelf_quantity || 0,
        shop_name: inv.shop_name || `Shop ${inv.shop_id}`,
      }));
      setLowStockItems(mappedLow);
      setShowLowStockAlert(mappedLow.length > 0);

      const recent = [...inventoryRes.data]
        .sort((a, b) => (b.inventory_id || 0) - (a.inventory_id || 0))
        .slice(0, 10)
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

  // Derived KPI values computed from fetched data
  const totalInventoryRecords = stats.totalInventory || 0;
  const totalProducts = stats.totalProducts || 0;
  const totalUnits = summary.totalItems || 0; // total units across inventory

  // low stock items already computed in summary.lowStockCount
  const lowItemsCount = summary.lowStockCount || 0;
  const stockoutRate = totalInventoryRecords ? ((lowItemsCount / totalInventoryRecords) * 100).toFixed(2) : "0.00";

  // returned units: sum of units in recentActivity (proxy for recent returns/receipts)
  const returnedUnits = recentActivity.reduce((s, r) => s + Number(r.units || 0), 0);
  const returnRate = totalUnits ? ((returnedUnits / Math.max(1, totalUnits)) * 100).toFixed(2) : "0.00";

  // backorder rate: proportion of units not on shelf (i.e., total - shelf) as percent of total units
  const backorderRate = totalUnits ? (((totalUnits - stats.shelfQuantity) / Math.max(1, totalUnits)) * 100).toFixed(2) : "0.00";

  // On Time Shipments: heuristic using inventory records with created_at in the recent window
  const now = Date.now();
  const WINDOW_DAYS = 30;
  const windowMs = WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const recentCount = (() => {
    try {
      return (/* count inventory records with created_at within window */
        recentActivity.filter((r) => r.date && (new Date(r.date)).getTime() >= now - windowMs).length
      );
    } catch (e) {
      return 0;
    }
  })();
  const onTimePct = totalInventoryRecords ? Math.round((recentCount / totalInventoryRecords) * 10000) / 100 : 0; // two decimals
  const withinTimeCount = recentCount;
  const outOfTimeCount = Math.max(0, totalInventoryRecords - recentCount);

  return (
    <>
      <Navbar />
      <div className="p-6 space-y-6 bg-gray-50">
        {/* Top KPI row like screenshot */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between border-l-4 border-green-400">
            <div>
              <div className="text-xs text-gray-500">Stockout Rate</div>
              <div className="text-2xl font-semibold text-green-600 mt-1">{stockoutRate}%</div>
              <div className="text-sm text-gray-400 mt-1">{summary.lowStockCount} Out of Stock Products</div>
            </div>
            <div className="text-green-200 text-3xl font-bold">↑</div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between border-l-4 border-indigo-400">
            <div>
              <div className="text-xs text-gray-500">Return Rate</div>
              <div className="text-2xl font-semibold text-indigo-600 mt-1">{returnRate}%</div>
              <div className="text-sm text-gray-400 mt-1">{returnedUnits} Returned Units</div>
            </div>
            <div className="text-indigo-200 text-3xl font-bold">↺</div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between border-l-4 border-teal-400">
            <div>
              <div className="text-xs text-gray-500">Returned Units</div>
              <div className="text-2xl font-semibold text-teal-600 mt-1">{returnedUnits}</div>
              <div className="text-sm text-gray-400 mt-1">{stats.totalInventory} Inventory Records</div>
            </div>
            <div className="text-teal-200 text-3xl font-bold">↺</div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between border-l-4 border-red-400">
            <div>
              <div className="text-xs text-gray-500">Backorder Rate</div>
              <div className="text-2xl font-semibold text-red-600 mt-1">{backorderRate}%</div>
              <div className="text-sm text-gray-400 mt-1">{stats.totalProducts} Total Products</div>
            </div>
            <div className="text-red-200 text-3xl font-bold">!</div>
          </div>
        </div>

        {/* Main content: charts and tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Inventory carrying cost (bar chart placeholder) */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Inventory carrying cost</h3>
              <div className="text-sm text-gray-500">includes Storage, Handling, Administrative, Damage and Loss costs.</div>
            </div>

            {/* simple bar chart using shopStats */}
            <div className="w-full h-40 flex items-end gap-4">
              {shopStats.length === 0 ? (
                <div className="text-gray-400">No data</div>
              ) : (
                shopStats.slice(0, 6).map((s, idx) => {
                  const value = s.totalQuantity || 0;
                  const max = Math.max(...shopStats.map((x) => x.totalQuantity || 0), 1);
                  const h = Math.round((value / max) * 100);
                  return (
                    <div key={s.shop_id || idx} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-green-200 rounded-t" style={{ height: `${h}%` }} />
                      <div className="text-xs text-gray-600 mt-2 truncate">{s.shop_name}</div>
                    </div>
                  );
                })
              )}
            </div>

            {/* three sample summary numbers below chart */}
            <div className="flex gap-4 mt-6">
              <div className="flex-1 bg-gray-50 p-3 rounded">
                <div className="text-xs text-gray-500">Warehouse 1</div>
                <div className="text-lg font-semibold mt-1">{shopStats[0]?.totalQuantity || 0}</div>
              </div>
              <div className="flex-1 bg-gray-50 p-3 rounded">
                <div className="text-xs text-gray-500">Warehouse 2</div>
                <div className="text-lg font-semibold mt-1">{shopStats[1]?.totalQuantity || 0}</div>
              </div>
              <div className="flex-1 bg-gray-50 p-3 rounded">
                <div className="text-xs text-gray-500">Warehouse 3</div>
                <div className="text-lg font-semibold mt-1">{shopStats[2]?.totalQuantity || 0}</div>
              </div>
            </div>
          </div>
          
          {/* Right: On Time Shipments donut and summary card 
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">On Time Shipments</h3>
            <div className="flex flex-col items-center">
              <div className="w-40 h-40 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="w-32 h-32">
                  <path d="M18 2a16 16 0 1 0 16 16A16 16 0 0 0 18 2" fill="#f3f4f6" />
                  <path d="M18 2a16 16 0 1 0 16 16A16 16 0 0 0 18 2" fill="none" stroke="#10b981" strokeWidth="6" strokeDasharray={`${onTimePct} ${100 - onTimePct}`} strokeDashoffset="25" strokeLinecap="round" transform="rotate(-90 18 18)" />
                </svg>
              </div>
              <div className="text-sm text-gray-500 mt-2">Within Time Limit (last {WINDOW_DAYS}d)</div>
              <div className="text-2xl font-semibold text-green-600 mt-1">{onTimePct}%</div>
              <div className="text-xs text-gray-400 mt-2">Within Time Limit: <span className="font-semibold">{withinTimeCount}</span> • Out of Time Limit: <span className="font-semibold">{outOfTimeCount}</span></div>
            </div>
          </div>
          */}
        </div>

        {/* Product Stock Details table (like screenshot) */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-md font-medium mb-3">Product Stock Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-sm text-gray-500 border-b">
                <tr>
                  <th className="py-2">Product</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Units in Hand</th>
                  <th className="py-2">Units On Order</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.length === 0 ? (
                  <tr><td className="py-4 text-gray-400" colSpan="4">No recent stock records</td></tr>
                ) : (
                  recentActivity.slice(0, 6).map((r) => (
                    <tr key={r.inventory_id} className="border-b">
                      <td className="py-3 font-medium">{r.product_name}</td>
                      <td className="py-3 text-sm text-gray-500">{r.date ? new Date(r.date).toLocaleDateString() : "—"}</td>
                      <td className="py-3">{r.units}</td>
                      <td className="py-3"> {Math.max(0, Math.round(r.units * 0.7))} </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity - keep this part as requested */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium">Recent Activity</h3>
            <div className="text-sm text-gray-500">Latest inventory events</div>
          </div>

          <ul className="divide-y">
            {recentActivity.length === 0 ? (
              <li className="py-4 text-gray-500">No recent activity</li>
            ) : (
              recentActivity.map((r) => (
                <li key={r.inventory_id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" d="M3 7l9-4 9 4v10l-9 4-9-4z"/></svg>
                    <div>
                      <div className="font-semibold text-gray-800">{r.product_name}</div>
                      <div className="text-xs text-gray-500">{r.date ? new Date(r.date).toLocaleString() : "Added recently"}</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700">{r.units} units</div>
                </li>
              ))
            )}
          </ul>
        </div>
      {/* Low stock alert modal */}
      {showLowStockAlert && lowStockItems.length > 0 && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded shadow-lg w-11/12 max-w-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Low Stock Alert</h3>
              <button className="text-gray-500" onClick={() => setShowLowStockAlert(false)}>Dismiss</button>
            </div>
            <p className="text-sm text-gray-600 mb-4">The following products have low stock (below threshold):</p>
            <ul className="divide-y max-h-60 overflow-auto">
              {lowStockItems.map((it) => (
                <li key={it.inventory_id} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{it.product_name}</div>
                    <div className="text-xs text-gray-500">{it.shop_name}</div>
                  </div>
                  <div className="text-sm text-gray-700">Total: {it.total} • Shelf: {it.shelf}</div>
                </li>
              ))}
            </ul>
            <div className="mt-4 text-right">
              <button onClick={() => setShowLowStockAlert(false)} className="bg-indigo-600 text-white px-4 py-2 rounded">OK</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
