// app/login/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // If already logged in, send directly to dashboard
  useEffect(() => {
    if (localStorage.getItem("isLoggedIn") === "true") {
      router.push("/");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        localStorage.setItem("isLoggedIn", "true");
        router.push("/");
      } else {
        const data = await res.json();
        setError(data.error || "Invalid username or password");
      }
    } catch (err) {
      setError("Network error while signing in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-8 shadow-2xl text-slate-900">
        {/* Monogram & Store Title */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-600 shadow-md mb-3 bg-slate-100 flex items-center justify-center">
            <img
              src="/logo.jpeg"
              alt="Store Monogram"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <h1 className="text-xl font-extrabold uppercase tracking-wide">
            Hardware Store POS
          </h1>
          <p className="text-xs text-slate-500 mt-1">Ningolai, Swat</p>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Username
            </label>
            <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus-within:border-blue-600">
              <User size={16} className="text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                required
                placeholder="Enter owner username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Password
            </label>
            <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus-within:border-blue-600">
              <Lock size={16} className="text-slate-400 mr-2 shrink-0" />
              <input
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center justify-center space-x-2"
          >
            <span>{loading ? "Signing In..." : "Sign In to Store"}</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}