import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import API from "../utils/api";

export default function Products() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const res = await API.get("/products");
      setProducts(res.data);
    };
    fetchProducts();
  }, []);

  return (
    <>
      <Navbar />
      <div className="p-6">
        <h2 className="text-2xl mb-4">All Products</h2>
        <ul>
          {products.map((p) => (
            <li key={p.product_id} className="border-b py-2">
              {p.name} — ₹{p.price} ({p.type})
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
