// app/sales/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Receipt, Search, Printer, RotateCcw, Trash2 } from "lucide-react";

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

  // Return workflow state
  const [returningItem, setReturningItem] = useState<SaleItem | null>(null);
  const [returnQty, setReturnQty] = useState("");
  const [processingReturn, setProcessingReturn] = useState(false);
  const [deletingSale, setDeletingSale] = useState(false);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async (): Promise<Sale[]> => {
    try {
      const res = await fetch("/api/sales");
      const data = await res.json();
      if (Array.isArray(data)) {
        setSales(data);
        return data;
      }
    } catch (err) {
      console.error("Failed to fetch sales history:", err);
    } finally {
      setLoading(false);
    }
    return [];
  };

  const openReturnForm = (item: SaleItem) => {
    setReturningItem(item);
    setReturnQty(item.quantity.toString());
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale || !returningItem) return;

    const qty = parseFloat(returnQty);
    if (!qty || qty <= 0 || qty > returningItem.quantity) {
      alert(`Please enter a valid quantity between 1 and ${returningItem.quantity}.`);
      return;
    }

    setProcessingReturn(true);
    try {
      const res = await fetch(`/api/sales/${selectedSale.id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: returningItem.id,
          returnQuantity: qty,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        setReturningItem(null);
        setReturnQty("");
        const updatedSales = await fetchSales();
        const refreshedSale = updatedSales.find((s) => s.id === selectedSale.id) || null;
        setSelectedSale(refreshedSale);
      } else {
        alert(result.error || "Failed to process return.");
      }
    } catch (err) {
      console.error("Error processing return:", err);
      alert("Something went wrong while processing the return.");
    } finally {
      setProcessingReturn(false);
    }
  };

  const handleDeleteSale = async (saleId: string) => {
    if (!confirm("Are you sure you want to delete this invoice? This will restore inventory stock and reverse any Khataa balance due.")) return;

    setDeletingSale(true);
    try {
      const res = await fetch(`/api/sales/${saleId}`, {
        method: "DELETE",
      });

      const result = await res.json();
      if (res.ok) {
        alert("Sale deleted successfully!");
        setSelectedSale(null);
        fetchSales();
      } else {
        alert(result.error || "Failed to delete sale");
      }
    } catch (err) {
      console.error("Error deleting sale:", err);
      alert("Something went wrong while deleting the sale.");
    } finally {
      setDeletingSale(false);
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
            <p className="text-sm text-slate-500">View past transactions, reprint receipts, and process product returns.</p>
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
                          onClick={() => {
                            setReturningItem(null);
                            setSelectedSale(sale);
                          }}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold transition-colors inline-flex items-center space-x-1"
                        >
                          <span>View Receipt / Return</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Receipt Details, Reprint, Return & Delete Modal */}
        {selectedSale && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl text-slate-900 max-h-[90vh] overflow-y-auto">
              <div className="text-center pb-4 border-b border-dashed border-slate-300 space-y-1">
                <h2 className="text-lg font-extrabold uppercase tracking-wide">M Rasool Khan</h2>
                <p className="text-xs text-slate-500">Matta Road Ningolai Swat</p>
                <p className="text-xs text-slate-500">Phone: +92 341 5307785</p>
                <p className="text-[11px] text-slate-400 pt-1">Invoice: {selectedSale.invoiceNumber}</p>
                <p className="text-[11px] text-slate-400">Date: {new Date(selectedSale.createdAt).toLocaleString()}</p>
                {selectedSale.customer && (
                  <p className="text-xs font-semibold text-blue-600 pt-1">Customer: {selectedSale.customer.name}</p>
                )}
              </div>

              {/* Sold Items List with Return Button */}
              <div className="py-3 space-y-2 max-h-56 overflow-y-auto text-xs divide-y divide-slate-100">
                {selectedSale.items.length === 0 ? (
                  <p className="text-center py-4 text-amber-600 font-semibold">All items in this invoice have been returned.</p>
                ) : (
                  selectedSale.items.map((item) => (
                    <div key={item.id} className="pt-2 flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold">{item.product.name}</p>
                        <p className="text-[10px] text-slate-500">
                          {item.quantity} {item.product.unit} × PKR {item.unitPrice.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold">PKR {item.totalPrice.toLocaleString()}</span>
                        <button
                          type="button"
                          onClick={() => openReturnForm(item)}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded text-[11px] font-semibold inline-flex items-center space-x-1 transition-colors"
                          title="Return this item"
                        >
                          <RotateCcw size={11} />
                          <span>Return</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Inline Return Confirmation Box */}
              {returningItem && (
                <form
                  onSubmit={handleReturnSubmit}
                  className="my-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-3 text-xs"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-amber-900">
                      Return: {returningItem.product.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setReturningItem(null)}
                      className="text-amber-700 hover:text-amber-900 font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-amber-800 mb-1">
                      Quantity to Return (Max: {returningItem.quantity} {returningItem.product.unit})
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      max={returningItem.quantity}
                      required
                      value={returnQty}
                      onChange={(e) => setReturnQty(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-sm text-slate-900 outline-none focus:border-amber-600"
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-amber-900 font-semibold">
                    <span>Refund / Adjustment Amount:</span>
                    <span>
                      PKR {((parseFloat(returnQty) || 0) * returningItem.unitPrice).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setReturningItem(null)}
                      className="px-3 py-1.5 bg-white border border-amber-300 text-amber-800 rounded-lg font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={processingReturn}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg font-bold shadow-sm"
                    >
                      {processingReturn ? "Processing..." : "Confirm Return"}
                    </button>
                  </div>
                </form>
              )}

              {/* Totals */}
              <div className="py-3 border-t border-dashed border-slate-300 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>PKR {selectedSale.subtotal.toLocaleString()}</span>
                </div>
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>PKR {selectedSale.discount.toLocaleString()}</span>
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
                    onClick={() => {
                      setReturningItem(null);
                      setSelectedSale(null);
                    }}
                    className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    Close
                  </button>
                </div>

                {/* Delete Invoice Button */}
                <button
                  type="button"
                  disabled={deletingSale}
                  onClick={() => handleDeleteSale(selectedSale.id)}
                  className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Trash2 size={14} />
                  <span>{deletingSale ? "Deleting Invoice..." : "Delete Invoice & Restore Stock"}</span>
                </button>

                {selectedSale.customer?.phone && (
                  <button
                    onClick={() => {
                      const message = encodeURIComponent(
                        `*M Rasool Khan*\n` +
                        `Matta Road Ningolai Swat\n` +
                        `Phone: +92 341 5307785\n\n` +
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