// components/dashboard/DashboardSummary.tsx
"use client";

import React from "react";
import { DollarSign, AlertTriangle, TrendingUp, Users } from "lucide-react";

export default function DashboardSummary() {
  const stats = [
    {
      title: "Today's Sales",
      value: "PKR 45,200",
      change: "+12% vs yesterday",
      icon: DollarSign,
      color: "bg-emerald-500",
    },
    {
      title: "Pending Dues (Khaata)",
      value: "PKR 128,500",
      change: "14 active accounts",
      icon: Users,
      color: "bg-amber-500",
    },
    {
      title: "Net Profit (Est.)",
      value: "PKR 11,400",
      change: "Margin ~25%",
      icon: TrendingUp,
      color: "bg-blue-500",
    },
    {
      title: "Low Stock Items",
      value: "8 Items",
      change: "Action required",
      icon: AlertTriangle,
      color: "bg-red-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={i}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4"
          >
            <div className={`p-3 rounded-lg text-white ${stat.color} shrink-0`}>
              <Icon size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500 truncate">{stat.title}</p>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5 truncate">{stat.value}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">{stat.change}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}