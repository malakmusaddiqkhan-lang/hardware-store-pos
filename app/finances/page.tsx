// app/finances/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { DollarSign, TrendingUp, TrendingDown, Wallet, Plus, Receipt } from "lucide-react";

interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
}

interface Sale {
  id: string;
  grandTotal: number;
  dueAmount: number;
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

export default function FinancesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    category: "RENT",
    amount: "",
    notes: "",
  });

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      const [expRes, salesRes, custRes] = await Promise.all([
        fetch("/api/expenses"),
        fetch("/api/sales"),
        fetch("/api/customers"),
      ]);
      const expData = await expRes.json();
      const salesData = await salesRes.json();
      const custData = await custRes.json();

      if (Array.isArray(expData)) setExpenses(expData);
      if (Array.isArray(salesData)) setSales(salesData);
      if (Array.isArray(custData)) setCustomers(custData);
    } catch (err) {
      console.error("Failed to load financial data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowAddModal(false);
        setFormData({ title: "", category: "RENT", amount: "", notes: "" });
        fetchFinancialData();
      } else {
        alert("Failed to add expense");
      }
    } catch (err) {
      console.error("Error saving expense:", err);
      alert("Failed to add expense");
    }
  };

  const totalRevenue = sales.reduce((sum, s) => sum + s.grandTotal, 0);

  let totalCostOfGoods = 0;
  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      totalCostOfGoods += (item.unitCostPrice || 0) * item.quantity;
    });
  });
  const grossProfit = totalRevenue - totalCostOfGoods;

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;
  const totalCustomerDue = customers.reduce((sum, c) => sum + c.currentBalance, 0);

  return (
    <AppLayout userRole="OWNER">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Finances & Profit / Loss</h1>
            <p className="text-sm text-slate-500">Monitor store revenue, expenses, and net profit margins.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span>Record Expense</span>
          </button>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Revenue</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><DollarSign size={20} /></div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">PKR {totalRevenue.toLocaleString()}</p>
            <span className="text-xs text-slate-400 mt-1 block">From all POS sales</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Gross Profit</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp size={20} /></div>
            </div>
            <p className="text-2xl font-extrabold text-emerald-600">PKR {grossProfit.toLocaleString()}</p>
            <span className="text-xs text-slate-400 mt-1 block">Revenue minus item costs</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Expenses</span>
              <div className="p-2 bg-red-50 text-red-600 rounded-xl"><TrendingDown size={20} /></div>
            </div>
            <p className="text-2xl font-extrabold text-red-600">PKR {totalExpenses.toLocaleString()}</p>
            <span className="text-xs text-slate-400 mt-1 block">Rent, bills, transport, etc.</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Net Profit</span>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Wallet size={20} /></div>
            </div>
            <p className={`text-2xl font-extrabold ${netProfit >= 0 ? "text-indigo-600" : "text-red-600"}`}>
              PKR {netProfit.toLocaleString()}
            </p>
            <span className="text-xs text-slate-400 mt-1 block">Gross profit minus expenses</span>
          </div>
        </div>

        {/* Secondary Info Bar */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl"><Receipt size={20} /></div>
            <div>
              <h2 className="text-sm font-bold text-amber-900">Outstanding Customer Credit (Khaata Dues)</h2>
              <p className="text-xs text-amber-700">Total unpaid credit balances currently held by customers.</p>
            </div>
          </div>
          <span className="text-lg font-extrabold text-amber-900">PKR {totalCustomerDue.toLocaleString()}</span>
        </div>

        {/* Expenses List Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h2 className="font-bold text-sm text-slate-900">Store Expenses Log</h2>
            <span className="text-xs text-slate-500">{expenses.length} Recorded Expenses</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/50 text-slate-600 border-b border-slate-200 text-xs">
                  <th className="p-3.5 font-semibold">Title</th>
                  <th className="p-3.5 font-semibold">Category</th>
                  <th className="p-3.5 font-semibold">Date</th>
                  <th className="p-3.5 font-semibold">Notes</th>
                  <th className="p-3.5 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400">Loading expenses...</td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400">No expenses recorded yet. Click "Record Expense" to add one.</td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-semibold text-slate-900">{exp.title}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          {exp.category}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500 text-xs">{new Date(exp.date).toLocaleDateString()}</td>
                      <td className="p-3.5 text-slate-500 text-xs">{exp.notes || "—"}</td>
                      <td className="p-3.5 text-right font-bold text-red-600">PKR {exp.amount.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Expense Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl text-slate-900">
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
                <h2 className="text-lg font-bold">Record New Store Expense</h2>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Expense Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Electricity Bill / Shop Rent"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none bg-white"
                    >
                      <option value="RENT">RENT</option>
                      <option value="UTILITIES">UTILITIES (Electricity/Water)</option>
                      <option value="TRANSPORT">TRANSPORT</option>
                      <option value="SALARY">SALARY</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                      <option value="GENERAL">GENERAL</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Amount (PKR) *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-600 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Paid in cash for October"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-600"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                  >
                    Save Expense
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}