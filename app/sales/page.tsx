// app/sales/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Receipt, Search, Calendar, User, Printer, ExternalLink, CheckCircle } from "lucide-react";

interface SaleItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: {
    name: string;
    unit: string;
  };
}

interface Sale {
  id: string;
  invoiceNumber: string;
  subtotal: number;
  discount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  customer?: {
    name: string;
    phone?: string;
  };
  items: SaleItem[];
}

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const res = await fetch("/api/sales");
      const data = await res.json();
      if (Array.isArray(data)) setSales(data);
    } catch (err) {
      console.error("Failed to fetch sales history:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter(
    (s) =>
      s.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.customer && s.customer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.customer && s.customer.phone && s.customer.phone.includes(searchQuery))
  );

  return (
    <AppLayout userRole="OWNER">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Sales History & Invoices</h1>
            <p className="text-sm text-slate-500">View past transactions, reprint receipts, and track invoice statuses.</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex items-center space-x-3">
          <Search size={20} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by invoice number (e.g. INV-123456) or customer name/phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>

        {/* Sales Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="p-3.5 font-semibold">Invoice #</th>
                  <th className="p-3.5 font-semibold">Date & Time</th>
                  <th className="p-3.5 font-semibold">Customer</th>
                  <th className="p-3.5 font-semibold">Payment</th>
                  <th className="p-3.5 font-semibold">Grand Total</th>
                  <th className="p-3.5 font-semibold">Due Balance</th>
                  <th className="p-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">Loading sales history...</td>
                  </tr>
                ) : filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">No sales transactions found.</td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-bold text-blue-600 flex items-center space-x-2">
                        <Receipt size={16} className="shrink-0" />
                        <span>{sale.invoiceNumber}</span>
                      </td>
                      <td className="p-3.5 text-slate-600 text-xs">
                        {new Date(sale.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3.5 font-medium text-slate-900">
                        {sale.customer ? sale.customer.name : <span className="text-slate-400 italic">Walk-in Customer</span>}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">
                        PKR {sale.grandTotal.toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <span className={`font-semibold ${sale.dueAmount > 0 ? "text-red-600" : "text-emerald-600"}`}>
                          PKR {sale.dueAmount.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setSelectedSale(sale)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold transition-colors inline-flex items-center space-x-1"
                        >
                          <span>View Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Receipt Details & Reprint Modal */}
        {selectedSale && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl text-slate-900">
              <div className="text-center pb-4 border-b border-dashed border-slate-300 space-y-1">
                <h2 className="text-lg font-extrabold uppercase tracking-wide">Hardware Store POS</h2>
                <p className="text-xs text-slate-500">Odigram Bazaar, Swat</p>
                <p className="text-[11px] text-slate-400">Invoice: {selectedSale.invoiceNumber}</p>
                <p className="text-[11px] text-slate-400">Date: {new Date(selectedSale.createdAt).toLocaleString()}</p>
                {selectedSale.customer && (
                  <p className="text-xs font-semibold text-blue-600 pt-1">Customer: {selectedSale.customer.name}</p>
                )}
              </div>

              <div className="py-3 space-y-2 max-h-48 overflow-y-auto text-xs divide-y divide-slate-100">
                {selectedSale.items.map((item) => (
                  <div key={item.id} className="pt-2 flex justify-between">
                    <div>
                      <p className="font-semibold">{item.product.name}</p>
                      <p className="text-[10px] text-slate-500">{item.quantity} × {item.unitPrice}</p>
                    </div>
                    <span className="font-bold">PKR {item.totalPrice.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="py-3 border-t border-dashed border-slate-300 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>PKR {selectedSale.subtotal.toLocaleString()}</span>
                </div>
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>- PKR {selectedSale.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-sm pt-1">
                  <span>Grand Total:</span>
                  <span>PKR {selectedSale.grandTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Payment Method:</span>
                  <span className="font-semibold">{selectedSale.paymentMethod}</span>
                </div>
                {selectedSale.dueAmount > 0 && (
                  <div className="flex justify-between text-red-600 font-bold">
                    <span>Due Balance:</span>
                    <span>PKR {selectedSale.dueAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col space-y-2">
                <div className="flex space-x-2">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <Printer size={14} />
                    <span>Print Receipt</span>
                  </button>
                  <button
                    onClick={() => setSelectedSale(null)}
                    className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    Close
                  </button>
                </div>

                {selectedSale.customer?.phone && (
                  <button
                    onClick={() => {
                      const message = encodeURIComponent(
                        `*HARDWARE STORE POS* - Odigram Bazaar, Swat\n` +
                        `Invoice: ${selectedSale.invoiceNumber}\n` +
                        `Date: ${new Date(selectedSale.createdAt).toLocaleString()}\n\n` +
                        `*Items:*\n` +
                        selectedSale.items.map((i) => `- ${i.product.name} (${i.quantity} x ${i.unitPrice}) = PKR ${i.totalPrice}`).join('\n') +
                        `\n\n*Grand Total:* PKR ${selectedSale.grandTotal.toLocaleString()}\n` +
                        `*Payment:* ${selectedSale.paymentMethod}\n` +
                        (selectedSale.dueAmount > 0 ? `*Due Balance:* PKR ${selectedSale.dueAmount.toLocaleString()}\n` : ``) +
                        `\nJazakallah Khair!`
                      );

                      let phoneClean = selectedSale.customer?.phone?.replace(/[^0-9]/g, "") || "";
                      if (phoneClean.startsWith("0")) {
                        phoneClean = "92" + phoneClean.substring(1);
                      }

                      window.open(`https://wa.me/${phoneClean}?text=${message}`, "_blank");
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
                  >
                    <span>💬 Resend Invoice via WhatsApp</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}