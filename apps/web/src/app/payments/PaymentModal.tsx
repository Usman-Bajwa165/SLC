"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentsApi, accountsApi } from "@/lib/api/client";
import { showBar, hideBar } from "@/lib/progress";
import { formatContact, formatCNIC } from "@/lib/utils";
import { clsx } from "clsx";
import { Save, AlertCircle, X } from "lucide-react";
import Modal from "@/components/ui/Modal";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: number;
  returnUrl?: string;
}

export default function PaymentModal({
  isOpen,
  onClose,
  studentId,
  returnUrl,
}: PaymentModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const amountRef = useRef<HTMLInputElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);

  const [form, setForm] = useState({
    advancePaid: "",
    paymentMethodId: "",
    accountId: "",
    receiptNo: "",
    senderName: "",
    receiverName: "",
    paymentDate: new Date().toISOString().split("T")[0],
  });

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const { data: student } = useQuery({
    queryKey: ["student", studentId],
    queryFn: () => studentsApi.get(studentId),
    enabled: isOpen && !!studentId,
  });

  useEffect(() => {
    if (isOpen && student && amountRef.current) {
      const timer = setTimeout(() => {
        amountRef.current?.focus();
        amountRef.current?.select();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, student]);

  const handleKeyDown = (e: React.KeyboardEvent, isLastField: boolean = false) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isLastField) {
        if (!isFormValid) return;
        submitBtnRef.current?.click();
      } else {
        const inputs = Array.from(document.querySelectorAll('input:not([disabled]):not([type="hidden"]), select:not([disabled])'));
        const currentIndex = inputs.indexOf(e.currentTarget as any);
        const nextInput = inputs[currentIndex + 1] as HTMLElement;
        nextInput?.focus();
      }
    }
  };

  const { data: accountsRaw } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => accountsApi.accounts(),
    enabled: isOpen,
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: () => accountsApi.paymentMethods(),
    enabled: isOpen,
  });

  const accounts = (accountsRaw as any)?.data || accountsRaw || [];

  const isFormValid = 
    form.advancePaid && 
    form.paymentDate && 
    form.paymentMethodId && 
    form.receiptNo &&
    (form.paymentMethodId === "cash" 
      ? form.receiverName 
      : (form.accountId && form.senderName));

  const currentFinance = student?.financeRecords?.find(
    (f: any) => !f.isSnapshot,
  );
  const totalPaid =
    student?.financeRecords
      ?.filter((f: any) => !f.isSnapshot)
      .reduce((s: number, f: any) => s + parseFloat(f.feePaid || 0), 0) ?? 0;
  const totalDue =
    student?.financeRecords
      ?.filter((f: any) => !f.isSnapshot)
      .reduce((s: number, f: any) => s + parseFloat(f.feeDue || 0), 0) ?? 0;
  const totalOutstanding =
    student?.financeRecords
      ?.filter((f: any) => !f.isSnapshot)
      .reduce((s: number, f: any) => s + parseFloat(f.remaining), 0) ?? 0;

  const mutation = useMutation({
    mutationFn: (data: any) => {
      showBar();
      const payload = { ...data };

      if (payload.accountId) payload.accountId = Number(payload.accountId);

      if (payload.paymentMethodId && paymentMethods) {
        const methodType = payload.paymentMethodId;
        const method = paymentMethods.find((m: any) => m.type === methodType);
        if (method) {
          payload.paymentMethodId = method.id;
        }
      }

      Object.keys(payload).forEach((key) => {
        if (payload[key] === "") delete payload[key];
      });

      return studentsApi.update(studentId, payload);
    },
    onSuccess: () => {
      hideBar();
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["student", studentId] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      
      setForm({
        advancePaid: "",
        paymentMethodId: "",
        accountId: "",
        receiptNo: "",
        senderName: "",
        receiverName: "",
        paymentDate: new Date().toISOString().split("T")[0],
      });
      
      if (returnUrl) {
        router.push(returnUrl);
      } else {
        onClose();
      }
    },
    onError: (err: any) => {
      hideBar();
    },
  });

  if (!student) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={student.name}
      subtitle={
        <>
          <span className="bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm">
            Reg: {student.registrationNo}
          </span>
          <span className="bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm">
            Roll: {student.rollNo || "—"}
          </span>
          <span className="bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm">
            {student.department?.name}
          </span>
          <span className="opacity-40">•</span>
          <span>{formatContact(student.contact)}</span>
          <span className="opacity-40">•</span>
          <span className="tracking-wider">{formatCNIC(student.cnic)}</span>
        </>
      }
      headerContent={student.name.charAt(0)}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">
            Financial Summary
          </h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                Current {student.programMode === "semester" ? "Sem" : "Year"}
              </label>
              <div className="input-field !py-1.5 !text-sm bg-white cursor-not-allowed">
                {student.currentSemester || "—"}
              </div>
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                Base Fee
              </label>
              <div className="input-field !py-1.5 !text-sm bg-white cursor-not-allowed">
                PKR {totalDue.toLocaleString()}
              </div>
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                Paid
              </label>
              <div className="input-field !py-1.5 !text-sm bg-white cursor-not-allowed">
                PKR {totalPaid.toLocaleString()}
              </div>
            </div>
            <div>
              <label className="block text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">
                Outstanding
              </label>
              <div className="input-field !py-1.5 !text-sm bg-white cursor-not-allowed font-black text-red-600">
                PKR {totalOutstanding.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-3">
            Payment Details
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black text-brand-gold uppercase tracking-widest mb-1">
                Amount Paying *
              </label>
              <input
                ref={amountRef}
                type="number"
                className="input-field !py-1.5 !text-sm !text-brand-blue font-bold border-brand-gold/50 focus:border-brand-gold"
                placeholder="0"
                max={totalOutstanding}
                value={form.advancePaid}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val <= totalOutstanding) {
                    set("advancePaid", e.target.value);
                  }
                }}
                onKeyDown={(e) => handleKeyDown(e)}
              />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-900 uppercase tracking-widest mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                className="input-field !py-1.5 !text-sm !text-slate-900 font-bold bg-white"
                value={form.paymentDate}
                onChange={(e) => set("paymentDate", e.target.value)}
                onKeyDown={(e) => handleKeyDown(e)}
              />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-900 uppercase tracking-widest mb-1">
                Payment Method *
              </label>
              <select
                className="input-field !py-1.5 !text-sm !text-slate-900 font-bold bg-white"
                value={form.paymentMethodId}
                onChange={(e) => set("paymentMethodId", e.target.value)}
                onKeyDown={(e) => handleKeyDown(e)}
              >
                <option value="">Select Method</option>
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
                <option value="online">Online</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-900 uppercase tracking-widest mb-1">
                Receipt No *
              </label>
              <input
                className="input-field !py-1.5 !text-sm !text-slate-900 font-bold"
                placeholder="Receipt ID"
                value={form.receiptNo}
                onChange={(e) => set("receiptNo", e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, form.paymentMethodId === "")}
              />
            </div>
            {(form.paymentMethodId === "bank" ||
              form.paymentMethodId === "online") && (
              <>
                <div>
                  <label className="block text-[9px] font-black text-slate-900 uppercase tracking-widest mb-1">
                    Target Account *
                  </label>
                  <select
                    className="input-field !py-1.5 !text-sm !text-slate-900 font-bold bg-white"
                    value={form.accountId}
                    onChange={(e) => set("accountId", e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e)}
                  >
                    <option value="">Select Account</option>
                    {accounts
                      ?.filter((acc: any) => {
                        const methodType = form.paymentMethodId;
                        return acc.paymentMethod?.type === methodType;
                      })
                      .map((acc: any) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.label}{" "}
                          {acc.accountNumber ? `(${acc.accountNumber})` : ""}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-900 uppercase tracking-widest mb-1">
                    Sender Name *
                  </label>
                  <input
                    className="input-field !py-1.5 !text-sm !text-slate-900 font-bold"
                    placeholder="Transferred by..."
                    value={form.senderName}
                    onChange={(e) => set("senderName", e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, true)}
                  />
                </div>
              </>
            )}
            {form.paymentMethodId === "cash" && (
              <div>
                <label className="block text-[9px] font-black text-slate-900 uppercase tracking-widest mb-1">
                  Receiver Name *
                </label>
                <input
                  className="input-field !py-1.5 !text-sm !text-slate-900 font-bold"
                  placeholder="Received by..."
                  value={form.receiverName}
                  onChange={(e) => set("receiverName", e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, true)}
                />
              </div>
            )}
          </div>
        </div>

        {mutation.error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-start gap-2 border border-red-100 font-bold text-xs shadow-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              {(mutation.error as any)?.response?.data?.message ||
                String(mutation.error)}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-black text-slate-500 hover:bg-slate-100 transition-colors uppercase tracking-widest text-[11px]"
          >
            Cancel
          </button>
          <button
            ref={submitBtnRef}
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending || !isFormValid}
            className="px-6 py-2.5 rounded-xl font-black text-white bg-brand-gold hover:bg-brand-gold-dark transition-colors uppercase tracking-widest text-[11px] flex items-center gap-2 shadow-lg shadow-brand-gold/30 disabled:opacity-50"
          >
            {mutation.isPending ? "Processing..." : "Record Payment"}
            <Save className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Modal>
  );
}
