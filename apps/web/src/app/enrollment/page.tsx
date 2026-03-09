"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  departmentsApi,
  sessionsApi,
  accountsApi,
  studentsApi,
} from "@/lib/api/client";
import { clsx } from "clsx";
import {
  Save,
  UserPlus,
  Search,
  UserCheck,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { showBar, hideBar } from "@/lib/progress";
import { formatContact, formatCNIC } from "@/lib/utils";

export default function EnrollmentPage() {
  const queryClient = useQueryClient();

  const defaultForm = {
    name: "",
    parentGuardian: "",
    cnic: "",
    contact: "92 ",
    registrationNo: "",
    rollNo: "",
    departmentId: "",
    sessionId: "",
    programMode: "semester",
    currentSemester: "",
    enrolledAt: "",
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
    receiverName: "",
    paymentDate: new Date().toISOString().split("T")[0],
    totalOutstanding: "",
  };

  const searchParams = useSearchParams();
  const routerEnroll = useRouter();
  const initialMode = (
    searchParams.get("tab") === "existing" ? "existing" : "new"
  ) as "new" | "existing";
  const [mode, setModeState] = useState<"new" | "existing">(initialMode);
  const setMode = (m: "new" | "existing") => {
    setModeState(m);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", m);
    routerEnroll.replace(`?${params.toString()}`, { scroll: false });
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExistingId, setSelectedExistingId] = useState<number | null>(
    null,
  );
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const [form, setForm] = useState({ ...defaultForm });
  const fullNameRef = useRef<HTMLInputElement>(null);

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
  const { data: paymentMethods } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: () => accountsApi.paymentMethods(),
  });

  // Accounts logic
  const accounts = (accountsRaw as any)?.data || accountsRaw || [];

  // Search Existing Students
  const { data: searchResults } = useQuery({
    queryKey: ["students-search", searchQuery],
    queryFn: () => studentsApi.list({ q: searchQuery || undefined, limit: 50 }),
    enabled: mode === "existing",
  });

  const studentIdParam = searchParams.get("studentId");
  const { data: directStudent } = useQuery({
    queryKey: ["student-direct", studentIdParam],
    queryFn: () => studentsApi.get(Number(studentIdParam!)),
    enabled: !!studentIdParam && !selectedExistingId,
  });

  useEffect(() => {
    if (directStudent && !selectedExistingId) {
      selectExistingStudent(directStudent);
    }
  }, [directStudent]);

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

    const currentFinance = student.financeRecords?.find(
      (f: any) => !f.isSnapshot,
    );
    const totalOutstanding =
      student.financeRecords
        ?.filter((f: any) => !f.isSnapshot)
        .reduce((s: number, f: any) => s + parseFloat(f.remaining), 0) ?? 0;

    const hasGpa = student.cgpa || student.sgpa;
    const hasMarks = student.obtainedMarks || student.totalMarks;

    setForm({
      ...form,
      name: student.name,
      parentGuardian: student.parentGuardian,
      cnic: student.cnic,
      contact: student.contact || "92 ",
      registrationNo: student.registrationNo,
      rollNo: student.rollNo || "",
      departmentId: student.departmentId.toString(),
      sessionId: student.sessionId?.toString() || "",
      programMode: student.programMode,
      currentSemester: student.currentSemester?.toString() || "",
      enrolledAt: student.enrolledAt ? student.enrolledAt.split("T")[0] : "",
      obtainedMarks: student.obtainedMarks?.toString() || "",
      totalMarks: student.totalMarks?.toString() || "",
      sgpa: student.sgpa?.toString() || "",
      cgpa: student.cgpa?.toString() || "",
      marksType: hasGpa && hasMarks ? "both" : hasGpa ? "cgpa" : "marks",
      initialFeeAmount: currentFinance?.feeDue?.toString() || "",
      advancePaid: "",
      totalOutstanding: totalOutstanding.toString(),
    });
    toast.info(
      `Selected ${student.name}. Current Arrears: PKR ${totalOutstanding.toLocaleString()}`,
    );
  };

  const advanceVal = Number(form.advancePaid) || 0;
  const initialFeeVal = Number(form.initialFeeAmount) || 0;
  const totalOutstandingVal = Number(form.totalOutstanding) || 0;
  const remainingCalculated = mode === "existing" && totalOutstandingVal > 0
    ? Math.max(0, totalOutstandingVal - advanceVal)
    : Math.max(0, initialFeeVal - advanceVal);

  const modeButtonRef = useRef<HTMLButtonElement>(null);

  const mutation = useMutation({
    mutationFn: (data: any) => {
      // Validate marks/GPA based on marksType
      if (data.marksType === "marks") {
        if (!data.obtainedMarks || !data.totalMarks) {
          throw new Error("Both Obtained Marks and Total Marks are required when Marks is selected");
        }
      } else if (data.marksType === "cgpa") {
        if (!data.sgpa || !data.cgpa) {
          throw new Error("Both SGPA and CGPA are required when CGPA is selected");
        }
      } else if (data.marksType === "both") {
        if (!data.obtainedMarks || !data.totalMarks || !data.sgpa || !data.cgpa) {
          throw new Error("All fields (Obtained Marks, Total Marks, SGPA, and CGPA) are required when Both is selected");
        }
      }

      // Clean up empty fields
      const payload = { ...data };
      
      // Handle marks/GPA based on marksType
      if (payload.marksType === "cgpa") {
        payload.obtainedMarks = null;
        payload.totalMarks = null;
      } else if (payload.marksType === "marks") {
        payload.sgpa = null;
        payload.cgpa = null;
      } else if (payload.marksType === "both") {
        // Keep all fields, but set empty ones to null
        if (!payload.obtainedMarks) payload.obtainedMarks = null;
        if (!payload.totalMarks) payload.totalMarks = null;
        if (!payload.sgpa) payload.sgpa = null;
        if (!payload.cgpa) payload.cgpa = null;
      }
      delete payload.marksType;

      // Map empty strings to undefined to satisfy backend DTO
      const toNum = (val: any) => (val === "" ? undefined : Number(val));

      if (payload.departmentId)
        payload.departmentId = toNum(payload.departmentId);
      if (payload.sessionId) payload.sessionId = toNum(payload.sessionId);
      if (payload.currentSemester)
        payload.currentSemester = toNum(payload.currentSemester);
      if (payload.obtainedMarks)
        payload.obtainedMarks = Number(payload.obtainedMarks);
      if (payload.totalMarks) payload.totalMarks = Number(payload.totalMarks);
      if (payload.sgpa) payload.sgpa = Number(payload.sgpa);
      if (payload.cgpa) payload.cgpa = Number(payload.cgpa);
      if (payload.accountId) payload.accountId = toNum(payload.accountId);

      // Clean CNIC formatting
      if (payload.cnic) {
        payload.cnic = payload.cnic.replace(/\D/g, "");
      }

      // Clean contact formatting
      if (payload.contact) {
        payload.contact = payload.contact.replace(/\D/g, "");
      }

      // Clean up empty string fields that would cause 400 errors
      if (!payload.advancePaid || payload.advancePaid === "0") {
        delete payload.advancePaid;
        // If no payment, also delete payment-related fields
        delete payload.paymentMethodId;
        delete payload.receiptNo;
        delete payload.senderName;
        delete payload.accountId;
        delete payload.paymentDate;
      } else {
        payload.advancePaid = payload.advancePaid.toString(); // API expects string for decimal sometimes, but here it's fine as is
        // If there's payment, paymentMethodId is required
        if (payload.paymentMethodId && paymentMethods) {
          const methodType = payload.paymentMethodId;
          const method = paymentMethods.find((m: any) => m.type === methodType);
          if (method) {
            payload.paymentMethodId = method.id;
          } else {
            const err = `Payment method '${methodType}' not found. Please refresh.`;
            toast.error(err);
            throw new Error(err);
          }
        }
      }

      // Final cleanup
      Object.keys(payload).forEach((key) => {
        if (payload[key] === "") delete payload[key];
      });

      console.log("Submitting enrollment payload:", payload);
      if (mode === "existing" && selectedExistingId) {
        return studentsApi.update(selectedExistingId, payload);
      }
      return studentsApi.create(payload);
    },
    onSuccess: (data) => {
      console.log("Enrollment successful:", data);
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success(
        mode === "new"
          ? "Student enrolled successfully!"
          : "Student updated successfully!",
      );
      // Reset ALL fields
      setForm({ ...defaultForm });
      setSelectedExistingId(null);
      setSearchQuery("");

      // Focus back to first field
      setTimeout(() => {
        fullNameRef.current?.focus();
      }, 100);
    },
    onError: (error: any) => {
      console.error("Enrollment error:", error);
      toast.error(error.message || "Failed to process enrollment");
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
      className="space-y-2 max-w-[1800px] mx-auto pb-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      {/* Header + Mode Switcher in one row */}
      <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-brand-gold" />
        <UserPlus className="w-5 h-5 text-brand-blue shrink-0" />
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-black text-slate-900 leading-tight">
            Student Enrollment
          </h1>
          <p className="text-[9px] font-bold text-slate-400 tracking-wide">
            Arrows &amp; Enter to navigate
          </p>
        </div>
        <div className="flex bg-slate-100 p-0.5 rounded-lg">
          <button
            ref={modeButtonRef}
            onKeyDown={handleModeToggleKey}
            onClick={() => {
              setMode("new");
              setSelectedExistingId(null);
              setSearchQuery("");
            }}
            className={clsx(
              "px-4 py-1.5 text-[9px] font-black uppercase rounded-md transition-all flex items-center gap-1.5",
              mode === "new"
                ? "bg-brand-blue text-white shadow-sm"
                : "text-slate-400 hover:text-slate-600",
            )}
          >
            <UserPlus className="w-3 h-3" /> New
          </button>
          <button
            onKeyDown={handleModeToggleKey}
            onClick={() => setMode("existing")}
            className={clsx(
              "px-4 py-1.5 text-[9px] font-black uppercase rounded-md transition-all flex items-center gap-1.5",
              mode === "existing"
                ? "bg-brand-gold text-white shadow-sm"
                : "text-slate-400 hover:text-slate-600",
            )}
          >
            <UserCheck className="w-3 h-3" /> Existing
          </button>
        </div>
      </div>

      {/* Search for Existing */}
      {mode === "existing" && (
        <div className="bg-white px-4 py-2.5 rounded-xl shadow-sm border-2 border-brand-gold/20 relative z-50">
          <div className="relative">
            <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-400" />
            <input
              autoFocus
              placeholder="Search Name, Roll No, Reg No, CNIC..."
              className="input-field !pl-9 !py-1.5 !text-sm !text-slate-900 font-bold"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setHighlightedIndex(-1);
              }}
              onKeyDown={(e) => {
                const results = searchResults?.data || [];
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setHighlightedIndex((prev) =>
                    prev < results.length - 1 ? prev + 1 : prev,
                  );
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                } else if (e.key === "Enter" && highlightedIndex >= 0) {
                  e.preventDefault();
                  selectExistingStudent(results[highlightedIndex]);
                  setHighlightedIndex(-1);
                }
              }}
            />
            {searchResults?.data?.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto z-50">
                {searchResults.data.map((student: any, index: number) => (
                  <div
                    key={student.id}
                    onClick={() => {
                      selectExistingStudent(student);
                      setHighlightedIndex(-1);
                    }}
                    className={clsx(
                      "p-2 cursor-pointer border-b border-slate-50 last:border-0 transition-colors",
                      highlightedIndex === index
                        ? "bg-brand-blue/10"
                        : "hover:bg-slate-50",
                    )}
                  >
                    <div className="font-bold text-xs text-brand-blue">
                      {student.name}
                    </div>
                    <div className="text-[9px] text-slate-500 font-bold">
                      Roll: {student.rollNo || "N/A"} • Reg:{" "}
                      {student.registrationNo} • {student.department?.code}
                    </div>
                    <div className="text-[9px] text-slate-400 font-bold mt-0.5">
                      {formatContact(student.contact)} • {formatCNIC(student.cnic)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Form Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden relative z-40">
        {/* ── Personal Details ── */}
        <div className="px-4 py-1.5 bg-slate-50/50 border-b border-slate-100">
          <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
            Personal Details
          </h2>
        </div>
        <div className="px-4 py-2.5 grid grid-cols-2 md:grid-cols-8 gap-x-3 gap-y-2">
          <div className="md:col-span-2">
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
              Full Name *
            </label>
            <input
              ref={fullNameRef}
              autoFocus={mode === "new"}
              className="input-field !py-1 !text-sm !text-slate-900 font-bold"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
              Parent / Guardian *
            </label>
            <input
              className="input-field !py-1 !text-sm !text-slate-900 font-bold"
              value={form.parentGuardian}
              onChange={(e) => set("parentGuardian", e.target.value)}
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
              Contact
            </label>
            <input
              className="input-field !py-1 !text-sm !text-slate-900 font-bold"
              maxLength={14}
              placeholder="WhatsApp Preferred"
              value={form.contact}
              onChange={(e) => {
                let val = e.target.value;
                if (!val.startsWith("92 ")) {
                  val = "92 " + val.replace(/^92\s*/, "");
                }
                const digits = val.substring(3).replace(/\D/g, "");
                if (digits.length <= 10) {
                  let formatted = "92 ";
                  if (digits.length > 0) {
                    formatted += digits.substring(0, 3);
                    if (digits.length > 3) {
                      formatted += " " + digits.substring(3, 10);
                    }
                  }
                  set("contact", formatted);
                }
              }}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
              CNIC *
            </label>
            <input
              className="input-field !py-1 !text-sm !text-slate-900 font-bold"
              maxLength={15}
              placeholder="00000-0000000-0"
              value={form.cnic}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                let formatted = "";
                if (digits.length > 0) {
                  formatted = digits.substring(0, 5);
                  if (digits.length > 5) {
                    formatted += "-" + digits.substring(5, 12);
                    if (digits.length > 12) {
                      formatted += "-" + digits.substring(12, 13);
                    }
                  }
                }
                set("cnic", formatted);
              }}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
              Reg No *
            </label>
            <input
              className="input-field !py-1 !text-sm !text-slate-900 font-bold"
              value={form.registrationNo}
              onChange={(e) => set("registrationNo", e.target.value)}
            />
          </div>
        </div>

        {/* ── Academic Details ── */}
        <div className="px-4 py-1.5 bg-slate-50/50 border-y border-slate-100 flex justify-between items-center">
          <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
            Academic Details
          </h2>
          <div className="flex bg-slate-200 p-0.5 rounded-md w-36">
            <button
              type="button"
              onClick={() => set("marksType", "marks")}
              className={clsx(
                "flex-1 py-0.5 text-[8px] font-black uppercase rounded transition-all",
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
                "flex-1 py-0.5 text-[8px] font-black uppercase rounded transition-all",
                form.marksType === "cgpa"
                  ? "bg-white text-brand-blue shadow-sm"
                  : "text-slate-400",
              )}
            >
              CGPA
            </button>
            <button
              type="button"
              onClick={() => set("marksType", "both")}
              className={clsx(
                "flex-1 py-0.5 text-[8px] font-black uppercase rounded transition-all",
                form.marksType === "both"
                  ? "bg-white text-brand-blue shadow-sm"
                  : "text-slate-400",
              )}
            >
              Both
            </button>
          </div>
        </div>
        <div className="px-4 py-2.5 grid grid-cols-2 md:grid-cols-12 gap-x-3 gap-y-2 items-end">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
              Department *
            </label>
            <select
              className="input-field !py-1.5 !text-sm !text-slate-900 font-bold bg-white"
              value={form.departmentId}
              onChange={(e) => set("departmentId", e.target.value)}
            >
              <option value="">Select</option>
              {depts?.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
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
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
              {form.programMode === "semester" ? "Current Sem" : "Current Year"}{" "}
              *
            </label>
            <input
              type="number"
              min="1"
              className="input-field !py-1.5 !text-sm !text-slate-900 font-bold"
              value={form.currentSemester}
              onChange={(e) => set("currentSemester", e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
              Roll No
            </label>
            <input
              className="input-field !py-1.5 !text-sm !text-slate-900 font-bold"
              value={form.rollNo}
              onChange={(e) => set("rollNo", e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
              Enrollment Date
            </label>
            <input
              type="date"
              className="input-field !py-1.5 !text-sm !text-slate-900 font-bold bg-white"
              value={form.enrolledAt || ""}
              onChange={(e) => set("enrolledAt", e.target.value)}
            />
          </div>
          {(form.marksType === "marks" || form.marksType === "both") && (
            <>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
                  Obt. Marks
                </label>
                <input
                  type="number"
                  className="input-field !py-1.5 !text-sm !text-slate-900 font-bold"
                  value={form.obtainedMarks}
                  onChange={(e) => set("obtainedMarks", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
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
          )}
          {(form.marksType === "cgpa" || form.marksType === "both") && (
            <>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
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
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
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

        {/* ── Fee & Payment ── */}
        <div className="px-4 py-1.5 bg-slate-50/50 border-y border-slate-100">
          <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
            Fee & Payment
          </h2>
        </div>
        <div className="px-4 py-2.5 grid grid-cols-2 md:grid-cols-7 gap-x-3 gap-y-2">
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
              {form.programMode === "semester" ? "Sem Fee" : "Annual Fee"}
            </label>
            <input
              type="number"
              className="input-field !py-1 !text-sm !text-slate-900 font-bold border-brand-blue/20"
              placeholder="Auto"
              value={form.initialFeeAmount}
              onChange={(e) => set("initialFeeAmount", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[9px] font-black text-brand-gold uppercase tracking-widest mb-0.5">
              Paid Now
            </label>
            <input
              type="number"
              className="input-field !py-1 !text-sm !text-brand-blue font-bold border-brand-gold/50 focus:border-brand-gold"
              placeholder="0"
              max={initialFeeVal}
              value={form.advancePaid}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val <= initialFeeVal) {
                  set("advancePaid", e.target.value);
                }
              }}
            />
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
              Payment Date
            </label>
            <input
              type="date"
              className="input-field !py-1 !text-sm !text-slate-900 font-bold bg-white"
              value={form.paymentDate}
              onChange={(e) => set("paymentDate", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[9px] font-black text-green-600 uppercase tracking-widest mb-0.5">
              Already Paid
            </label>
            <div className="input-field !py-1 bg-green-50 !text-green-600 font-black text-sm cursor-not-allowed">
              Rs. {advanceVal.toLocaleString()}
            </div>
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
              Remaining
            </label>
            <div className="input-field !py-1 bg-slate-50 !text-slate-500 font-black text-sm cursor-not-allowed">
              Rs. {remainingCalculated.toLocaleString()}
            </div>
          </div>
          {Number(form.advancePaid) > 0 && (
            <>
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
                  Method *
                </label>
                <select
                  className="input-field !py-1 !text-sm !text-slate-900 font-bold bg-white"
                  value={form.paymentMethodId}
                  onChange={(e) => set("paymentMethodId", e.target.value)}
                >
                  <option value="">Method</option>
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                  <option value="online">Online</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
                  Receipt No *
                </label>
                <input
                  className="input-field !py-1 !text-sm !text-slate-900 font-bold"
                  placeholder="ID"
                  value={form.receiptNo}
                  onChange={(e) => set("receiptNo", e.target.value)}
                />
              </div>
            </>
          )}
        </div>
        {Number(form.advancePaid) > 0 &&
          (form.paymentMethodId === "bank" ||
            form.paymentMethodId === "online") && (
            <div className="mx-4 mb-3 p-2.5 grid grid-cols-2 md:grid-cols-4 gap-3 bg-brand-gold/5 rounded-lg border border-brand-gold/20 animate-in fade-in duration-300">
              <div className="md:col-span-2">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
                  Target Account *
                </label>
                <select
                  className="input-field !py-1 !text-sm !text-slate-900 font-bold bg-white"
                  value={form.accountId}
                  onChange={(e) => set("accountId", e.target.value)}
                >
                  <option value="">Select Account</option>
                  {accounts
                    ?.filter((acc: any) => {
                      const methodType = form.paymentMethodId;
                      return (
                        acc.paymentMethod?.type === methodType ||
                        acc.paymentMethodId === methodType
                      );
                    })
                    .map((acc: any) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.label}{" "}
                        {acc.accountNumber ? `(${acc.accountNumber})` : ""}
                      </option>
                    ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
                  Sender Name *
                </label>
                <input
                  className="input-field !py-1 !text-sm !text-slate-900 font-bold"
                  placeholder="Transferred by..."
                  value={form.senderName}
                  onChange={(e) => set("senderName", e.target.value)}
                />
              </div>
            </div>
          )}
        {Number(form.advancePaid) > 0 && form.paymentMethodId === "cash" && (
          <div className="mx-4 mb-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200 animate-in fade-in duration-300">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
                Receiver Name *
              </label>
              <input
                className="input-field !py-1 !text-sm !text-slate-900 font-bold"
                placeholder="Received by..."
                value={form.receiverName}
                onChange={(e) => set("receiverName", e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {mutation.error && (
        <div className="bg-red-50 text-red-600 p-2.5 rounded-lg flex items-start gap-2 border border-red-100 font-bold text-xs shadow-sm animate-in fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <p>
            {(mutation.error as any)?.response?.data?.message ||
              String(mutation.error)}
          </p>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex justify-end gap-3 pt-1">
        <button
          onClick={() => {
            showBar();
            setForm({ ...defaultForm });
            setSelectedExistingId(null);
            setSearchQuery("");
            mutation.reset();
            setTimeout(hideBar, 400);
          }}
          className="px-4 py-2 rounded-xl font-black text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors uppercase tracking-widest text-[10px] flex items-center gap-1.5"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
        <button
          onClick={() => {
            showBar();
            mutation.mutate(form);
          }}
          disabled={mutation.isPending}
          data-submit
          className="px-6 py-2 flex-1 md:flex-none justify-center rounded-xl font-black text-white bg-brand-blue hover:bg-opacity-90 transition-colors uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-lg shadow-brand-blue/30"
        >
          {mutation.isPending
            ? "Processing..."
            : mode === "new"
              ? "Enroll (Enter)"
              : "Update (Enter)"}
          <Save className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
