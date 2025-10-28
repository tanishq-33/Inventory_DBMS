import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="bg-gray-900 text-white px-6 py-3 flex justify-between items-center">
      <h1 className="text-xl font-semibold">Inventory Scout</h1>
      <div className="space-x-6">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/shops">Shops</Link>
        <Link to="/products">Products</Link>
        <Link to="/inventory">Inventory</Link>
        <button onClick={logout} className="bg-red-600 px-3 py-1 rounded">
          Logout
        </button>
      </div>
    </nav>
  );
}
