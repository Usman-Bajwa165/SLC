"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { accountsApi } from "@/lib/api/client";
import Modal from "@/components/ui/Modal";
import { Landmark, Wallet, ArrowUpRight, Plus, Building2 } from "lucide-react";
import { toast } from "sonner";
import { clsx } from "clsx";
import { showBar, hideBar } from "@/lib/progress";

function AddAccountModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [accountType, setAccountType] = useState<"bank" | "online">("bank");
  const [form, setForm] = useState({
    label: "",
    accountNumber: "",
    branch: "",
    openingBalance: "0",
  });

  const {
    data: paymentMethods,
    isLoading: loadingMethods,
    isSuccess,
  } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: accountsApi.paymentMethods,
  });

  const mutation = useMutation({
    mutationFn: accountsApi.createAccount,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Financial account created successfully!");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create account");
    },
  });

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="New Account"
      subtitle="Add a new financial account"
      icon={Building2}
      iconColor="text-brand-blue"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            className="btn-primary flex-1"
            disabled={!form.label || mutation.isPending || !isSuccess}
            onClick={() => {
              if (
                !isSuccess ||
                !paymentMethods ||
                paymentMethods.length === 0
              ) {
                alert(
                  "Payment methods are still loading or unavailable. Please refresh the page.",
                );
                return;
              }
              const selectedMethod = paymentMethods.find(
                (m: any) => m.type === accountType,
              );
              if (!selectedMethod) {
                alert(
                  `Payment method for ${accountType} not found. Please contact support.`,
                );
                return;
              }
              mutation.mutate({
                paymentMethodId: selectedMethod.id,
                label: form.label,
                accountNumber: form.accountNumber || undefined,
                branch:
                  accountType === "bank" ? form.branch || undefined : undefined,
                openingBalance: Number(form.openingBalance),
              });
            }}
          >
            {mutation.isPending ? "Creating..." : "Create Account"}
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <div>
          <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-3">
            Account Type *
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setAccountType("bank")}
              className={`flex-1 p-4 rounded-2xl border-2 transition-all ${
                accountType === "bank"
                  ? "border-brand-blue bg-brand-blue/5"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <Landmark
                className={`w-6 h-6 mx-auto mb-2 ${
                  accountType === "bank" ? "text-brand-blue" : "text-slate-400"
                }`}
              />
              <p
                className={`text-xs font-black uppercase tracking-widest ${
                  accountType === "bank" ? "text-brand-blue" : "text-slate-500"
                }`}
              >
                Bank
              </p>
            </button>
            <button
              type="button"
              onClick={() => setAccountType("online")}
              className={`flex-1 p-4 rounded-2xl border-2 transition-all ${
                accountType === "online"
                  ? "border-brand-blue bg-brand-blue/5"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <Wallet
                className={`w-6 h-6 mx-auto mb-2 ${
                  accountType === "online"
                    ? "text-brand-blue"
                    : "text-slate-400"
                }`}
              />
              <p
                className={`text-xs font-black uppercase tracking-widest ${
                  accountType === "online"
                    ? "text-brand-blue"
                    : "text-slate-500"
                }`}
              >
                Online
              </p>
            </button>
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2">
            Account Label *
          </label>
          <input
            className="input-field !text-slate-900 font-bold"
            placeholder="e.g. UBL — Main Branch"
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2">
              Account Number
            </label>
            <input
              className="input-field !text-slate-900 font-bold"
              placeholder="Optional"
              value={form.accountNumber}
              onChange={(e) =>
                setForm((f) => ({ ...f, accountNumber: e.target.value }))
              }
            />
          </div>
          {accountType === "bank" && (
            <div>
              <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2">
                Branch
              </label>
              <input
                className="input-field !text-slate-900 font-bold"
                placeholder="Optional"
                value={form.branch}
                onChange={(e) =>
                  setForm((f) => ({ ...f, branch: e.target.value }))
                }
              />
            </div>
          )}
        </div>
        <div>
          <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2">
            Opening Balance (PKR)
          </label>
          <input
            type="number"
            className="input-field !text-slate-900 font-bold"
            value={form.openingBalance}
            onChange={(e) =>
              setForm((f) => ({ ...f, openingBalance: e.target.value }))
            }
          />
        </div>
        {mutation.error && (
          <p className="text-red-500 text-xs font-bold mt-2">
            {String(mutation.error)}
          </p>
        )}
      </div>
    </Modal>
  );
}

