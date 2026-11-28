// app/page.tsx
"use client";

// app/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import {
  DollarSign,
  Wallet,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Receipt,
  Package,
  CalendarDays,
  CalendarRange,
  Calendar,
} from "lucide-react";
import Link from "next/link";

interface Sale {
  id: string;
  invoiceNumber: string;
  grandTotal: number;
  paymentMethod: string;
  createdAt: string;
  customer?: {
    name: string;
  };
  items: {
    quantity: number;
    unitCostPrice: number;
    unitPrice: number;
  }[];
}

interface Customer {
  id: string;
  currentBalance: number;
}

interface Product {
  id: string;
  stockQuantity: number;
  costPrice: number;
}

interface Expense {
  amount: number;
  createdAt?: string;
}

export default function DashboardPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentDate(new Date());
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [salesRes, custRes, prodRes, expRes] = await Promise.all([
        fetch("/api/sales"),
        fetch("/api/customers"),
        fetch("/api/products"),
        fetch("/api/expenses"),
      ]);

      const salesData = await salesRes.json();
      const custData = await custRes.json();
      const prodData = await prodRes.json();
      const expData = await expRes.json();

      if (Array.isArray(salesData)) setSales(salesData);
      if (Array.isArray(custData)) setCustomers(custData);
      if (Array.isArray(prodData)) setProducts(prodData);
      if (Array.isArray(expData)) setExpenses(expData);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to compute gross profit on a single sale
  const getSaleGrossProfit = (sale: Sale) => {
    const itemsCost = (sale.items || []).reduce(
      (sum, item) => sum + (item.unitCostPrice || 0) * item.quantity,
      0
    );
    return (sale.grandTotal || 0) - itemsCost;
  };

  // Safe client-only date boundaries (prevents Next.js 16 prerender new Date() error)
  const todayStr = currentDate ? currentDate.toDateString() : "";
  const startOfToday = currentDate
    ? new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
    : null;
  const sevenDaysAgo = startOfToday
    ? new Date(startOfToday.getFullYear(), startOfToday.getMonth(), startOfToday.getDate() - 6)
    : null;
  const startOfMonth = currentDate
    ? new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    : null;

  // Daily Profit (Today)
  const dailyGrossProfit = startOfToday
    ? sales
        .filter((s) => new Date(s.createdAt) >= startOfToday)
        .reduce((sum, s) => sum + getSaleGrossProfit(s), 0)
    : 0;
  const dailyExpenses = startOfToday
    ? expenses
        .filter((e) => e.createdAt && new Date(e.createdAt) >= startOfToday)
        .reduce((sum, e) => sum + (e.amount || 0), 0)
    : 0;
  const dailyProfit = dailyGrossProfit - dailyExpenses;

  // Weekly Profit (Last 7 Days)
  const weeklyGrossProfit = sevenDaysAgo
    ? sales
        .filter((s) => new Date(s.createdAt) >= sevenDaysAgo)
        .reduce((sum, s) => sum + getSaleGrossProfit(s), 0)
    : 0;
  const weeklyExpenses = sevenDaysAgo
    ? expenses
        .filter((e) => e.createdAt && new Date(e.createdAt) >= sevenDaysAgo)
        .reduce((sum, e) => sum + (e.amount || 0), 0)
    : 0;
  const weeklyProfit = weeklyGrossProfit - weeklyExpenses;

  // Monthly Profit (Current Calendar Month)
  const monthlyGrossProfit = startOfMonth
    ? sales
        .filter((s) => new Date(s.createdAt) >= startOfMonth)
        .reduce((sum, s) => sum + getSaleGrossProfit(s), 0)
    : 0;
  const monthlyExpenses = startOfMonth
    ? expenses
        .filter((e) => e.createdAt && new Date(e.createdAt) >= startOfMonth)
        .reduce((sum, e) => sum + (e.amount || 0), 0)
    : 0;
  const monthlyProfit = monthlyGrossProfit - monthlyExpenses;

  // Live Calculations
  const todaysSales = sales
    .filter((s) => todayStr && new Date(s.createdAt).toDateString() === todayStr)
    .reduce((sum, s) => sum + s.grandTotal, 0);

  const totalPendingDues = customers.reduce((sum, c) => sum + (c.currentBalance || 0), 0);
  const activeAccountsCount = customers.filter((c) => (c.currentBalance || 0) > 0).length;

  const totalRevenue = sales.reduce((sum, s) => sum + s.grandTotal, 0);
  let totalCost = 0;
  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      totalCost += (item.unitCostPrice || 0) * item.quantity;
    });
  });
  const grossProfit = totalRevenue - totalCost;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  // Total Inventory Purchasing Investment
  const totalInventoryValue = products.reduce(
    (sum, p) => sum + (p.costPrice || 0) * (p.stockQuantity || 0),
    0
  );

  const lowStockCount = products.filter((p) => p.stockQuantity <= 5).length;
  const recentSales = sales.slice(0, 5);

  const currentMonthLabel = currentDate
    ? currentDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "This Month";

  return (
    <AppLayout userRole="OWNER">
      <div>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Store Dashboard</h1>
          <p className="text-sm text-slate-500">Welcome back! Here's your live hardware store overview.</p>
        </div>

        {/* Live Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {/* Today's Sales */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Today's Sales</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><DollarSign size={20} /></div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">
              {loading ? "..." : `PKR ${todaysSales.toLocaleString()}`}
            </p>
            <span className="text-xs text-slate-400 mt-1 block">Live POS revenue today</span>
          </div>

          {/* Pending Dues */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Dues (Khaata)</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Wallet size={20} /></div>
            </div>
            <p className="text-2xl font-extrabold text-amber-600">
              {loading ? "..." : `PKR ${totalPendingDues.toLocaleString()}`}
            </p>
            <span className="text-xs text-slate-400 mt-1 block">{activeAccountsCount} active credit accounts</span>
          </div>

          {/* Net Profit */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Net Profit (Est.)</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><TrendingUp size={20} /></div>
            </div>
            <p className={`text-2xl font-extrabold ${netProfit >= 0 ? "text-blue-600" : "text-red-600"}`}>
              {loading ? "..." : `PKR ${netProfit.toLocaleString()}`}
            </p>
            <span className="text-xs text-slate-400 mt-1 block">Gross profit minus expenses</span>
          </div>

          {/* Total Inventory Purchasing Value */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Inventory Cost</span>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Package size={20} /></div>
            </div>
            <p className="text-2xl font-extrabold text-indigo-600">
              {loading ? "..." : `PKR ${totalInventoryValue.toLocaleString()}`}
            </p>
            <span className="text-xs text-slate-400 mt-1 block">Purchasing value of all stock</span>
          </div>

          {/* Low Stock Items */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Low Stock Items</span>
              <div className="p-2 bg-red-50 text-red-600 rounded-xl"><AlertTriangle size={20} /></div>
            </div>
            <p className="text-2xl font-extrabold text-red-600">
              {loading ? "..." : `${lowStockCount} Items`}
            </p>
            <span className="text-xs text-slate-400 mt-1 block">Requires inventory restock</span>
          </div>
        </div>

        {/* Daily, Weekly & Monthly Profit Record */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Profit Record (Daily / Weekly / Monthly)
              </h2>
              <p className="text-xs text-slate-500">
                Estimated profit based on sales minus item cost price and period expenses.
              </p>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full self-start sm:self-auto">
              {currentMonthLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Daily Profit */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                  Daily Profit (Today)
                </span>
                <p className={`text-xl font-extrabold mt-1 ${dailyProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {loading ? "..." : `PKR ${dailyProfit.toLocaleString()}`}
                </p>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Today&apos;s margin profit</span>
              </div>
              <div className="p-2.5 bg-emerald-100/70 text-emerald-700 rounded-xl shrink-0">
                <CalendarDays size={20} />
              </div>
            </div>

            {/* Weekly Profit */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                  Weekly Profit (Last 7 Days)
                </span>
                <p className={`text-xl font-extrabold mt-1 ${weeklyProfit >= 0 ? "text-blue-600" : "text-red-600"}`}>
                  {loading ? "..." : `PKR ${weeklyProfit.toLocaleString()}`}
                </p>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Past 7 days cumulative profit</span>
              </div>
              <div className="p-2.5 bg-blue-100/70 text-blue-700 rounded-xl shrink-0">
                <CalendarRange size={20} />
              </div>
            </div>

            {/* Monthly Profit */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                  Monthly Profit ({currentMonthLabel})
                </span>
                <p className={`text-xl font-extrabold mt-1 ${monthlyProfit >= 0 ? "text-indigo-600" : "text-red-600"}`}>
                  {loading ? "..." : `PKR ${monthlyProfit.toLocaleString()}`}
                </p>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Current month-to-date profit</span>
              </div>
              <div className="p-2.5 bg-indigo-100/70 text-indigo-700 rounded-xl shrink-0">
                <Calendar size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Invoices & Quick Shortcuts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recent Invoices Table */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Receipt size={18} className="text-slate-600" />
                <h2 className="font-bold text-sm text-slate-900">Recent Invoices & Transactions</h2>
              </div>
              <Link href="/sales" className="text-xs font-semibold text-blue-600 hover:underline flex items-center space-x-1">
                <span>View All Sales</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-600 border-b border-slate-200 text-xs">
                    <th className="p-3 font-semibold">Invoice #</th>
                    <th className="p-3 font-semibold">Customer</th>
                    <th className="p-3 font-semibold">Payment</th>
                    <th className="p-3 font-semibold text-right">Grand Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-slate-400 text-xs">Loading recent transactions...</td>
                    </tr>
                  ) : recentSales.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-slate-400 text-xs">No recent sales recorded yet. Head to POS Counter to start billing.</td>
                    </tr>
                  ) : (
                    recentSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-bold text-blue-600 text-xs">{sale.invoiceNumber}</td>
                        <td className="p-3 text-slate-900 text-xs font-medium">
                          {sale.customer ? sale.customer.name : <span className="text-slate-400 italic">Walk-in</span>}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {sale.paymentMethod}
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900 text-xs">
                          PKR {sale.grandTotal.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col space-y-3">
            <h2 className="font-bold text-sm text-slate-900 mb-1">Quick Shortcuts</h2>

            <Link
              href="/pos"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-between transition-colors shadow-sm"
            >
              <span>Open POS Billing Counter</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/inventory"
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-between transition-colors"
            >
              <span>Manage Stock & Inventory</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/customers"
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-between transition-colors"
            >
              <span>Customer Khaata (Credit)</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/finances"
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-between transition-colors"
            >
              <span>Store Finances & Expenses</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}