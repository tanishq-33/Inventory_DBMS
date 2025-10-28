import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import API from "../utils/api";

export default function Shops() {
  const [shops, setShops] = useState([]);

  useEffect(() => {
    const fetchShops = async () => {
      const res = await API.get("/shops");
      setShops(res.data);
    };
    fetchShops();
  }, []);

  return (
    <>
      <Navbar />
      <div className="p-6">
        <h2 className="text-2xl mb-4">Your Shops</h2>
        <ul>
          {shops.map((shop) => (
            <li key={shop.id} className="border-b py-2">
              {shop.shop_name} - {shop.city}, {shop.country}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
