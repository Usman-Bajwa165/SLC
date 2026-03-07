"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { financeApi, accountsApi } from "@/lib/api/client";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Calendar,
  Tag,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
} from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";

export default function FinancePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab =
    (searchParams.get("tab") as "income" | "expense") || "expense";
  const [tab, setTabState] = useState<"income" | "expense">(initialTab);
  const setTab = (t: "income" | "expense") => {
    setTabState(t);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", t);
    router.replace(`?${params.toString()}`, { scroll: false });
  };
  const [showAdd, setShowAdd] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    category: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["other-finance", tab, filters],
    queryFn: () => financeApi.list({ type: tab, ...filters }),
  });

  const transactions = data?.items || [];

  return (
    <div className="space-y-8 animate-fade-in p-2 max-w-[1600px] mx-auto">
      {showAdd && (
        <AddTransactionModal type={tab} onClose={() => setShowAdd(false)} />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Institutional Finance
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Manage operational income and expenditures outside of student fees.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className={clsx(
            "btn-primary flex items-center gap-2 group px-8 py-3.5",
            tab === "income"
              ? "!bg-green-600 !border-green-600"
              : "!bg-red-600 !border-red-600",
          )}
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          Add {tab === "income" ? "Income" : "Expense"}
        </button>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-2xl md:w-fit gap-1">
        <button
          onClick={() => setTab("expense")}
          className={clsx(
            "px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
            tab === "expense"
              ? "bg-white text-red-600 shadow-sm"
              : "text-slate-400 hover:text-slate-600",
          )}
        >
          <TrendingDown className="w-4 h-4" /> Expenses
        </button>
        <button
          onClick={() => setTab("income")}
          className={clsx(
            "px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
            tab === "income"
              ? "bg-white text-green-600 shadow-sm"
              : "text-slate-400 hover:text-slate-600",
          )}
        >
          <TrendingUp className="w-4 h-4" /> Income
        </button>
      </div>

      <div className="card-premium bg-white p-6 overflow-hidden">
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-xl border border-slate-100 flex-1 min-w-[300px]">
            <div className="pl-3 py-2 text-slate-400">
              <Calendar className="w-4 h-4" />
            </div>
            <input
              type="date"
              className="bg-transparent border-none text-xs font-bold focus:ring-0 text-slate-600"
              value={filters.dateFrom}
              onChange={(e) =>
                setFilters((f) => ({ ...f, dateFrom: e.target.value }))
              }
            />
            <span className="text-slate-300 font-black">→</span>
            <input
              type="date"
              className="bg-transparent border-none text-xs font-bold focus:ring-0 text-slate-600"
              value={filters.dateTo}
              onChange={(e) =>
                setFilters((f) => ({ ...f, dateTo: e.target.value }))
              }
            />
          </div>
          <button
            onClick={() =>
              setFilters({ dateFrom: "", dateTo: "", category: "" })
            }
            className="text-[10px] font-black uppercase text-slate-400 hover:text-brand-blue tracking-widest px-4"
          >
            Clear Filters
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Date / Category
                </th>
                <th className="text-left px-4 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Description / Note
                </th>
                <th className="text-left px-4 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Account
                </th>
                <th className="text-right px-4 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4} className="px-4 py-5">
                      <div className="h-10 bg-slate-50 rounded-xl animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-20 text-center text-slate-400 font-bold uppercase tracking-widest opacity-60"
                  >
                    No {tab} records found
                  </td>
                </tr>
              ) : (
                transactions.map((t: any) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-3">
                        <div
                          className={clsx(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                            tab === "income"
                              ? "bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white"
                              : "bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white",
                          )}
                        >
                          {tab === "income" ? (
                            <ArrowDownLeft className="w-5 h-5" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">
                            {new Date(t.date).toLocaleDateString()}
                          </p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                            {t.category}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <p className="text-slate-600 text-xs font-medium italic">
                        {t.notes || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-slate-700 text-xs">
                          {t.account?.label || "Cash"}
                        </span>
                      </div>
                    </td>
                    <td
                      className={clsx(
                        "px-4 py-5 text-right font-black text-lg tracking-tight",
                        tab === "income" ? "text-green-600" : "text-red-600",
                      )}
                    >
                      PKR {Number(t.amount).toLocaleString()}
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

function AddTransactionModal({
  type,
  onClose,
}: {
  type: "income" | "expense";
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    category: "",
    amount: "",
    accountId: "",
    notes: "",
    date: new Date().toISOString().split("T")[0],
  });

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: accountsApi.accounts,
  });
  const { data: categories } = useQuery({
    queryKey: ["finance-categories"],
    queryFn: financeApi.categories,
  });

  const mutation = useMutation({
    mutationFn: financeApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["other-finance"] });
      qc.invalidateQueries({ queryKey: ["finance-categories"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      toast.success(type === "income" ? "Income recorded" : "Expense recorded");
      onClose();
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={type === "income" ? "Record Income" : "Record Expense"}
      subtitle={`Adding item to operations ledger`}
      icon={type === "income" ? TrendingUp : TrendingDown}
      iconColor={type === "income" ? "text-green-600" : "text-red-600"}
      footer={
        <>
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            className={clsx(
              "btn-primary flex-1",
              type === "income"
                ? "!bg-green-600 !border-green-600"
                : "!bg-red-600 !border-red-600",
            )}
            disabled={mutation.isPending || !form.amount || !form.category}
            onClick={() =>
              mutation.mutate({
                ...form,
                type,
                amount: Number(form.amount),
                accountId: form.accountId ? Number(form.accountId) : undefined,
              })
            }
          >
            {mutation.isPending ? "Processing..." : "Record Transaction"}
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2">
              Category *
            </label>
            <div className="relative">
              <input
                className="input-field !text-slate-900 font-bold"
                placeholder="e.g. Utility"
                list="categories-list"
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
              />
              <datalist id="categories-list">
                {categories?.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2">
              Date *
            </label>
            <input
              type="date"
              className="input-field !text-slate-900 font-bold"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2">
              Amount (PKR) *
            </label>
            <input
              type="number"
              className="input-field !text-slate-900 font-bold"
              value={form.amount}
              onChange={(e) =>
                setForm((f) => ({ ...f, amount: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2">
              Target Account
            </label>
            <select
              className="input-field !text-slate-900 font-bold"
              value={form.accountId}
              onChange={(e) =>
                setForm((f) => ({ ...f, accountId: e.target.value }))
              }
            >
              <option value="">Cash (Direct)</option>
              {accounts?.map((acc: any) => (
                <option key={acc.id} value={acc.id}>
                  {acc.label} (PKR{" "}
                  {Number(acc.currentBalance || 0).toLocaleString()})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2">
            Notes
          </label>
          <textarea
            className="input-field !text-slate-900 font-bold min-h-[100px] py-3"
            placeholder="Optional description..."
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>
      </div>
    </Modal>
  );
}
