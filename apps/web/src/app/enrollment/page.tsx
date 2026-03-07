"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  departmentsApi,
  sessionsApi,
  accountsApi,
  studentsApi,
} from "@/lib/api/client";
import { clsx } from "clsx";
import { Save, UserPlus, Search, UserCheck, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function EnrollmentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<"new" | "existing">("new");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExistingId, setSelectedExistingId] = useState<number | null>(
    null,
  );

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
    marksType: "marks", // 'marks' | 'cgpa'
    obtainedMarks: "",
    totalMarks: "",
    sgpa: "",
    cgpa: "",
    initialFeeAmount: "", // Sem/Annual Fee
    advancePaid: "",
    paymentMethodId: "", // 'Cash' | 'Bank' | 'Online'
    accountId: "",
    receiptNo: "",
    senderName: "",
    paymentDate: new Date().toISOString().split("T")[0],
  });

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  // Fetch Data
  const { data: depts } = useQuery({
    queryKey: ["departments"],
    queryFn: departmentsApi.list,
  });
  const { data: allSessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => sessionsApi.list(),
  });
  const { data: accountsRaw } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => accountsApi.accounts(),
  });

  // Accounts logic
  const accounts = (accountsRaw as any)?.data || accountsRaw || [];

  // Search Existing Students
  const { data: searchResults } = useQuery({
    queryKey: ["students-search", searchQuery],
    queryFn: () => studentsApi.list({ q: searchQuery, limit: 10 }),
    enabled: mode === "existing" && searchQuery.length > 2,
  });

  // Calculate / Reset logic
  const selectedDept = depts?.find(
    (d: any) => d.id === Number(form.departmentId),
  );
  const filteredSessions =
    allSessions?.filter(
      (s: any) => s.departmentId === Number(form.departmentId),
    ) || [];

  // Handlers
  useEffect(() => {
    if (selectedDept && mode === "new") {
      const pMode = selectedDept.offersSem ? "semester" : "annual";
      set("programMode", pMode);

      // Auto-prefill fee
      if (selectedDept.feeStructures?.length) {
        const activeFee = selectedDept.feeStructures.find(
          (f: any) => f.programMode === pMode,
        );
        if (activeFee) set("initialFeeAmount", activeFee.feeAmount.toString());
      } else {
        set("initialFeeAmount", "");
      }
    }
  }, [form.departmentId, selectedDept, mode]);

  const selectExistingStudent = (student: any) => {
    setSelectedExistingId(student.id);
    setSearchQuery(`${student.name} - ${student.rollNo || "No Roll"}`);
    setForm({
      ...form,
      name: student.name,
      parentGuardian: student.parentGuardian,
      cnic: student.cnic,
      registrationNo: student.registrationNo,
      rollNo: student.rollNo || "",
      departmentId: student.departmentId.toString(),
      sessionId: student.sessionId?.toString() || "",
      programMode: student.programMode,
      currentSemester: student.currentSemester?.toString() || "",
      obtainedMarks: student.obtainedMarks?.toString() || "",
      totalMarks: student.totalMarks?.toString() || "",
      sgpa: student.sgpa?.toString() || "",
      cgpa: student.cgpa?.toString() || "",
      marksType: student.cgpa ? "cgpa" : "marks",
    });
  };

  const advanceVal = Number(form.advancePaid) || 0;
  const initialFeeVal = Number(form.initialFeeAmount) || 0;
  const remainingCalculated = Math.max(0, initialFeeVal - advanceVal);

  const modeButtonRef = useRef<HTMLButtonElement>(null);

  const mutation = useMutation({
    mutationFn: (data: any) => {
      // Clean up empty fields
      const payload = { ...data };
      if (payload.marksType === "cgpa") {
        delete payload.obtainedMarks;
        delete payload.totalMarks;
      } else {
        delete payload.sgpa;
        delete payload.cgpa;
      }
      delete payload.marksType;

      // Convert numbers
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

      // Clean up empty string fields that would cause 400 errors
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

      if (mode === "existing" && selectedExistingId) {
        return studentsApi.update(selectedExistingId, payload);
      }
      return studentsApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      // Reset form on success but keep mode active to enter next
      setForm({
        ...form,
        name: "",
        parentGuardian: "",
        cnic: "",
        registrationNo: "",
        rollNo: "",
        obtainedMarks: "",
        totalMarks: "",
        sgpa: "",
        cgpa: "",
        advancePaid: "",
        receiptNo: "",
        senderName: "",
      });
      setSelectedExistingId(null);
      setSearchQuery("");
      // Focus the mode switcher
      if (modeButtonRef.current) {
        modeButtonRef.current.focus();
      }
    },
  });

  // Global Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      const target = e.target as HTMLElement;
      if (target.tagName !== "INPUT" && target.tagName !== "SELECT") return;

      e.preventDefault();
      const formContainer = target.closest("#enrollment-form-container");
      if (!formContainer) return;

      // Only consider inputs, selects, and the submit button (data-submit)
      const focusable = Array.from(
        formContainer.querySelectorAll(
          "input:not([disabled]), select:not([disabled])",
        ),
      ) as HTMLElement[];

      const index = focusable.indexOf(target);
      if (index > -1 && index < focusable.length - 1) {
        focusable[index + 1].focus();
      } else {
        // Last input field — click the submit button
        const submitBtn = formContainer.querySelector(
          "[data-submit]",
        ) as HTMLElement;
        if (submitBtn) submitBtn.click();
      }
    }
  };

  const handleModeToggleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      setMode(mode === "new" ? "existing" : "new");
      setSelectedExistingId(null);
      setSearchQuery("");
    }
  };

  return (
    <div
      id="enrollment-form-container"
      onKeyDown={handleKeyDown}
      className="space-y-4 max-w-5xl mx-auto pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-gold" />
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-brand-blue" />
            Student Enrollment
          </h1>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Register or update a student&apos;s academic & financial record.
            (Use Arrows & Enter to navigate)
          </p>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex gap-3">
        <button
          ref={modeButtonRef}
          onKeyDown={handleModeToggleKey}
          onClick={() => {
            setMode("new");
            setSelectedExistingId(null);
            setSearchQuery("");
          }}
          className={clsx(
            "flex-1 py-2.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-sm border-2 focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue focus:outline-none",
            mode === "new"
              ? "bg-brand-blue text-white border-brand-blue shadow-brand-blue/20"
              : "bg-white text-slate-400 border-transparent hover:border-slate-200",
          )}
        >
          <UserPlus className="w-4 h-4 mx-auto mb-1" />
          New Student
        </button>
        <button
          onKeyDown={handleModeToggleKey}
          onClick={() => setMode("existing")}
          className={clsx(
            "flex-1 py-2.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-sm border-2 focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold focus:outline-none",
            mode === "existing"
              ? "bg-brand-gold text-white border-brand-gold shadow-brand-gold/20"
              : "bg-white text-slate-400 border-transparent hover:border-slate-200",
          )}
        >
          <UserCheck className="w-4 h-4 mx-auto mb-1" />
          Existing Student
        </button>
      </div>

      {mode === "existing" && (
        <div className="bg-white p-4 rounded-xl shadow-sm border-2 border-brand-gold/20 relative z-50">
          <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1.5">
            Search Student *
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Search by Name, Roll No., Reg No. or CNIC..."
              className="input-field !pl-9 !py-2 !text-sm !text-slate-900 font-bold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery &&
              searchResults?.data?.length > 0 &&
              !selectedExistingId && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-xl shadow-xl border border-slate-100 max-h-48 overflow-y-auto z-50">
                  {searchResults.data.map((student: any) => (
                    <div
                      key={student.id}
                      onClick={() => selectExistingStudent(student)}
                      className="p-2 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                    >
                      <div className="font-bold text-sm text-brand-blue">
                        {student.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                        Roll No: {student.rollNo || "N/A"} • Reg:{" "}
                        {student.registrationNo} • Dep:{" "}
                        {student.department?.code}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>
      )}

      {/* Main Form Fields */}
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
              autoFocus={mode === "new"}
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
        <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-start gap-2 border border-red-100 font-bold text-xs shadow-sm animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            {(mutation.error as any)?.response?.data?.message ||
              String(mutation.error)}
          </p>
        </div>
      )}

      {/* Footer Action */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={() => router.back()}
          className="px-5 py-2.5 rounded-xl font-black text-slate-500 hover:bg-slate-100 transition-colors uppercase tracking-widest text-[11px]"
        >
          Cancel
        </button>
        <button
          onClick={() => mutation.mutate(form)}
          disabled={mutation.isPending}
          data-submit
          className="px-6 py-2.5 flex-1 md:flex-none justify-center rounded-xl font-black text-white bg-brand-blue hover:bg-opacity-90 transition-colors uppercase tracking-widest text-[11px] flex items-center gap-2 shadow-lg shadow-brand-blue/30"
        >
          {mutation.isPending
            ? "Processing..."
            : mode === "new"
              ? "Enroll Student (Enter)"
              : "Update Student (Enter)"}
          <Save className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