import { Trash2, History } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { reportsApi } from "@/lib/api/client";

function AccountLedgerModal({ accountId }: { accountId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["account-ledger", accountId],
    queryFn: () => reportsApi.accountLedger(accountId),
  });

  if (isLoading)
    return (
      <div className="p-20 flex justify-center">
        <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const logs = data?.logs || [];

  return (
    <div className="space-y-6 max-h-[85vh] overflow-y-auto pr-2">
      <div className="overflow-hidden rounded-3xl border border-slate-100 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <tr>
              <th className="px-5 py-4 text-left">Date / Ref</th>
              <th className="px-5 py-4 text-left">Description</th>
              <th className="px-5 py-4 text-left">From</th>
              <th className="px-5 py-4 text-left">Category</th>
              <th className="px-5 py-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {logs.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-10 text-center text-slate-400 italic"
                >
                  No activity recorded for this account.
                </td>
              </tr>
            ) : (
              logs.map((l: any) => (
                <tr
                  key={l.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-800">
                      {formatDateTime(l.date)}
                    </p>
                    <p className="text-[10px] font-black text-brand-blue uppercase">
                      {l.reference || "TRX-ID"}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-900">
                      {l.description}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-700">
                      {l.senderName || "-"}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${l.type === "credit" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
                    >
                      {l.category}
                    </span>
                  </td>
                  <td
                    className={`px-5 py-4 text-right font-black ${l.type === "credit" ? "text-green-600" : "text-red-600"}`}
                  >
                    {l.type === "credit" ? "+" : "-"} PKR{" "}
                    {formatCurrency(l.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ManageAccountModal({
  onClose,
  account,
}: {
  onClose: () => void;
  account: any;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    label: account.label || "",
    accountNumber: account.accountNumber || "",
    branch: account.branch || "",
    paymentMethodId: account.paymentMethodId || account.paymentMethod?.id,
    currentBalance: account.currentBalance || 0,
  });

  const { data: methods } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: accountsApi.paymentMethods,
  });

  const updateMutation = useMutation({
    mutationFn: (dto: any) => accountsApi.updateAccount(account.id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Account updated successfully");
      onClose();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => accountsApi.deleteAccount(account.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Account deleted successfully");
      onClose();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const balance = Number(account.currentBalance ?? 0);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Manage Account"
      subtitle={`Editing ${account.label}`}
      icon={Building2}
      iconColor="text-brand-blue"
      footer={
        <div className="flex gap-3 w-full">
          <button
            onClick={() => {
              if (Number(form.currentBalance) !== 0) {
                toast.error("Account must have balance 0 to be deleted");
                return;
              }
              if (
                window.confirm(
                  "CRITICAL: This will soft-delete the account. Continue?",
                )
              ) {
                deleteMutation.mutate();
              }
            }}
            disabled={deleteMutation.isPending}
            className="p-3.5 rounded-xl border-2 border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 transition-all flex items-center justify-center group"
            title="Delete Account"
          >
            <Trash2 className="w-5 h-5 group-hover:scale-110 group-hover:rotate-6 transition-transform" />
          </button>
          <button onClick={onClose} className="btn-secondary px-6">
            Cancel
          </button>
          <button
            className="btn-primary flex-1 shadow-lg shadow-brand-blue/20"
            disabled={updateMutation.isPending || !form.label}
            onClick={() => updateMutation.mutate(form)}
          >
            {updateMutation.isPending ? "Saving..." : "Update Account"}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 text-center flex flex-col justify-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Current Balance
            </p>
            <p className="text-xl font-black text-slate-900">
              PKR {formatCurrency(Number(form.currentBalance))}
            </p>
          </div>
          <div className="p-4 bg-brand-blue/5 rounded-3xl border border-brand-blue/10 text-center flex flex-col justify-center">
            <p className="text-[10px] font-black text-brand-blue/60 uppercase tracking-widest mb-1">
              Status
            </p>
            <span className="text-xs font-black uppercase text-brand-blue">
              Active Channel
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2 px-1">
              Account Category (Type) *
            </label>
            <select
              className="input-field bg-white shadow-sm border-slate-200 text-xs font-bold"
              value={form.paymentMethodId}
              onChange={(e) =>
                setForm({ ...form, paymentMethodId: Number(e.target.value) })
              }
            >
              <option value="">Select Category</option>
              {methods
                ?.filter((m: any) => m.type !== "cash")
                .map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.type.toUpperCase()})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2 px-1">
              Display Label *
            </label>
            <input
              className="input-field !text-slate-900 font-bold bg-white"
              value={form.label}
              onChange={(e) =>
                setForm((f) => ({ ...f, label: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2 px-1">
                Account Number
              </label>
              <input
                className="input-field !text-slate-900 font-bold bg-white"
                value={form.accountNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, accountNumber: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2 px-1">
                Branch
              </label>
              <input
                className="input-field !text-slate-900 font-bold bg-white"
                value={form.branch}
                onChange={(e) =>
                  setForm((f) => ({ ...f, branch: e.target.value }))
                }
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2 px-1">
              Current Balance (PKR)
            </label>
            <input
              type="number"
              className="input-field !text-slate-900 font-bold bg-white"
              value={form.currentBalance}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  currentBalance: Number(e.target.value),
                }))
              }
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function AccountsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const initialTab = (searchParams.get("tab") || "all") as
    | "all"
    | "bank"
    | "online";
  const [activeTab, setActiveTabState] = useState<"all" | "bank" | "online">(
    initialTab,
  );
  const setActiveTab = (t: "all" | "bank" | "online") => {
    showBar();
    setActiveTabState(t);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", t);
    router.replace(`?${params.toString()}`, { scroll: false });
  };
  const [manageAccount, setManageAccount] = useState<any | null>(null);
  const [ledgerAccountId, setLedgerAccountId] = useState<number | null>(null);

  const { data: accountsRaw, isLoading: isAccountsLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: accountsApi.accounts,
  });

  const { data: dashboardRaw, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: reportsApi.dashboard,
  });

  const accounts = (accountsRaw as any)?.data || accountsRaw || [];
  const dashboard = dashboardRaw || {};

  if (isAccountsLoading || isDashboardLoading) {
    return (
      <div className="space-y-6 animate-pulse p-2 mx-auto max-w-[1600px]">
        <div className="h-40 bg-slate-100 rounded-[2rem]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-50 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  const filteredAccounts = accounts.filter((acc: any) => {
    if (activeTab === "all") return true;
    return acc.paymentMethod?.type === activeTab;
  });

  const totalBalance = accounts.reduce(
    (acc: number, curr: any) => acc + Number(curr.currentBalance || 0),
    0,
  );

  const cashBalance = Number(dashboard.cashBalance || 0);
  const bankBalance = Number(dashboard.bankBalance || 0);
  const onlineBalance = Number(dashboard.onlineBalance || 0);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {showAdd && <AddAccountModal onClose={() => setShowAdd(false)} />}
      {manageAccount && (
        <ManageAccountModal
          account={manageAccount}
          onClose={() => setManageAccount(null)}
        />
      )}
      <Modal
        isOpen={!!ledgerAccountId}
        onClose={() => setLedgerAccountId(null)}
        title="Account Transaction Ledger"
        icon={History}
      >
        {ledgerAccountId && <AccountLedgerModal accountId={ledgerAccountId} />}
      </Modal>

      <div className="flex-shrink-0 space-y-8 animate-fade-in p-2 max-w-[1600px] mx-auto w-full">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue/20 to-brand-gold/20 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative card-premium p-6 bg-slate-900 overflow-hidden min-h-[140px] flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold/10 blur-[100px] rounded-full -mr-32 -mt-32 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-blue/10 blur-[80px] rounded-full -ml-32 -mb-32" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
              <div>
                <h2 className="text-4xl font-black text-white tracking-tight mb-2">
                  Financial Accounts
                </h2>
                <p className="text-slate-400 font-medium">
                  Institutional liquidity and payment method management with real-time balance tracking.
                </p>
              </div>
              <div className="flex flex-col items-end">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold mb-2">
                  Total Combined Liquidity
                </p>
                <p className="text-5xl font-black text-white">
                  <span className="text-brand-gold/60 text-xl align-top mr-1">
                    PKR
                  </span>
                  {formatCurrency(totalBalance)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6 relative z-10 border-t border-brand-blue/20 pt-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">
                  Cash in Hand
                </p>
                <p className="text-xl font-bold text-white">
                  PKR {formatCurrency(cashBalance)}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">
                  Bank Accounts
                </p>
                <p className="text-xl font-bold text-white">
                  PKR {formatCurrency(bankBalance)}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">
                  Online Wallets
                </p>
                <p className="text-xl font-bold text-white">
                  PKR {formatCurrency(onlineBalance)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
            {["all", "bank", "online"].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t as any)}
                className={clsx(
                  "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                  activeTab === t
                    ? "bg-white text-brand-blue shadow-sm"
                    : "text-slate-400 hover:text-slate-600",
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="btn-primary flex items-center gap-2 group w-full md:w-auto px-8 py-3.5 shadow-lg shadow-brand-blue/20"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />{" "}
            Add New Account
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 max-w-[1600px] mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
        {filteredAccounts.map((acc: any) => {
          const type = acc.paymentMethod?.type || "cash";
          const isBank = type === "bank";
          const balance = Number(acc.currentBalance || 0);

          return (
            <div
              key={acc.id}
              className="card-premium p-6 group hover:scale-[1.02] transition-all duration-300 flex flex-col h-full bg-white border border-slate-100 shadow-sm"
            >
              <div className="flex justify-between items-start mb-6">
                <div
                  className={clsx(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner",
                    isBank
                      ? "bg-blue-50 text-brand-blue group-hover:bg-brand-blue group-hover:text-white group-hover:shadow-brand-blue/30"
                      : "bg-gold-50 text-brand-gold group-hover:bg-brand-gold group-hover:text-white group-hover:shadow-brand-gold/30",
                  )}
                >
                  {isBank ? (
                    <Landmark className="w-7 h-7" />
                  ) : (
                    <Wallet className="w-7 h-7" />
                  )}
                </div>
                <div
                  className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${acc.isActive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
                >
                  {acc.isActive ? "Active" : "Archived"}
                </div>
              </div>

              <div className="flex-1">
                <h3 className="text-xl font-black text-slate-800 tracking-tight leading-tight group-hover:text-brand-blue transition-colors">
                  {acc.label}
                </h3>
                {acc.accountNumber && (
                  <p className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    {acc.accountNumber}
                  </p>
                )}
                {acc.branch && (
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    {acc.branch}
                  </p>
                )}

                <div className="mt-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                    Current Balance
                  </p>
                  <p className="text-3xl font-black text-slate-900 tracking-tighter">
                    <span className="text-sm font-bold text-slate-300 mr-1.5 uppercase">
                      PKR
                    </span>
                    {formatCurrency(balance)}
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-green-500 text-[10px] font-black uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />{" "}
                  Operative
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setManageAccount(acc)}
                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-brand-blue transition-colors flex items-center gap-1"
                  >
                    Manage
                  </button>
                  <button
                    onClick={() => setLedgerAccountId(acc.id)}
                    className="text-[10px] font-black text-brand-blue uppercase tracking-widest hover:text-brand-gold transition-colors flex items-center gap-1 group/btn"
                  >
                    Ledger
                    <History className="w-3 h-3 group-hover/btn:rotate-12 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        <button
          onClick={() => setShowAdd(true)}
          className="border-2 border-dashed border-slate-200 rounded-[2rem] p-8 flex flex-col items-center justify-center gap-4 hover:border-brand-gold hover:bg-brand-gold/5 transition-all group min-h-[300px]"
        >
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-brand-gold group-hover:text-white transition-all shadow-sm">
            <Plus className="w-8 h-8" />
          </div>
          <div className="text-center">
            <p className="text-sm font-black text-slate-400 group-hover:text-brand-gold uppercase tracking-[0.2em]">
              Add Account
            </p>
            <p className="text-[10px] font-bold text-slate-300 uppercase mt-1">
              New payment channel
            </p>
          </div>
        </button>
        </div>
      </div>
    </div>
  );
}
