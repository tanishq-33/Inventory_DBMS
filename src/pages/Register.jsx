import React, { useState, useEffect } from "react";
import API from "../utils/api";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    name: "",
    phone_number: "",
    gender: "Male",
    dob: "",
    age: "",
    aadhar_number: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // auto-calc age from dob when dob changes
    if (!form.dob) return;
    const dobDate = new Date(form.dob);
    if (isNaN(dobDate)) return;
    const diff = Date.now() - dobDate.getTime();
    const age = Math.floor(new Date(diff).getUTCFullYear() - 1970);
    setForm((f) => ({ ...f, age: age >= 0 ? age : "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.dob]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.email.trim() || !form.password) {
      toast.error("Please fill username, email and password");
      return;
    }

    setLoading(true);
    try {
      // send full form matching owner schema
      await API.post("/owners/register", {
        username: form.username,
        email: form.email,
        password: form.password,
        name: form.name || null,
        phone_number: form.phone_number || null,
        gender: form.gender || null,
        dob: form.dob || null,
        age: form.age ? Number(form.age) : null,
        aadhar_number: form.aadhar_number || null,
      });
      toast.success("Registration successful — redirecting to login");
      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      const msg = err?.response?.data?.message || "Error registering";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleRegister}
          className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100"
        >
          <h2 className="text-2xl font-bold mb-4 text-emerald-600 text-center">
            Create Owner Account
          </h2>

          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="Your username"
            className="w-full mb-3 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            required
          />

          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className="w-full mb-3 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            required
          />

          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Create a strong password"
            className="w-full mb-4 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            required
          />

          <hr className="my-3" />

          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full name
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Full name"
            className="w-full mb-3 px-4 py-2 rounded-lg border border-gray-200"
          />

          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone number
          </label>
          <input
            name="phone_number"
            value={form.phone_number}
            onChange={handleChange}
            placeholder="+91xxxxxxxxxx"
            className="w-full mb-3 px-4 py-2 rounded-lg border border-gray-200"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full mb-3 px-3 py-2 rounded-lg border border-gray-200"
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of birth
              </label>
              <input
                name="dob"
                type="date"
                value={form.dob}
                onChange={handleChange}
                className="w-full mb-3 px-3 py-2 rounded-lg border border-gray-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age
              </label>
              <input
                name="age"
                type="number"
                value={form.age}
                onChange={handleChange}
                placeholder="Age"
                className="w-full mb-3 px-3 py-2 rounded-lg border border-gray-200"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aadhar Number
              </label>
              <input
                name="aadhar_number"
                value={form.aadhar_number}
                onChange={handleChange}
                placeholder="Aadhar number"
                className="w-full mb-3 px-3 py-2 rounded-lg border border-gray-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-white 
              ${loading ? "bg-emerald-300 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"}`}
            aria-busy={loading}
          >
            {loading ? (
              <svg
                className="w-5 h-5 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            ) : null}
            <span>{loading ? "Creating..." : "Register"}</span>
          </button>

          <p className="text-sm mt-4 text-center text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="text-emerald-600 hover:underline">
              Login
            </Link>
          </p>
        </form>
      </div>

      {/* global ToastContainer added in App.jsx */}
    </div>
  );
}
