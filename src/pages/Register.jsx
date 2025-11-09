import React, { useState } from "react";
import API from "../utils/api";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

export default function Register() {
  const [step, setStep] = useState(1); // 1: Owner details, 2: Shop details
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Owner form
  const [ownerForm, setOwnerForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Shop form
  const [shopForm, setShopForm] = useState({
    shop_name: "",
    type: "",
    location: "",
    city: "",
    street: "",
    state: "",
    country: "",
    shelf_depth: "",
  });

  const [ownerId, setOwnerId] = useState(null);

  const handleOwnerChange = (e) =>
    setOwnerForm({ ...ownerForm, [e.target.name]: e.target.value });

  const handleShopChange = (e) =>
    setShopForm({ ...shopForm, [e.target.name]: e.target.value });

  const handleOwnerSubmit = async (e) => {
    e.preventDefault();

    if (ownerForm.password !== ownerForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (ownerForm.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/owners/register", {
        username: ownerForm.username,
        email: ownerForm.email,
        password: ownerForm.password,
      });

      setOwnerId(res.data.ownerId);
      toast.success("Account created! Now set up your shop");
      setStep(2);
    } catch (err) {
      const msg = err?.response?.data?.message || "Error registering";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleShopSubmit = async (e) => {
    e.preventDefault();

    if (!shopForm.shop_name.trim() || !shopForm.city.trim()) {
      toast.error("Shop name and city are required");
      return;
    }

    setLoading(true);
    try {
      // Login first to get token
      const loginRes = await API.post("/owners/login", {
        email: ownerForm.email,
        password: ownerForm.password,
      });
      
      localStorage.setItem("token", loginRes.data.token);

      // Create shop
      await API.post("/shops", {
        ...shopForm,
        owner_id: ownerId,
      });

      toast.success("Shop created successfully! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err) {
      const msg = err?.response?.data?.message || "Error creating shop";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6">
      <div className="w-full max-w-2xl">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className={`flex items-center ${step >= 1 ? 'text-emerald-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-emerald-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="ml-2 font-medium">Account</span>
            </div>
            <div className={`w-24 h-1 mx-4 ${step >= 2 ? 'bg-emerald-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${step >= 2 ? 'text-emerald-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-emerald-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Shop Setup</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          {/* Step 1: Owner Registration */}
          {step === 1 && (
            <form onSubmit={handleOwnerSubmit}>
              <h2 className="text-2xl font-bold mb-6 text-emerald-600 text-center">
                Create Owner Account
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    name="username"
                    value={ownerForm.username}
                    onChange={handleOwnerChange}
                    placeholder="Your name"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={ownerForm.email}
                    onChange={handleOwnerChange}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    name="password"
                    type="password"
                    value={ownerForm.password}
                    onChange={handleOwnerChange}
                    placeholder="At least 6 characters"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    name="confirmPassword"
                    type="password"
                    value={ownerForm.confirmPassword}
                    onChange={handleOwnerChange}
                    placeholder="Repeat password"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full mt-6 flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-white font-medium
                  ${loading ? "bg-emerald-300 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"}`}
              >
                {loading ? "Creating Account..." : "Continue to Shop Setup →"}
              </button>

              <p className="text-sm mt-4 text-center text-gray-500">
                Already have an account?{" "}
                <Link to="/login" className="text-emerald-600 hover:underline">
                  Login
                </Link>
              </p>
            </form>
          )}

          {/* Step 2: Shop Setup */}
          {step === 2 && (
            <form onSubmit={handleShopSubmit}>
              <h2 className="text-2xl font-bold mb-6 text-emerald-600 text-center">
                Set Up Your Shop
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shop Name *
                  </label>
                  <input
                    name="shop_name"
                    value={shopForm.shop_name}
                    onChange={handleShopChange}
                    placeholder="My Grocery Store"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shop Type
                  </label>
                  <select
                    name="type"
                    value={shopForm.type}
                    onChange={handleShopChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="">Select type</option>
                    <option value="Grocery">Grocery</option>
                    <option value="Convenience">Convenience Store</option>
                    <option value="Supermarket">Supermarket</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location/Address
                  </label>
                  <input
                    name="location"
                    value={shopForm.location}
                    onChange={handleShopChange}
                    placeholder="123 Main St"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    name="city"
                    value={shopForm.city}
                    onChange={handleShopChange}
                    placeholder="Mumbai"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    name="state"
                    value={shopForm.state}
                    onChange={handleShopChange}
                    placeholder="Maharashtra"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street
                  </label>
                  <input
                    name="street"
                    value={shopForm.street}
                    onChange={handleShopChange}
                    placeholder="MG Road"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    name="country"
                    value={shopForm.country}
                    onChange={handleShopChange}
                    placeholder="India"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shelf Depth (cm)
                  </label>
                  <input
                    name="shelf_depth"
                    type="number"
                    value={shopForm.shelf_depth}
                    onChange={handleShopChange}
                    placeholder="30"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-white font-medium
                    ${loading ? "bg-emerald-300 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"}`}
                >
                  {loading ? "Setting up..." : "Complete Setup"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
