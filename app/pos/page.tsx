// app/pos/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Search, ShoppingCart, Plus, Minus, Trash2, Printer, CheckCircle, User } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  sellingPrice: number;
  costPrice: number;
  stockQuantity: number;
  barcode?: string;
}

interface Customer {
  id: string;
  name: string;
  phone?: string;
  currentBalance: number;
}

interface CartItem extends Product {
  productId: string;
  quantity: number;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Checkout modal states
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [discount, setDiscount] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [completedSale, setCompletedSale] = useState<any>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, custRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/customers"),
      ]);
      const prodData = await prodRes.json();
      const custData = await custRes.json();
      if (Array.isArray(prodData)) setProducts(prodData);
      if (Array.isArray(custData)) setCustomers(custData);
    } catch (err) {
      console.error("Failed to load POS data", err);
    }
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, productId: product.id, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  const disc = parseFloat(discount) || 0;
  const grandTotal = Math.max(0, subtotal - disc);
  
  // For Khaata, default paid to 0 unless user types partial cash. For others, default to grandTotal.
  const paid = paymentMethod === "KHAATA" 
    ? (paidAmount === "" ? 0 : parseFloat(paidAmount) || 0)
    : (paidAmount === "" ? grandTotal : parseFloat(paidAmount) || 0);

  const changeDue = Math.max(0, paid - grandTotal);
  const creditDue = Math.max(0, grandTotal - paid);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Cart is empty");
    if (paymentMethod === "KHAATA" && !selectedCustomerId) {
      return alert("Please select a customer for Khataa sales");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId || null,
          items: cart,
          discount: disc,
          tax: 0,
          paidAmount: paid,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setCompletedSale(data);
        setShowReceiptModal(true);
        setCart([]);
        setSelectedCustomerId("");
        setDiscount("");
        setPaidAmount("");
        setPaymentMethod("CASH");
        fetchData(); // refresh stock quantities
      } else {
        alert(data.error || "Checkout failed");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Failed to complete checkout");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery))
  );

  return (
    <AppLayout userRole="OWNER">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-7rem)]">
        
        {/* Left Section: Product Catalog & Search */}
        <div className="lg:col-span-7 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center space-x-3 bg-slate-50">
            <Search size={20} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search items by name, category, or scan barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="p-4 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3 content-start">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="flex flex-col text-left p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all bg-white group shadow-xs"
              >
                <span className="text-xs font-semibold text-blue-600 mb-1">{p.category}</span>
                <span className="text-sm font-bold text-slate-900 line-clamp-2 mb-2 group-hover:text-blue-900">{p.name}</span>
                <div className="mt-auto flex items-center justify-between w-full pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-900">PKR {p.sellingPrice.toLocaleString()}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${p.stockQuantity > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                    Stock: {p.stockQuantity} {p.unit}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Section: Active Cart & Checkout Panel */}
        <div className="lg:col-span-5 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingCart size={18} />
              <h2 className="font-bold text-sm">Current Bill Cart</h2>
            </div>
            <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-full">{cart.length} Items</span>
          </div>

          {/* Cart Items List */}
          <div className="p-3 overflow-y-auto flex-1 divide-y divide-slate-100 max-h-[26vh]">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">Cart is empty. Click items from the catalog to add.</div>
            ) : (
              cart.map((item) => (
                <div key={item.productId} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-500">PKR {item.sellingPrice.toLocaleString()} × {item.quantity}</p>
                  </div>
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button onClick={() => updateQuantity(item.productId, -1)} className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-bold text-xs">-</button>
                    <span className="text-xs font-bold w-6 text-center text-slate-900">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, 1)} className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-bold text-xs">+</button>
                    <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-600 p-1 ml-1"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout Form Controls */}
          <form onSubmit={handleCheckout} className="p-4 bg-slate-50 border-t border-slate-200 space-y-2.5 mt-auto">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Customer {paymentMethod === "KHAATA" ? "*" : "(Optional)"}</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white outline-none"
                >
                  <option value="">Walk-in Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => {
                    setPaymentMethod(e.target.value);
                    if (e.target.value !== "KHAATA") setPaidAmount("");
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white outline-none font-semibold text-blue-600"
                >
                  <option value="CASH">CASH</option>
                  <option value="CARD">CARD</option>
                  <option value="KHAATA">KHAATA (Credit)</option>
                  <option value="BANK">BANK TRANSFER</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Discount (PKR)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  {paymentMethod === "KHAATA" ? "Paid Now (Cash Spot)" : "Cash Received (PKR)"}
                </label>
                <input
                  type="number"
                  placeholder={paymentMethod === "KHAATA" ? "0 (Partial / Full)" : grandTotal.toString()}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white outline-none font-semibold text-slate-900"
                />
              </div>
            </div>

            {/* Totals Summary */}
            <div className="pt-2 border-t border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>PKR {subtotal.toLocaleString()}</span>
              </div>
              {disc > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span>- PKR {disc.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-900 text-sm pt-0.5">
                <span>Grand Total:</span>
                <span className="text-blue-600">PKR {grandTotal.toLocaleString()}</span>
              </div>
              {paymentMethod !== "KHAATA" && paidAmount !== "" && (
                <div className="flex justify-between font-semibold text-emerald-700">
                  <span>Change Return:</span>
                  <span>PKR {changeDue.toLocaleString()}</span>
                </div>
              )}
              {paymentMethod === "KHAATA" && (
                <div className="flex justify-between font-semibold text-red-600 pt-0.5 border-t border-dashed border-slate-200">
                  <span>Added to Khataa Due:</span>
                  <span>PKR {creditDue.toLocaleString()}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || cart.length === 0}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-xs transition-colors shadow-sm flex items-center justify-center space-x-2"
            >
              <CheckCircle size={16} />
              <span>{loading ? "Processing..." : "Complete Sale & Print"}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Thermal Receipt Print Modal */}
      {showReceiptModal && completedSale && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl text-slate-900">
            <div className="text-center pb-4 border-b border-dashed border-slate-300 space-y-1">
              <h2 className="text-lg font-extrabold uppercase tracking-wide">M Rasool Khan</h2>
              <p className="text-xs text-slate-500">Matta Road Ningolai Swat</p>
              <p className="text-xs text-slate-500">Phone: +92 341 5307785</p>
              <p className="text-[11px] text-slate-400">Invoice: {completedSale.invoiceNumber}</p>
              <p className="text-[11px] text-slate-400">Date: {new Date(completedSale.createdAt).toLocaleString()}</p>
              {completedSale.customer && (
                <p className="text-xs font-semibold text-blue-600 pt-1">Customer: {completedSale.customer.name}</p>
              )}
            </div>

            <div className="py-3 space-y-2 max-h-48 overflow-y-auto text-xs divide-y divide-slate-100">
              {completedSale.items.map((item: any) => (
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
                <span>PKR {completedSale.subtotal.toLocaleString()}</span>
              </div>
              {completedSale.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span>- PKR {completedSale.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-sm pt-1">
                <span>Grand Total:</span>
                <span>PKR {completedSale.grandTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Payment Method:</span>
                <span className="font-semibold">{completedSale.paymentMethod}</span>
              </div>
              {completedSale.paidAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Paid Spot Cash:</span>
                  <span>PKR {completedSale.paidAmount.toLocaleString()}</span>
                </div>
              )}
              {completedSale.dueAmount > 0 && (
                <div className="flex justify-between text-red-600 font-bold">
                  <span>Added to Khataa Due:</span>
                  <span>PKR {completedSale.dueAmount.toLocaleString()}</span>
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
                  onClick={() => setShowReceiptModal(false)}
                  className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Close
                </button>
              </div>

              {(() => {
                const custPhone = completedSale.customer?.phone || customers.find(c => c.id === completedSale.customerId)?.phone;
                
                if (!custPhone) return null;

                return (
                  <button
                    onClick={() => {
                      const message = encodeURIComponent(
                        `*M Rasool Khan* - Matta Road Ningolai Swat\n` +
                        `Phone: +92 341 5307785\n` +
                        `Invoice: ${completedSale.invoiceNumber}\n` +
                        `Date: ${new Date(completedSale.createdAt).toLocaleString()}\n\n` +
                        `*Items:*\n` +
                        completedSale.items.map((i: any) => `- ${i.product.name} (${i.quantity} x ${i.unitPrice}) = PKR ${i.totalPrice}`).join('\n') +
                        `\n\n*Grand Total:* PKR ${completedSale.grandTotal.toLocaleString()}\n` +
                        `*Paid Spot Cash:* PKR ${completedSale.paidAmount.toLocaleString()}\n` +
                        (completedSale.dueAmount > 0 ? `*Added to Khataa:* PKR ${completedSale.dueAmount.toLocaleString()}\n` : ``) +
                        `\nJazakallah Khair!`
                      );

                      let phoneClean = custPhone.replace(/[^0-9]/g, "");
                      if (phoneClean.startsWith("0")) {
                        phoneClean = "92" + phoneClean.substring(1);
                      }

                      window.open(`https://wa.me/${phoneClean}?text=${message}`, "_blank");
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
                  >
                    <span>💬 Send Invoice via WhatsApp</span>
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}