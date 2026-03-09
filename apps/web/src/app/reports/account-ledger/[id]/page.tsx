"use client";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { reportsApi, accountsApi } from "@/lib/api/client";
import { cn, formatDateTime, formatCurrency } from "@/lib/utils";
import {
  ChevronLeft,
  Printer,
  Landmark,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Wallet,
  Building,
  History,
  FileText,
} from "lucide-react";
import { exportToPDF } from "@/lib/report-utils";

export default function AccountLedgerPage() {
  const { id } = useParams();
  const router = useRouter();
  const accountId = Number(id);

  const { data: account } = useQuery({
    queryKey: ["account", accountId],
    queryFn: () => accountsApi.getAccount(accountId),
    enabled: !!accountId,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["account-ledger", accountId],
    queryFn: () => reportsApi.accountLedger(accountId),
    enabled: !!accountId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-black uppercase tracking-widest text-xs">
            Calculating balances...
          </p>
        </div>
      </div>
    );
  }

  const logs = data?.logs || [];
  const totalCredits = logs
    .filter((l: any) => l.type === "credit")
    .reduce((s: number, l: any) => s + Number(l.amount), 0);
  const totalDebits = logs
    .filter((l: any) => l.type === "debit")
    .reduce((s: number, l: any) => s + Number(l.amount), 0);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 animate-fade-in print:bg-white print:p-0">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-brand-blue font-black uppercase text-[10px] tracking-widest transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Accounts
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => {
                exportToPDF({
                  title: "FINANCIAL ACCOUNT LEDGER",
                  filename: `Account_${account?.label || accountId}`,
                  columns: ["Date", "Description", "Category", "Amount"],
                  data: logs.map((l: any) => [
                    formatDateTime(l.date),
                    l.description,
                    l.category,
                    `${l.type === "credit" ? "+" : "-"} PKR ${formatCurrency(l.amount)}`,
                  ]),
                  summary: [
                    { label: "Account Name", value: account?.label || "N/A" },
                    {
                      label: "Account No",
                      value: account?.accountNumber || "N/A",
                    },
                    {
                      label: "Total Inflow",
                      value: `PKR ${formatCurrency(totalCredits)}`,
                    },
                    {
                      label: "Total Outflow",
                      value: `PKR ${formatCurrency(totalDebits)}`,
                    },
                    {
                      label: "Current Balance",
                      value: `PKR ${formatCurrency(account?.currentBalance || 0)}`,
                    },
                  ],
                });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-colors shadow-sm"
            >
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

        {/* Branded Print Header */}
        <div className="hidden print:block text-center space-y-2 mb-8 border-b-2 border-slate-900 pb-6">
          <h1 className="text-4xl font-black tracking-tighter">
            STARS LAW COLLEGE
          </h1>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-slate-500">
            Official Financial Account Ledger
          </p>
          <div className="flex justify-between items-end pt-4">
            <div className="text-left space-y-1">
              <p className="text-[10px] font-black uppercase text-slate-400">
                Account Label
              </p>
              <p className="text-lg font-black uppercase">{account?.label}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[10px] font-black uppercase text-slate-400">
                Account Number
              </p>
              <p className="text-base font-black uppercase">
                {account?.accountNumber || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Account Summary Header */}
        <div className="card-premium p-6 md:p-8 overflow-hidden relative border-l-4 border-l-brand-blue print:border-none print:shadow-none print:p-0">
          <div className="absolute top-0 right-0 p-8 opacity-5 print:hidden">
            <History className="w-48 h-48 rotate-12" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start justify-between">
            <div className="flex gap-6 items-center">
              <div className="w-20 h-20 rounded-3xl bg-brand-blue/5 flex items-center justify-center text-brand-blue border border-brand-blue/10">
                {account?.category === "bank" ? (
                  <Landmark className="w-10 h-10" />
                ) : account?.category === "online" ? (
                  <Wallet className="w-10 h-10" />
                ) : (
                  <Building className="w-10 h-10" />
                )}
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Financial Account Ledger
                </p>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
                  {account?.label || "Account Ledger"}
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs font-black text-brand-blue bg-brand-blue/5 px-3 py-1 rounded-lg border border-brand-blue/10 uppercase italic">
                    {account?.category || "Payment Method"}
                  </span>
                  {account?.accountNumber && (
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      AC: {account.accountNumber}
                    </span>
                  )}
                  {account?.branch && (
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      {account.branch}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 min-w-[180px]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Current Balance
              </p>
              <p className="text-2xl font-black text-white mt-1">
                PKR {formatCurrency(account?.currentBalance || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Widgets */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-4">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Total Inflow
            </p>
            <p className="text-xl font-black text-green-600 mt-1">
              PKR {formatCurrency(totalCredits)}
            </p>
          </div>
          <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600 mb-4">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Total Outflow
            </p>
            <p className="text-xl font-black text-red-600 mt-1">
              PKR {formatCurrency(totalDebits)}
            </p>
          </div>
          <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-10 h-10 bg-brand-blue/5 rounded-xl flex items-center justify-center text-brand-blue mb-4">
              <History className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Transactions
            </p>
            <p className="text-xl font-black text-slate-800 mt-1">
              {logs.length}
            </p>
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
                      No transactions found for this account.
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
                          {log.senderName || "-"}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                          {log.category}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right font-black">
                        <span
                          className={cn(
                            "text-sm uppercase whitespace-nowrap",
                            log.type === "credit"
                              ? "text-green-600"
                              : "text-red-600",
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

        {/* Footer */}
        <div className="hidden print:block text-slate-400 text-[10px] font-bold text-center italic mt-12 pt-8 border-t border-slate-100">
          Generated on {formatDateTime(new Date())} • Stars Law College
          Management System
        </div>
      </div>
    </div>
  );
}
