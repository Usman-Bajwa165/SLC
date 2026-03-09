"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  studentsApi,
  departmentsApi,
  sessionsApi,
  accountsApi,
} from "@/lib/api/client";
import { showBar, hideBar } from "@/lib/progress";
import { clsx } from "clsx";
import { Save, AlertCircle } from "lucide-react";
import Modal from "@/components/ui/Modal";

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddStudentModal({
  isOpen,
  onClose,
}: AddStudentModalProps) {
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLDivElement>(null);

  // Form State
  const [form, setForm] = useState({
    name: "",
    parentGuardian: "",
    cnic: "",
    registrationNo: "",
    rollNo: "",
    departmentId: "",
    sessionId: "",
    programMode: "semester",
    currentSemester: "",
    marksType: "marks",
    obtainedMarks: "",
    totalMarks: "",
    sgpa: "",
    cgpa: "",
    initialFeeAmount: "",
    advancePaid: "",
    paymentMethodId: "",
    accountId: "",
    receiptNo: "",
    senderName: "",
    paymentDate: new Date().toISOString().split("T")[0],
  });

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setForm({
        name: "",
        parentGuardian: "",
        cnic: "",
        registrationNo: "",
        rollNo: "",
        departmentId: "",
        sessionId: "",
        programMode: "semester",
        currentSemester: "",
        marksType: "marks",
        obtainedMarks: "",
        totalMarks: "",
        sgpa: "",
        cgpa: "",
        initialFeeAmount: "",
        advancePaid: "",
        paymentMethodId: "",
        accountId: "",
        receiptNo: "",
        senderName: "",
        paymentDate: new Date().toISOString().split("T")[0],
      });
    }
  }, [isOpen]);

  // Fetch Data
  const { data: depts } = useQuery({
    queryKey: ["departments"],
    queryFn: departmentsApi.list,
    enabled: isOpen,
  });
  const { data: allSessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => sessionsApi.list(),
    enabled: isOpen,
  });
  const { data: accountsRaw } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => accountsApi.accounts(),
    enabled: isOpen,
  });

  const accounts = (accountsRaw as any)?.data || accountsRaw || [];

  const selectedDept = depts?.find(
    (d: any) => d.id === Number(form.departmentId),
  );
  const filteredSessions =
    allSessions?.filter(
      (s: any) => s.departmentId === Number(form.departmentId),
    ) || [];

  useEffect(() => {
    if (selectedDept) {
      const pMode = selectedDept.offersSem ? "semester" : "annual";
      set("programMode", pMode);
      if (selectedDept.feeStructures?.length) {
        const activeFee = selectedDept.feeStructures.find(
          (f: any) => f.programMode === pMode,
        );
        if (activeFee) set("initialFeeAmount", activeFee.feeAmount.toString());
      } else {
        set("initialFeeAmount", "");
      }
    }
  }, [form.departmentId, selectedDept]);

  const advanceVal = Number(form.advancePaid) || 0;
  const initialFeeVal = Number(form.initialFeeAmount) || 0;
  const remainingCalculated = Math.max(0, initialFeeVal - advanceVal);

  const mutation = useMutation({
    mutationFn: (data: any) => {
      showBar();
      const payload = { ...data };
      if (payload.marksType === "cgpa") {
        delete payload.obtainedMarks;
        delete payload.totalMarks;
      } else {
        delete payload.sgpa;
        delete payload.cgpa;
      }
      delete payload.marksType;

      if (payload.departmentId)
        payload.departmentId = Number(payload.departmentId);
      if (payload.sessionId) payload.sessionId = Number(payload.sessionId);
      if (payload.currentSemester)
        payload.currentSemester = Number(payload.currentSemester);
      if (payload.obtainedMarks)
        payload.obtainedMarks = Number(payload.obtainedMarks);
      if (payload.totalMarks) payload.totalMarks = Number(payload.totalMarks);
      if (payload.sgpa) payload.sgpa = Number(payload.sgpa);
      if (payload.cgpa) payload.cgpa = Number(payload.cgpa);
      if (payload.accountId) payload.accountId = Number(payload.accountId);

      if (!payload.advancePaid) delete payload.advancePaid;
      if (!payload.accountId) delete payload.accountId;
      if (!payload.receiptNo) delete payload.receiptNo;
      if (!payload.paymentMethodId) delete payload.paymentMethodId;
      if (!payload.senderName) delete payload.senderName;
      if (!payload.initialFeeAmount) delete payload.initialFeeAmount;
      if (!payload.paymentDate) delete payload.paymentDate;
      if (!payload.sessionId) delete payload.sessionId;
      if (!payload.rollNo) delete payload.rollNo;

      if (payload.paymentMethodId) {
        payload.paymentMethodId =
          payload.paymentMethodId === "cash"
            ? 1
            : payload.paymentMethodId === "bank"
              ? 2
              : 3;
      }

      return studentsApi.create(payload);
    },
    onSuccess: () => {
      hideBar();
      queryClient.invalidateQueries({ queryKey: ["students"] });
      onClose();
    },
    onError: (err: any) => {
      hideBar();
    },
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      const target = e.target as HTMLElement;
      if (target.tagName !== "INPUT" && target.tagName !== "SELECT") return;

      e.preventDefault();
      if (!formRef.current) return;

      const focusable = Array.from(
        formRef.current.querySelectorAll(
          "input:not([disabled]), select:not([disabled]), button:not([disabled])",
        ),
      ) as HTMLElement[];

      const index = focusable.indexOf(target);
      if (index > -1 && index < focusable.length - 1) {
        focusable[index + 1].focus();
      } else if (index === focusable.length - 1) {
        if (focusable[index].tagName === "BUTTON") {
          focusable[index].click();
        }
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enroll New Student"
      maxWidth="max-w-5xl"
    >
      <div
        ref={formRef}
        onKeyDown={handleKeyDown}
        className="space-y-4 max-w-full pb-4"
      >
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden relative z-40">
          <div className="p-3 bg-slate-50/50 border-b border-slate-100">
            <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
              Personal Details
            </h2>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">
                Full Name *
              </label>
              <input
                autoFocus
                className="input-field !py-1.5 !text-sm !text-slate-900 font-bold"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">
                Parent / Guardian *
              </label>
              <input
                className="input-field !py-1.5 !text-sm !text-slate-900 font-bold"
                value={form.parentGuardian}
                onChange={(e) => set("parentGuardian", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">
                CNIC (13 Digits) *
              </label>
              <input
                className="input-field !py-1.5 !text-sm !text-slate-900 font-bold"
                maxLength={13}
                value={form.cnic}
                onChange={(e) => set("cnic", e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">
                Registration No *
              </label>
              <input
                className="input-field !py-1.5 !text-sm !text-slate-900 font-bold"
                value={form.registrationNo}
                onChange={(e) => set("registrationNo", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">
                Roll No (Optional)
              </label>
              <input
                className="input-field !py-1.5 !text-sm !text-slate-900 font-bold"
                value={form.rollNo}
                onChange={(e) => set("rollNo", e.target.value)}
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50/50 border-y border-slate-100 flex justify-between items-center">
            <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
              Academic Details
            </h2>
            <div className="flex bg-slate-200 p-0.5 rounded-lg w-40">
              <button
                type="button"
                onClick={() => set("marksType", "marks")}
                className={clsx(
                  "flex-1 py-1 text-[9px] font-black uppercase rounded-md transition-all",
                  form.marksType === "marks"
                    ? "bg-white text-brand-blue shadow-sm"
                    : "text-slate-400",
                )}
              >
                Marks
              </button>
              <button
                type="button"
                onClick={() => set("marksType", "cgpa")}
                className={clsx(
                  "flex-1 py-1 text-[9px] font-black uppercase rounded-md transition-all",
                  form.marksType === "cgpa"
                    ? "bg-white text-brand-blue shadow-sm"
                    : "text-slate-400",
                )}
              >
                CGPA
              </button>
            </div>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">
                Department *
              </label>
              <select
                className="input-field !py-1.5 !text-sm !text-slate-900 font-bold bg-white"
                value={form.departmentId}
                onChange={(e) => set("departmentId", e.target.value)}
              >
                <option value="">Select Department</option>
                {depts?.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">
                Session *
              </label>
              <select
                className="input-field !py-1.5 !text-sm !text-slate-900 font-bold bg-white"
                value={form.sessionId}
                onChange={(e) => set("sessionId", e.target.value)}
              >
                <option value="">Session</option>
                {filteredSessions.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">
                {form.programMode === "semester" ? "Semester" : "Year"} *
              </label>
              <input
                type="number"
                className="input-field !py-1.5 !text-sm !text-slate-900 font-bold"
                min="1"
                value={form.currentSemester}
                onChange={(e) => set("currentSemester", e.target.value)}
              />
            </div>

            {form.marksType === "marks" ? (
              <>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">
                    Obtained Marks
                  </label>
                  <input
                    type="number"
                    className="input-field !py-1.5 !text-sm !text-slate-900 font-bold"
                    value={form.obtainedMarks}
                    onChange={(e) => set("obtainedMarks", e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    className="input-field !py-1.5 !text-sm !text-slate-900 font-bold"
                    value={form.totalMarks}
                    onChange={(e) => set("totalMarks", e.target.value)}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">
                    SGPA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field !py-1.5 !text-sm !text-slate-900 font-bold"
                    value={form.sgpa}
                    onChange={(e) => set("sgpa", e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">
                    CGPA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field !py-1.5 !text-sm !text-slate-900 font-bold"
                    value={form.cgpa}
                    onChange={(e) => set("cgpa", e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <div className="p-3 bg-slate-50/50 border-y border-slate-100">
            <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
              Fee & Quick Payment
            </h2>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">
                {form.programMode === "semester" ? "Sem Fee" : "Annual Fee"}
              </label>
              <input
                type="number"
                className="input-field !py-1.5 !text-sm !text-slate-900 font-bold border-brand-blue/20"
                placeholder="Auto from Dept"
                value={form.initialFeeAmount}
                onChange={(e) => set("initialFeeAmount", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-brand-gold uppercase tracking-widest mb-1">
                Advance Paid
              </label>
              <input
                type="number"
                className="input-field !py-1.5 !text-sm !text-brand-blue font-bold border-brand-gold/50 focus:border-brand-gold"
                placeholder="e.g. 5000"
                value={form.advancePaid}
                onChange={(e) => set("advancePaid", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">
                Payment Date
              </label>
              <input
                type="date"
                className="input-field !py-1.5 !text-sm !text-slate-900 font-bold bg-white"
                value={form.paymentDate}
                onChange={(e) => set("paymentDate", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">
                Remaining
              </label>
              <div className="input-field !py-1.5 bg-slate-100 !text-slate-500 font-black cursor-not-allowed">
                Rs. {remainingCalculated.toLocaleString()}
              </div>
            </div>
          </div>

          {Number(form.advancePaid) > 0 && (
            <div className="m-4 mt-0 p-4 grid grid-cols-1 md:grid-cols-4 gap-3 animate-in fade-in duration-300 bg-brand-gold/5 rounded-xl border border-brand-gold/20">
              <div>
                <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">
                  Method *
                </label>
                <select
                  className="input-field !py-1.5 !text-sm !text-slate-900 font-bold bg-white"
                  value={form.paymentMethodId}
                  onChange={(e) => set("paymentMethodId", e.target.value)}
                >
                  <option value="">Method</option>
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                  <option value="online">Online</option>
                </select>
              </div>

              {(form.paymentMethodId === "bank" ||
                form.paymentMethodId === "online") && (
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">
                    Target Account *
                  </label>
                  <select
                    className="input-field !py-1.5 !text-sm !text-slate-900 font-bold bg-white"
                    value={form.accountId}
                    onChange={(e) => set("accountId", e.target.value)}
                  >
                    <option value="">Select Account</option>
                    {accounts?.map((acc: any) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">
                  Receipt No. *
                </label>
                <input
                  type="text"
                  className="input-field !py-1.5 !text-sm !text-slate-900 font-bold bg-white"
                  placeholder="Manual ID"
                  value={form.receiptNo}
                  onChange={(e) => set("receiptNo", e.target.value)}
                />
              </div>

              {(form.paymentMethodId === "bank" ||
                form.paymentMethodId === "online") && (
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">
                    Sender Name *
                  </label>
                  <input
                    type="text"
                    className="input-field !py-1.5 !text-sm !text-slate-900 font-bold bg-white"
                    placeholder="Transferred by..."
                    value={form.senderName}
                    onChange={(e) => set("senderName", e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
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
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending}
            className="px-6 py-2.5 flex-1 md:flex-none justify-center rounded-xl font-black text-white bg-brand-blue hover:bg-opacity-90 transition-colors uppercase tracking-widest text-[11px] flex items-center gap-2 shadow-lg shadow-brand-blue/30"
          >
            {mutation.isPending ? "Processing..." : "Enroll Student (Enter)"}
            <Save className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Modal>
  );
}
