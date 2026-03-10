"use client";
import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/api/client";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  Download,
  Briefcase,
  Calendar,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { showBar, hideBar } from "@/lib/progress";
import { useState } from "react";

export default function StaffLedgerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["staff-ledger", id, from, to],
    queryFn: () =>
      reportsApi.staffLedger(parseInt(id), from || undefined, to || undefined),
  });

  if (isLoading)
    return (
      <div className="flex justify-center p-20">
        <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!data)
    return (
      <div className="card-premium p-12 text-center">
        <h3 className="text-xl font-black text-slate-800 uppercase">
          Staff Not Found
        </h3>
        <button onClick={() => router.back()} className="btn-secondary mt-6">
          Go Back
        </button>
      </div>
    );

  const staff = data.staff;
  const logs = data.logs || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:bg-slate-50 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center text-white shadow-xl">
              <Briefcase className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                {staff.name}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Financial Audit
              </p>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-100 ml-2" />

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
              <Calendar className="w-3 h-3 text-slate-400" />
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="bg-transparent border-none text-[10px] font-black uppercase outline-none text-slate-600 focus:text-brand-blue transition-colors"
              />
            </div>
            <span className="text-[10px] font-black text-slate-300">TO</span>
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
              <Calendar className="w-3 h-3 text-slate-400" />
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="bg-transparent border-none text-[10px] font-black uppercase outline-none text-slate-600 focus:text-brand-blue transition-colors"
              />
            </div>
            {(from || to) && (
              <button
                onClick={() => {
                  setFrom("");
                  setTo("");
                }}
                className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:text-red-600 transition-colors ml-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              showBar();
              setTimeout(() => {
                hideBar();
                window.print();
              }, 400);
            }}
            className="btn-secondary flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Role
          </p>
          <p className="text-lg font-black text-slate-900 uppercase">
            {staff.role}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Total Paid
          </p>
          <p className="text-lg font-black text-green-600">
            PKR {formatCurrency(data.totalPaid)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Total Advance
          </p>
          <p className="text-lg font-black text-indigo-600">
            PKR {formatCurrency(data.totalAdvance)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Total Loan
          </p>
          <p className="text-lg font-black text-orange-600">
            PKR {formatCurrency(data.totalLoan)}
          </p>
        </div>
      </div>

      <div className="card-premium overflow-hidden border-slate-100 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-5 text-left">Date</th>
                <th className="px-6 py-5 text-left">Type</th>
                <th className="px-6 py-5 text-left">Month</th>
                <th className="px-6 py-5 text-left">Method / Account</th>
                <th className="px-6 py-5 text-left">Paid By</th>
                <th className="px-6 py-5 text-left">Received By</th>
                <th className="px-6 py-5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-slate-400 font-medium italic"
                  >
                    No transactions found.
                  </td>
                </tr>
              ) : (
                logs.map((l: any, i: number) => (
                  <tr
                    key={i}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">
                        {formatDateTime(l.date)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                          l.type === "salary"
                            ? "bg-green-50 text-green-600"
                            : l.type === "advance"
                              ? "bg-indigo-50 text-indigo-600"
                              : "bg-orange-50 text-orange-600"
                        }`}
                      >
                        {l.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700 uppercase text-xs">
                      {l.month}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 uppercase text-[10px]">
                        {l.method}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400">
                        {l.account}
                      </p>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-600 uppercase text-[10px]">
                      {l.payerName || "-"}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-600 uppercase text-[10px]">
                      {l.receiverName || "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-black text-green-600">
                        PKR {formatCurrency(l.amount)}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
