import React from "react";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  return (
    <>
      <Navbar />
      <div className="p-6">
        <h2 className="text-3xl font-semibold">Welcome to your Dashboard</h2>
        <p className="mt-4 text-gray-600">
          Manage shops, products, and inventory easily.
        </p>
      </div>
    </>
  );
}
