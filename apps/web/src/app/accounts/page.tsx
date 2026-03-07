"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { accountsApi } from "@/lib/api/client";
import Modal from "@/components/ui/Modal";
import { Landmark, Wallet, ArrowUpRight, Plus, Building2 } from "lucide-react";

function AddAccountModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [accountType, setAccountType] = useState<"bank" | "online">("bank");
  const [form, setForm] = useState({
    label: "",
    accountNumber: "",
    branch: "",
    openingBalance: "0",
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: accountsApi.paymentMethods,
  });

  const mutation = useMutation({
    mutationFn: accountsApi.createAccount,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      onClose();
    },
  });

  const selectedMethod = paymentMethods?.find(
    (m: any) => m.type === accountType
  );

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
            disabled={!form.label || !selectedMethod || mutation.isPending}
            onClick={() =>
              mutation.mutate({
                paymentMethodId: selectedMethod.id,
                label: form.label,
                accountNumber: form.accountNumber || undefined,
                branch: form.branch || undefined,
                openingBalance: form.openingBalance,
              })
            }
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
                  accountType === "online" ? "text-brand-blue" : "text-slate-400"
                }`}
              />
              <p
                className={`text-xs font-black uppercase tracking-widest ${
                  accountType === "online" ? "text-brand-blue" : "text-slate-500"
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

export default function AccountsPage() {
  const [showAdd, setShowAdd] = useState(false);
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
      (acc: number, curr: any) =>
        acc + Number(curr.currentBalance ?? curr.balance ?? 0),
      0,
    ) || 0;

  return (
    <div className="space-y-8 animate-fade-in p-2 max-w-[1600px] mx-auto">
      {showAdd && <AddAccountModal onClose={() => setShowAdd(false)} />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Financial Accounts
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Institutional liquidity and payment method management.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="card-premium px-8 py-5 bg-brand-blue-dark text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-gold/20 blur-2xl rounded-full -mr-12 -mt-12" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300 relative z-10">
              Total Balance
            </p>
            <p className="text-3xl font-black mt-1 relative z-10">
              PKR {totalBalance.toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="btn-primary flex items-center gap-2 group"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />{" "}
            Add Account
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts && accounts.length > 0 ? (
          accounts.map((acc: any) => {
            const label = acc.label || acc.name || "";
            const balance = Number(acc.currentBalance ?? acc.balance ?? 0);
            const isBank =
              label.toLowerCase().includes("bank") ||
              label.toLowerCase().includes("ubl") ||
              label.toLowerCase().includes("hbl");
            return (
              <div
                key={acc.id}
                className="card-premium p-6 group hover:border-brand-gold/30 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-gold group-hover:text-white transition-all duration-500">
                    {isBank ? (
                      <Landmark className="w-6 h-6" />
                    ) : (
                      <Wallet className="w-6 h-6" />
                    )}
                  </div>
                  <div className="px-2.5 py-1 bg-green-50 text-green-600 rounded-lg text-[9px] font-black uppercase">
                    Active
                  </div>
                </div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">
                  {label}
                </h3>
                {acc.accountNumber && (
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    {acc.accountNumber}
                    {acc.branch ? ` · ${acc.branch}` : ""}
                  </p>
                )}
                <p className="text-2xl font-black text-slate-900 mt-3">
                  PKR {balance.toLocaleString()}
                </p>
                <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-green-600 text-[10px] font-black uppercase tracking-widest">
                    <ArrowUpRight className="w-3.5 h-3.5" /> Operational
                  </div>
                  <button className="text-xs font-black text-brand-blue uppercase hover:underline decoration-2 underline-offset-4">
                    View Ledger
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="lg:col-span-3 card-premium p-12 flex flex-col items-center justify-center text-center opacity-60">
            <Wallet className="w-12 h-12 text-slate-200 mb-4" />
            <p className="font-black text-slate-500 uppercase tracking-widest">
              No accounts yet
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Add your first financial account to get started.
            </p>
          </div>
        )}

        <button
          onClick={() => setShowAdd(true)}
          className="border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 hover:border-brand-gold hover:bg-brand-gold/5 transition-all group min-h-[220px]"
        >
          <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-brand-gold group-hover:text-white transition-all">
            <Plus className="w-7 h-7" />
          </div>
          <p className="text-sm font-black text-slate-400 group-hover:text-brand-gold uppercase tracking-widest">
            Add New Account
          </p>
        </button>
      </div>
    </div>
  );
}
