"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { financeApi, accountsApi, paymentsApi } from "@/lib/api/client";
import { showBar, hideBar } from "@/lib/progress";
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
import { reportsApi } from "@/lib/api/client";
import { Banknote, Landmark, ReceiptText } from "lucide-react";

const EXPENSE_CATEGORIES = [
  "Utility Bills",
  "Daily Expense",
  "Maintenance",
  "Stationery",
  "Transport",
  "Others",
];

const INCOME_CATEGORIES = ["Donation", "Grant", "Government Aid", "Others"];

export default function FinancePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab =
    (searchParams.get("tab") as "income" | "expense") || "expense";
  const [tab, setTabState] = useState<"income" | "expense">(initialTab);
  const setTab = (t: "income" | "expense") => {
    showBar();
    setTabState(t);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", t);
    router.replace(`?${params.toString()}`, { scroll: false });
  };
  const [showAdd, setShowAdd] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    categories: [] as string[],
  });

  const { data: allTransactions, isLoading } = useQuery({
    queryKey: ["other-finance-all", tab],
    queryFn: () => financeApi.list({ type: tab }),
  });

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: accountsApi.accounts,
  });

  const { data: studentFeePayments } = useQuery({
    queryKey: ["student-fee-payments"],
    queryFn: () => paymentsApi.list({ limit: 1000 }),
    enabled: tab === "income",
  });

  const { data: staffPaymentsRes } = useQuery({
    queryKey: ["staff-payments-finance"],
    queryFn: () => paymentsApi.list({ source: "staff", limit: 1000 }),
    enabled: tab === "expense",
  });

  const allTxns = allTransactions?.items || [];
  const studentFees =
    tab === "income"
      ? (studentFeePayments?.data || []).map((p: any) => ({
          id: `payment-${p.id}`,
          category: "Student Fees",
          date: p.date,
          notes: `Payment from ${p.student?.name || "Student"} - ${p.student?.registrationNo || "N/A"}`,
          amount: p.amount,
          accountId: p.accountId,
          account: p.account,
          senderName: p.senderName,
          receiverName: p.receiverName,
        }))
      : [];

  const staffPayments =
    tab === "expense"
      ? (staffPaymentsRes?.data || []).map((p: any) => ({
          id: `staff-${p.id}`,
          category: "Salary",
          date: p.date,
          notes: `${(p.type || "").toUpperCase()} paid to ${p.staff?.name || "Staff"} - ${p.month || "N/A"}`,
          amount: p.amount,
          accountId: p.accountId,
          account: p.account,
          senderName: p.payerName || p.senderName,
          receiverName: p.staff?.name,
        }))
      : [];

  const allRecords = [...allTxns, ...studentFees, ...staffPayments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  // Filter by categories and date range on frontend
  let filteredTransactions = allRecords;

  if (filters.categories.length > 0) {
    filteredTransactions = filteredTransactions.filter((t: any) =>
      filters.categories.includes(t.category),
    );
  }

  if (filters.dateFrom) {
    filteredTransactions = filteredTransactions.filter(
      (t: any) => new Date(t.date) >= new Date(filters.dateFrom),
    );
  }

  if (filters.dateTo) {
    filteredTransactions = filteredTransactions.filter(
      (t: any) => new Date(t.date) <= new Date(filters.dateTo),
    );
  }

  const totalItems = filteredTransactions.length;

  const totalAmount = filteredTransactions.reduce(
    (sum: number, t: any) => sum + Number(t.amount || 0),
    0,
  );

  // Calculate totals by payment method type from filtered records
  const accountsList = (accounts as any)?.data || accounts || [];

  const cashTotal = filteredTransactions
    .filter((t: any) => !t.accountId)
    .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

  const bankTotal = filteredTransactions
    .filter((t: any) => {
      if (!t.accountId) return false;
      const acc = accountsList.find((a: any) => a.id === t.accountId);
      return acc?.paymentMethod?.type === "bank";
    })
    .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

  const onlineTotal = filteredTransactions
    .filter((t: any) => {
      if (!t.accountId) return false;
      const acc = accountsList.find((a: any) => a.id === t.accountId);
      return acc?.paymentMethod?.type === "online";
    })
    .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

  const dCategories =
    tab === "expense"
      ? [...EXPENSE_CATEGORIES, "Salary"]
      : [...INCOME_CATEGORIES, "Student Fees"];

  return (
    <div className="space-y-6 animate-fade-in p-2 max-w-[1600px] mx-auto">
      {showAdd && (
        <AddTransactionModal type={tab} onClose={() => setShowAdd(false)} />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Institutional Finance{" "}
            <span className="text-slate-500 font-medium text-base ml-3">
              Manage operational income and expenditures outside of student
              fees.
            </span>
          </h2>
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

      {/* Tab Toggle */}
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card-premium p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
            <ReceiptText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Records
            </p>
            <p className="text-xl font-black text-slate-800">{totalItems}</p>
          </div>
        </div>
        <div
          className={clsx(
            "card-premium p-4 flex items-center gap-3",
            tab === "income" ? "bg-green-50/50" : "bg-red-50/50",
          )}
        >
          <div
            className={clsx(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              tab === "income"
                ? "bg-green-100 text-green-600"
                : "bg-red-100 text-red-600",
            )}
          >
            {tab === "income" ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <TrendingDown className="w-5 h-5" />
            )}
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Total {tab === "income" ? "Income" : "Expense"}
            </p>
            <p
              className={clsx(
                "text-lg font-black",
                tab === "income" ? "text-green-700" : "text-red-700",
              )}
            >
              PKR {totalAmount.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="card-premium p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Cash {tab === "income" ? "Received" : "Paid"}
            </p>
            <p className="text-lg font-black text-slate-800">
              PKR {cashTotal.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="card-premium p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Bank {tab === "income" ? "Received" : "Paid"}
            </p>
            <p className="text-lg font-black text-slate-800">
              PKR {bankTotal.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="card-premium p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Online {tab === "income" ? "Received" : "Paid"}
            </p>
            <p className="text-lg font-black text-slate-800">
              PKR {onlineTotal.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Filters + Table */}
      <div className="card-premium bg-white p-6 overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
        <div className="flex flex-wrap items-end gap-3 mb-6 flex-shrink-0">
          {/* Date Range */}
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
            <Calendar className="w-4 h-4 text-slate-400 ml-1 flex-shrink-0" />
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

          {/* Category Filter Chips */}
          <div className="flex flex-wrap gap-1 flex-1">
            <button
              onClick={() => setFilters((f) => ({ ...f, categories: [] }))}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                filters.categories.length === 0
                  ? tab === "expense"
                    ? "bg-red-600 text-white"
                    : "bg-green-600 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200",
              )}
            >
              All
            </button>
            {dCategories.map((cat) => (
              <button
                key={cat}
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    categories: f.categories.includes(cat)
                      ? f.categories.filter((c) => c !== cat)
                      : [...f.categories, cat],
                  }))
                }
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                  filters.categories.includes(cat)
                    ? tab === "expense"
                      ? "bg-red-600 text-white"
                      : "bg-green-600 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={() =>
              setFilters({ dateFrom: "", dateTo: "", categories: [] })
            }
            className="text-[10px] font-black uppercase text-slate-400 hover:text-brand-blue tracking-widest px-3 py-1.5 border border-slate-200 rounded-lg hover:border-brand-blue transition-all"
          >
            Clear
          </button>
        </div>

        <div className="flex-1 overflow-hidden rounded-2xl border border-slate-50 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[180px]">
                    Date
                  </th>
                  <th className="text-left px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[140px]">
                    Category
                  </th>
                  <th className="text-left px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Description
                  </th>
                  <th className="text-left px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[200px]">
                    Account
                  </th>
                  <th className="text-right px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[150px]">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="px-4 py-5">
                        <div className="h-10 bg-slate-50 rounded-xl animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-20 text-center text-slate-400 font-bold uppercase tracking-widest opacity-60"
                    >
                      No {tab} records found
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t: any) => (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-4 py-5 w-[180px]">
                        <div className="flex items-center gap-3">
                          <div
                            className={clsx(
                              "w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0",
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
                          <p className="font-bold text-slate-900 text-xs">
                            {new Date(t.date).toLocaleDateString("en-PK", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-5 w-[140px]">
                        <span
                          className={clsx(
                            "text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter",
                            tab === "income"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700",
                          )}
                        >
                          {t.category}
                        </span>
                      </td>
                      <td className="px-4 py-5 max-w-[200px]">
                        <p className="text-slate-600 text-xs font-medium italic truncate">
                          {t.notes || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-5 w-[200px]">
                        <div>
                          <div className="flex items-center gap-2">
                            <Wallet className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-bold text-slate-700 text-xs">
                              {t.account?.label || "Cash"}
                              {t.account?.accountNumber && (
                                <span className="text-slate-400 font-normal ml-1">
                                  ({t.account.accountNumber})
                                </span>
                              )}
                            </span>
                          </div>
                          {(t.senderName || t.receiverName) && (
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5 ml-5">
                              {tab === "income"
                                ? t.accountId
                                  ? t.senderName
                                  : t.receiverName
                                : t.accountId
                                  ? t.receiverName
                                  : t.senderName}
                            </p>
                          )}
                        </div>
                      </td>
                      <td
                        className={clsx(
                          "px-4 py-5 text-right font-black text-lg tracking-tight w-[150px]",
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

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {totalItems} record{totalItems !== 1 ? "s" : ""} found
          </p>
          <p
            className={clsx(
              "text-sm font-black",
              tab === "income" ? "text-green-600" : "text-red-600",
            )}
          >
            Total: PKR {totalAmount.toLocaleString()}
          </p>
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
  const categories =
    type === "expense"
      ? EXPENSE_CATEGORIES
      : INCOME_CATEGORIES.filter((c) => c !== "Student Fees");
  const [form, setForm] = useState({
    category: "",
    amount: "",
    accountId: "",
    notes: "",
    date: new Date().toISOString().split("T")[0],
    senderName: "",
    receiverName: "",
  });

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: accountsApi.accounts,
  });

  const mutation = useMutation({
    mutationFn: financeApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["other-finance"] });
      qc.invalidateQueries({ queryKey: ["other-finance-all"] });
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
            <select
              className="input-field !text-slate-900 font-bold"
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
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
            {type === "income" ? "Sender Name" : "Receiver Name"}
          </label>
          <input
            className="input-field !text-slate-900 font-bold"
            placeholder={type === "income" ? "Received from..." : "Paid to..."}
            value={type === "income" ? form.senderName : form.receiverName}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                [type === "income" ? "senderName" : "receiverName"]:
                  e.target.value,
              }))
            }
          />
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
