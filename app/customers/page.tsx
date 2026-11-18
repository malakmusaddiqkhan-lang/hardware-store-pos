// app/customers/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import {
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  Wallet,
  Trash2,
  Eye,
  Clock,
  Receipt,
  CheckCircle2,
  X,
  Banknote,
  Printer,
} from "lucide-react";

interface SaleItemDetail {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: {
    name: string;
    unit: string;
  };
}

interface SaleDetail {
  id: string;
  invoiceNumber: string;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  items: SaleItemDetail[];
}

interface PaymentRecord {
  id: string;
  amount: number;
  createdAt: string;
  note?: string;
}

interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  currentBalance: number;
  sales?: SaleDetail[];
  payments?: PaymentRecord[];
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Selected Customer Khaata Ledger Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Payment Receipt Print Modal State
  const [printingPayment, setPrintingPayment] = useState<PaymentRecord | null>(null);

  // Add Customer Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    currentBalance: "",
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      if (Array.isArray(data)) setCustomers(data);
    } catch (err) {
      console.error("Failed to load customers", err);
    } finally {
      setLoading(false);
    }
  };

  // Open full itemized Khaata history for a customer
  const handleOpenLedger = async (customerId: string) => {
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/customers/${customerId}`);
      if (res.ok) {
        const detailedCustomer = await res.json();
        setSelectedCustomer(detailedCustomer);
        setPaymentAmount("");
      } else {
        alert("Failed to load customer ledger details.");
      }
    } catch (err) {
      console.error("Error fetching customer ledger:", err);
      alert("Error loading customer ledger.");
    } finally {
      setLoadingDetails(false);
    }
  };

  // Record partial or full Khaata payment and generate payment bill record
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }

    setSubmittingPayment(true);
    try {
      const res = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      const data = await res.json();

      if (res.ok) {
        // Refresh customer ledger details to show the new payment bill instantly
        await handleOpenLedger(selectedCustomer.id);
        setPaymentAmount("");
        fetchCustomers();
      } else {
        alert(data.error || "Failed to record payment");
      }
    } catch (err) {
      console.error("Error recording payment:", err);
      alert("Failed to record payment");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setShowAddModal(false);
        setFormData({ name: "", phone: "", address: "", currentBalance: "" });
        fetchCustomers();
      } else {
        alert(data.error || "Failed to add customer");
      }
    } catch (err) {
      console.error("Error submitting customer:", err);
      alert("Failed to add customer");
    }
  };

  const handleDeleteCustomer = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchCustomers();
      } else {
        alert("Failed to delete customer");
      }
    } catch (err) {
      console.error("Error deleting customer:", err);
      alert("Failed to delete customer");
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery))
  );

  return (
    <AppLayout userRole="OWNER">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Customer Khaata (Credit Ledger)
            </h1>
            <p className="text-sm text-slate-500">
              Click any customer to view itemized purchases, exact timestamps, and receive Khaata payments.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span>Add New Customer</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex items-center space-x-3">
          <Search size={20} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by customer name or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="p-3.5 font-semibold">Customer Name</th>
                  <th className="p-3.5 font-semibold">Phone Number</th>
                  <th className="p-3.5 font-semibold">Address</th>
                  <th className="p-3.5 font-semibold">Credit Balance (Khaata)</th>
                  <th className="p-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400">
                      Loading customers...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400">
                      No customers found. Click "Add New Customer" to start.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td
                        onClick={() => handleOpenLedger(c.id)}
                        className="p-3.5 font-medium text-slate-900 flex items-center space-x-2 cursor-pointer hover:text-blue-600"
                      >
                        <Users size={16} className="text-blue-600 shrink-0" />
                        <span className="underline decoration-slate-300 underline-offset-4 hover:decoration-blue-600">
                          {c.name}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {c.phone ? (
                          <span className="inline-flex items-center space-x-1">
                            <Phone size={13} className="text-slate-400" />
                            <span>{c.phone}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No phone</span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {c.address ? (
                          <span className="inline-flex items-center space-x-1">
                            <MapPin size={13} className="text-slate-400" />
                            <span>{c.address}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No address</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            c.currentBalance > 0
                              ? "bg-red-50 text-red-600"
                              : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          <Wallet size={12} className="mr-1" />
                          PKR {c.currentBalance.toLocaleString()}{" "}
                          {c.currentBalance > 0 ? "(Due)" : "(Clear)"}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleOpenLedger(c.id)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition-colors"
                          title="View Khaata History & Receive Payment"
                        >
                          <Eye size={14} />
                          <span>View Khaata</span>
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(c.id, c.name)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors align-middle"
                          title="Delete Customer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Loading Overlay while opening ledger */}
        {loadingDetails && (
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center">
            <div className="bg-white px-6 py-4 rounded-xl shadow-lg text-sm font-medium text-slate-700">
              Loading customer Khaata history...
            </div>
          </div>
        )}

        {/* Customer Detailed Khaata & Payment Modal */}
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-200 flex justify-between items-start bg-slate-50">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {selectedCustomer.name}
                  </h2>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-1">
                    {selectedCustomer.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone size={12} /> {selectedCustomer.phone}
                      </span>
                    )}
                    {selectedCustomer.address && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} /> {selectedCustomer.address}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 block font-semibold">
                      Remaining Khaata Due
                    </span>
                    <span
                      className={`text-xl font-extrabold ${
                        selectedCustomer.currentBalance > 0
                          ? "text-red-600"
                          : "text-emerald-600"
                      }`}
                    >
                      PKR {selectedCustomer.currentBalance.toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Scrollable Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                {/* Receive Partial / Full Payment Card */}
                <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-blue-950 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-blue-600" />
                    Receive Khaata Payment (Cash / Wasooli)
                  </h3>
                  <p className="text-xs text-blue-700 mb-3">
                    Enter partial or full amount paid by customer to reduce their remaining balance and generate a payment receipt bill.
                  </p>
                  <form
                    onSubmit={handleRecordPayment}
                    className="flex flex-col sm:flex-row gap-2.5"
                  >
                    <input
                      type="number"
                      step="any"
                      min="1"
                      placeholder="Enter amount received (PKR)..."
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      required
                      className="flex-1 px-3.5 py-2 bg-white border border-blue-300 rounded-lg text-sm text-slate-900 outline-none focus:border-blue-600"
                    />
                    <button
                      type="submit"
                      disabled={submittingPayment}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 shrink-0"
                    >
                      {submittingPayment ? "Saving..." : "Receive Payment"}
                    </button>
                  </form>
                </div>

                {/* Ledger History: Payment Bills & Purchase Invoices */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Receipt size={16} className="text-slate-600" />
                    Ledger History (Invoices & Payment Bills)
                  </h3>

                  <div className="space-y-4">
                    {/* Render Payment Receipts / Wasooli Bills */}
                    {selectedCustomer.payments && selectedCustomer.payments.length > 0 && (
                      <div className="space-y-3 mb-4">
                        <h4 className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                          Payment Receipts / Wasooli Bills ({selectedCustomer.payments.length})
                        </h4>
                        {selectedCustomer.payments.map((pay) => {
                          const dateObj = new Date(pay.createdAt);
                          return (
                            <div
                              key={pay.id}
                              className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-4 flex items-center justify-between text-xs shadow-xs"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                                  <Banknote size={18} />
                                </div>
                                <div>
                                  <p className="font-bold text-emerald-900 text-sm">
                                    Payment Received: PKR {pay.amount.toLocaleString()}
                                  </p>
                                  <p className="text-emerald-700 text-[11px] mt-0.5">
                                    {dateObj.toLocaleDateString("en-GB", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })}{" "}
                                    at{" "}
                                    {dateObj.toLocaleTimeString("en-US", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: true,
                                    })}
                                    {pay.note && ` • ${pay.note}`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  type="button"
                                  onClick={() => setPrintingPayment(pay)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center space-x-1 transition-colors shadow-xs"
                                >
                                  <Printer size={13} />
                                  <span>Print Bill</span>
                                </button>
                                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-md">
                                  PAID
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Render Purchase Invoices */}
                    <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide pt-2">
                      Purchase Invoices ({selectedCustomer.sales?.length || 0})
                    </h4>

                    {selectedCustomer.sales && selectedCustomer.sales.length > 0 ? (
                      selectedCustomer.sales.map((sale) => {
                        const dateObj = new Date(sale.createdAt);
                        const formattedDate = dateObj.toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        });
                        const formattedTime = dateObj.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        });

                        return (
                          <div
                            key={sale.id}
                            className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs"
                          >
                            {/* Invoice Top Bar */}
                            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex flex-wrap justify-between items-center gap-2 text-xs">
                              <div className="font-bold text-slate-800">
                                Invoice #{sale.invoiceNumber}
                              </div>
                              <div className="inline-flex items-center gap-1.5 text-slate-600 font-medium bg-white px-2.5 py-1 rounded-md border border-slate-200">
                                <Clock size={13} className="text-blue-600" />
                                <span>
                                  {formattedDate} at {formattedTime}
                                </span>
                              </div>
                            </div>

                            {/* Purchased Items Table */}
                            <div className="p-4">
                              <table className="w-full text-xs text-left mb-3">
                                <thead>
                                  <tr className="border-b border-slate-100 text-slate-500">
                                    <th className="pb-2 font-semibold">Item Bought</th>
                                    <th className="pb-2 font-semibold">Quantity</th>
                                    <th className="pb-2 font-semibold">Unit Price</th>
                                    <th className="pb-2 font-semibold text-right">Total</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {sale.items && sale.items.length > 0 ? (
                                    sale.items.map((item) => (
                                      <tr key={item.id}>
                                        <td className="py-2 font-medium text-slate-800">
                                          {item.product?.name || "Hardware Item"}
                                        </td>
                                        <td className="py-2 text-slate-600">
                                          {item.quantity} {item.product?.unit || "pcs"}
                                        </td>
                                        <td className="py-2 text-slate-600">
                                          PKR {item.unitPrice.toLocaleString()}
                                        </td>
                                        <td className="py-2 text-right font-semibold text-slate-900">
                                          PKR {item.totalPrice.toLocaleString()}
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan={4} className="py-2 text-slate-400 italic">
                                        No itemized details recorded for this invoice.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>

                              {/* Invoice Totals Footer */}
                              <div className="pt-2.5 border-t border-slate-100 flex flex-wrap justify-between items-center gap-2 text-xs">
                                <span className="text-slate-500">
                                  Method: <strong className="text-slate-700">{sale.paymentMethod}</strong>
                                </span>
                                <div className="flex items-center gap-4">
                                  <span className="text-slate-600">
                                    Bill Total:{" "}
                                    <strong className="text-slate-900">
                                      PKR {sale.grandTotal.toLocaleString()}
                                    </strong>
                                  </span>
                                  <span className="text-emerald-600">
                                    Paid at Sale:{" "}
                                    <strong>PKR {sale.paidAmount.toLocaleString()}</strong>
                                  </span>
                                  {sale.dueAmount > 0 && (
                                    <span className="text-red-600">
                                      Added to Khaata:{" "}
                                      <strong>PKR {sale.dueAmount.toLocaleString()}</strong>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      (!selectedCustomer.payments || selectedCustomer.payments.length === 0) && (
                        <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-sm text-slate-500">
                          No POS purchase invoices or payment receipts recorded for this customer yet.
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-sm font-medium transition-colors"
                >
                  Close Ledger
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Print Payment Receipt (Wasooli Bill) Modal */}
        {printingPayment && selectedCustomer && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-slate-900 space-y-4">
              {/* Thermal Receipt Header */}
              <div className="text-center pb-3 border-b border-dashed border-slate-300 space-y-1">
                <h2 className="text-base font-extrabold uppercase tracking-wide">M Rasool Khan</h2>
                <p className="text-[11px] text-slate-500">Matta Road Ningolai Swat</p>
                <p className="text-[11px] text-slate-500">Phone: +92 341 5307785</p>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 pt-2">
                  Khaata Payment Receipt (Wasooli Bill)
                </h3>
              </div>

              {/* Receipt Details */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer Name:</span>
                  <span className="font-bold text-slate-800">{selectedCustomer.name}</span>
                </div>
                {selectedCustomer.phone && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone:</span>
                    <span className="font-semibold text-slate-800">{selectedCustomer.phone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Date & Time:</span>
                  <span className="font-medium text-slate-700">
                    {new Date(printingPayment.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment Amount Box */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center space-y-1">
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide block">
                  Amount Received (Wasooli)
                </span>
                <span className="text-xl font-extrabold text-emerald-900 block">
                  PKR {printingPayment.amount.toLocaleString()}
                </span>
              </div>

              {/* Updated Balance Status */}
              <div className="border-t border-dashed border-slate-300 pt-3 text-xs space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Remaining Khaata Due:</span>
                  <span className={selectedCustomer.currentBalance > 0 ? "text-red-600" : "text-emerald-600"}>
                    PKR {selectedCustomer.currentBalance.toLocaleString()}
                    {selectedCustomer.currentBalance === 0 && " (Account Cleared)"}
                  </span>
                </div>
              </div>

              <p className="text-center text-[10px] text-slate-400 italic pt-1">
                Jazakallah Khair! Thank you for your payment.
              </p>

              {/* Print Actions */}
              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Printer size={14} />
                  <span>Print Bill</span>
                </button>
                <button
                  onClick={() => setPrintingPayment(null)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Customer Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">Add New Customer</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ustad Tariq (Contractor)"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0300-1234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Address / Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Odigram Bazaar, Swat"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Initial Opening Due Balance (PKR)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={formData.currentBalance}
                    onChange={(e) =>
                      setFormData({ ...formData, currentBalance: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 outline-none focus:border-blue-600"
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
                    Save Customer
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