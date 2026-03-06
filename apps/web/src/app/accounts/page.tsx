"use client";
import { useQuery } from "@tanstack/react-query";
import { accountsApi } from "@/lib/api/client";
import {
  Landmark,
  Wallet,
  Banknote,
  Landmark as Bank,
  ArrowUpRight,
  ArrowDownRight,
  History,
  MoreHorizontal,
  Plus,
  CreditCard,
} from "lucide-react";
import { clsx } from "clsx";

export default function AccountsPage() {
  const { data: accounts, isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: accountsApi.accounts,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-3xl" />
          ))}
        </div>
        <div className="h-96 bg-slate-50 rounded-3xl" />
      </div>
    );
  }

  const totalBalance =
    accounts?.reduce(
      (acc: number, curr: any) => acc + Number(curr.balance),
      0,
    ) || 0;

  return (
    <div className="space-y-8 animate-fade-in p-2 max-w-[1600px] mx-auto">
      {/* Header & Total */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Financial Accounts
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Institutional liquidity and payment method management.
          </p>
        </div>
        <div className="card-premium px-8 py-5 bg-brand-blue-dark text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-gold/20 blur-2xl rounded-full -mr-12 -mt-12" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300 relative z-10">
            Total Aggregate Balance
          </p>
          <p className="text-3xl font-black mt-1 relative z-10">
            PKR {totalBalance.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Grid of Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts?.map((acc: any) => (
          <div
            key={acc.id}
            className="card-premium p-6 group hover:border-brand-gold/30 transition-all duration-300"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-gold group-hover:text-white transition-all duration-500">
                {acc.name.toLowerCase().includes("bank") ? (
                  <Bank className="w-6 h-6" />
                ) : (
                  <Wallet className="w-6 h-6" />
                )}
              </div>
              <button className="p-2 text-slate-300 hover:text-slate-600">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
              {acc.name}
            </h3>
            <p className="text-2xl font-black text-slate-900 mt-2">
              PKR {Number(acc.balance).toLocaleString()}
            </p>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-green-600 text-[10px] font-black uppercase tracking-widest">
                <ArrowUpRight className="w-3.5 h-3.5" />
                +2.4% (MoM)
              </div>
              <button className="text-xs font-black text-brand-blue uppercase hover:underline decoration-2 underline-offset-4">
                View Ledger
              </button>
            </div>
          </div>
        ))}

        <button className="border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 hover:border-brand-gold hover:bg-brand-gold/5 transition-all group min-h-[220px]">
          <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-brand-gold group-hover:text-white transition-all">
            <Plus className="w-7 h-7" />
          </div>
          <p className="text-sm font-black text-slate-400 group-hover:text-brand-gold uppercase tracking-widest">
            Add New Account
          </p>
        </button>
      </div>

      {/* Recent Ledger History Mock (Global) */}
      <div className="card-premium p-0 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-800">
              Consolidated Ledger
            </h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              Stream of latest financial movements
            </p>
          </div>
          <button className="btn-secondary text-[10px]">Filter History</button>
        </div>
        <div className="divide-y divide-slate-100">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="px-8 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className={clsx(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    i % 2 === 0
                      ? "bg-green-50 text-green-600"
                      : "bg-red-50 text-red-600",
                  )}
                >
                  {i % 2 === 0 ? (
                    <ArrowUpRight className="w-5 h-5" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800 uppercase">
                    {i % 2 === 0 ? "Cash Deposit" : "Utility Expense"}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                    March 07, 2026 • Reference #{1000 + i}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={clsx(
                    "text-sm font-black",
                    i % 2 === 0 ? "text-green-600" : "text-red-600",
                  )}
                >
                  {i % 2 === 0 ? "+" : "-"} PKR{" "}
                  {(25000 + i * 500).toLocaleString()}
                </p>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">
                  Verified Trans.
                </p>
              </div>
            </div>
          ))}
        </div>
        <button className="w-full py-4 bg-slate-50 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-colors">
          View Full Audit Trail
        </button>
      </div>
    </div>
  );
}
