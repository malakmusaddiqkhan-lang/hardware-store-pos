// components/layout/AppLayout.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { navItems } from "@/lib/navigation";
import { 
  Menu, 
  X, 
  LogOut, 
  Store 
} from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
  userRole?: "OWNER" | "STAFF";
  userName?: string;
}

export default function AppLayout({ 
  children, 
  userRole = "OWNER",
  userName = "Hardware Store Owner"
}: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Enforce login session protection
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (isLoggedIn !== "true") {
      router.push("/login");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    router.push("/login");
  };

  if (!authorized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-sm">
        Loading store...
      </div>
    );
  }

  const filteredNav = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-100 border-r border-slate-800 shrink-0 justify-between">
        <div>
          {/* Brand Header with Son's Photo Monogram */}
          <div className="p-4 border-b border-slate-800 flex items-center space-x-3">
            <img
              src="/logo.jpeg"
              alt="Store Monogram"
              className="w-11 h-11 rounded-full object-cover border-2 border-blue-500 shadow-md shrink-0"
            />
            <div>
              <h1 className="font-bold text-sm tracking-wide leading-tight">M Rasool Khan</h1>
              <p className="text-xs text-slate-400 capitalize">{userRole.toLowerCase()} Mode</p>
            </div>
          </div>

          <nav className="p-3 space-y-1 overflow-y-auto">
            {filteredNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Info & Logout */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <img
              src="/logo.jpg"
              alt="Owner"
              className="w-7 h-7 rounded-full object-cover border border-slate-600 shrink-0"
            />
            <span className="text-xs text-slate-300 truncate">{userName}</span>
          </div>
          <button 
            onClick={handleLogout}
            title="Logout" 
            className="text-slate-400 hover:text-red-400 p-1.5 rounded-md transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            src="/logo.jpg"
            alt="Store Monogram"
            className="w-8 h-8 rounded-full object-cover border-2 border-blue-500 shadow-sm"
          />
          <div>
            <span className="font-bold text-sm tracking-wide block">Hardware POS</span>
            <span className="text-[10px] text-slate-400">Odigram Bazaar, Swat</span>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-md text-slate-300 hover:bg-slate-800"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* MOBILE SLIDE-OVER DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className="w-4/5 max-w-sm bg-slate-900 text-white h-full p-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-800">
                <span className="font-semibold text-sm text-slate-400">Navigation Menu</span>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <nav className="space-y-1">
                {filteredNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium ${
                        isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <Icon size={20} />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="pt-4 border-t border-slate-800">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 py-2.5 bg-slate-800 hover:bg-red-600/20 text-red-400 rounded-lg text-sm font-medium transition-colors"
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* MOBILE BOTTOM TAB BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-slate-900 border-t border-slate-800 flex items-center justify-around px-2 py-1">
        {filteredNav.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1.5 px-3 min-w-[64px] rounded-md text-[10px] font-medium transition-colors ${
                isActive ? "text-blue-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon size={20} className="mb-0.5" />
              <span>{item.title.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>

    </div>
  );
}