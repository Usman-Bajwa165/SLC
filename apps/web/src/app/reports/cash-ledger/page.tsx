"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/api/client";
import { Calendar, Wallet, ChevronLeft, FileText, Printer } from "lucide-react";
import { clsx } from "clsx";
import { showBar, hideBar } from "@/lib/progress";

const formatCurrency = (val: number) => val.toLocaleString();
const formatDateTime = (date: string) => new Date(date).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function CashLedgerPage() {
  const router = useRouter();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["cash-ledger", from, to, type],
    queryFn: async () => {
      const result = await reportsApi.cashLedger(from || undefined, to || undefined, type === "all" ? undefined : type);
      hideBar();
      return result;
    },
  });

  const logs = data?.logs || [];
  const totalCash = data?.totalCash || 0;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 animate-fade-in">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => router.push('/reports')}
              className="flex items-center gap-2 text-slate-400 hover:text-brand-blue font-black uppercase text-[10px] tracking-widest transition-colors group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back
            </button>
            <div className="h-4 w-px bg-slate-200" />

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
            </div>

            <div className="h-4 w-px bg-slate-200" />

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm text-[10px] font-black uppercase outline-none text-slate-600 focus:text-brand-blue transition-colors appearance-none cursor-pointer min-w-[120px]"
            >
              <option value="all">All</option>
              <option value="incoming">Income</option>
              <option value="outgoing">Outgoing</option>
              <option value="adjustments">Adjustments</option>
            </select>

            {(from || to || type !== "all") && (
              <button
                onClick={() => {
                  setFrom("");
                  setTo("");
                  setType("all");
                }}
                className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:text-red-600 transition-colors ml-1"
              >
                Reset
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-colors shadow-sm">
              <FileText className="w-4 h-4 text-brand-blue" /> Export PDF
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4 text-slate-400" /> Print Ledger
            </button>
          </div>
        </div>

        {/* Cash Summary Header */}
        <div className="card-premium p-6 md:p-8 overflow-hidden relative border-l-4 border-l-amber-600">
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start justify-between">
            <div className="flex gap-6 items-center">
              <div className="w-20 h-20 rounded-3xl bg-amber-600/5 flex items-center justify-center text-amber-600 border border-amber-600/10">
                <Wallet className="w-10 h-10" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Cash Ledger
                </p>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
                  Cash in Hand
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs font-black text-amber-600 bg-amber-600/5 px-3 py-1 rounded-lg border border-amber-600/10 uppercase italic">
                    Cash Transactions
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 min-w-[180px]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Current Balance
              </p>
              <p className="text-2xl font-black text-white mt-1">
                PKR {formatCurrency(totalCash)}
              </p>
            </div>
          </div>
        </div>



        {/* Transaction Table */}
        <div className="card-premium overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-blue" />
              Complete Transaction Log
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Date / Reference</th>
                  <th className="px-6 py-4">Transaction Details</th>
                  <th className="px-6 py-4">From</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-right">Inflow / Outflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-slate-400 font-medium italic"
                    >
                      No cash transactions found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log: any) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-5 whitespace-nowrap">
                        <p className="text-sm font-black text-slate-800">
                          {formatDateTime(log.date)}
                        </p>
                        <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest mt-0.5">
                          {log.reference || "AUDIT-LOG"}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-slate-700">
                          {log.description}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-slate-700">
                          {log.type === "credit" ? log.senderName : log.receiverName || "-"}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                          {log.category}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right font-black">
                        <span
                          className={clsx(
                            "text-sm uppercase whitespace-nowrap",
                            log.type === "credit"
                              ? "text-green-600"
                              : "text-red-600"
                          )}
                        >
                          {log.type === "credit" ? "+" : "-"} PKR{" "}
                          {formatCurrency(log.amount)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
