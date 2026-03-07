"use client";
import { useQuery } from "@tanstack/react-query";
import { paymentsApi } from "@/lib/api/client";
import { showBar, hideBar } from "@/lib/progress";
import {
  CreditCard,
  Search,
  Filter,
  Printer,
  FileText,
  Download,
  CheckCircle,
} from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";

export default function PaymentsPage() {
  const [search, setSearch] = useState("");

  const { data: paymentsRes, isLoading } = useQuery({
    queryKey: ["payments", search],
    queryFn: () => paymentsApi.list({ q: search }),
  });

  const payments = paymentsRes?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-2">
        <div className="h-10 w-64 bg-slate-100 rounded-lg" />
        <div className="h-16 w-full bg-slate-50 rounded-2xl" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in p-2 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Financial Records
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Audit log of all student receipts and account deposits.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="btn-secondary flex items-center gap-2 group"
            onClick={async () => {
              showBar();
              await new Promise((r) => setTimeout(r, 800));
              hideBar();
            }}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            className="btn-primary flex items-center gap-2 group"
            onClick={() => {
              showBar();
              setTimeout(() => {
                hideBar();
                window.print();
              }, 400);
            }}
          >
            <Printer className="w-4 h-4" />
            Print Daily Summary
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card-premium p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 w-full relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-blue transition-colors" />
          <input
            type="text"
            placeholder="Search by student name, roll number, or receipt ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-brand-blue/5 focus:border-brand-blue/20 transition-all font-medium"
          />
        </div>
        <button className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Table Section */}
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Receipt ID
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Student / Payer
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Date
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Account
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Amount
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Status
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length > 0 ? (
                payments.map((p: any) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-5 font-bold text-brand-blue text-sm">
                      #{p.receiptNo}
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-black text-slate-800 uppercase">
                        {p.student?.name || "Manual Deposit"}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                        {p.student?.rollNo || p.type}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-500">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5">
                      <div className="px-2.5 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-slate-600 uppercase w-fit">
                        {p.account?.name || "Default Account"}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-black text-slate-900">
                        PKR {Number(p.amount).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-1.5 text-green-600 text-[10px] font-black uppercase tracking-wider">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Confirmed
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right space-x-2">
                      <button
                        className="p-2 text-slate-400 hover:text-brand-blue hover:bg-brand-blue/5 rounded-lg transition-all"
                        title="View Receipt"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                        title="Print"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center overflow-hidden"
                  >
                    <div className="flex flex-col items-center opacity-40">
                      <CreditCard className="w-12 h-12 mb-4 text-slate-300" />
                      <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                        No transactions found
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Mockup */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Showing {payments.length} results
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-white border border-slate-200 rounded text-[10px] font-black text-slate-400 hover:text-slate-600 transition-all uppercase">
              Prev
            </button>
            <button className="px-3 py-1 bg-white border border-slate-200 rounded text-[10px] font-black text-brand-blue hover:text-brand-blue-light transition-all uppercase">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
