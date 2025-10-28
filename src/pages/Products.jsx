import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import API from "../utils/api";
import { toast } from "react-toastify";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    company: "",
    price: "",
    type: "",
    dimensions: "",
  });

  const fetchProducts = async () => {
    const res = await API.get("/products");
    setProducts(res.data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await API.post("/products", newProduct);
      toast.success("Product added successfully!");
      setNewProduct({ name: "", company: "", price: "", type: "", dimensions: "" });
      fetchProducts();
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.message || "Error adding product";
      toast.error(serverMsg);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await API.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.message || "Error deleting product";
      toast.error(serverMsg);
    }
  };

  return (
    <>
      <Navbar />
      <div className="p-6">
        <h2 className="text-2xl mb-4 font-semibold">Manage Products</h2>

        {/* Add Product */}
        <form onSubmit={handleAddProduct} className="bg-white p-4 rounded shadow mb-6 w-2/3">
          <h3 className="text-lg font-medium mb-3">Add New Product</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Name"
              className="border p-2 rounded"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Company"
              className="border p-2 rounded"
              value={newProduct.company}
              onChange={(e) => setNewProduct({ ...newProduct, company: e.target.value })}
            />
            <input
              type="number"
              placeholder="Price"
              className="border p-2 rounded"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
            />
            <input
              type="text"
              placeholder="Type"
              className="border p-2 rounded"
              value={newProduct.type}
              onChange={(e) => setNewProduct({ ...newProduct, type: e.target.value })}
            />
            <input
              type="text"
              placeholder="Dimensions"
              className="border p-2 rounded"
              value={newProduct.dimensions}
              onChange={(e) => setNewProduct({ ...newProduct, dimensions: e.target.value })}
            />
          </div>
          <button className="bg-green-600 text-white px-4 py-2 rounded mt-4">
            Add Product
          </button>
        </form>

        {/* Product Table */}
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Name</th>
              <th className="border p-2">Company</th>
              <th className="border p-2">Price</th>
              <th className="border p-2">Type</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.product_id}>
                <td className="border p-2">{p.name}</td>
                <td className="border p-2">{p.company}</td>
                <td className="border p-2">₹{p.price}</td>
                <td className="border p-2">{p.type}</td>
                <td className="border p-2">
                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded"
                    onClick={() => handleDeleteProduct(p.product_id)}
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
