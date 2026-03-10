"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/api/client";
import { cn, formatDateTime, formatCurrency } from "@/lib/utils";
import { exportToPDF } from "@/lib/report-utils";
import {
  ChevronLeft,
  Printer,
  Download,
  FileText,
  CreditCard,
  User,
  Calendar,
  Wallet,
  Landmark,
} from "lucide-react";
import Link from "next/link";

export default function StudentLedgerPage() {
  const { id } = useParams();
  const router = useRouter();
  const studentId = Number(id);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["student-ledger", studentId, from, to],
    queryFn: () =>
      reportsApi.studentLedger(studentId, from || undefined, to || undefined),
    enabled: !!studentId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-black uppercase tracking-widest text-xs">
            Auditing records...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto bg-white p-12 rounded-3xl shadow-sm border border-slate-100 text-center">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
            Ledger Not Found
          </h2>
          <p className="text-slate-500 mt-2 mb-8 font-medium">
            We couldn't retrieve the financial records for the requested
            student.
          </p>
          <button onClick={() => router.back()} className="btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { student, logs = [], totalPaid, totalRemaining } = data;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 animate-fade-in print:bg-white print:p-0">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-400 hover:text-brand-blue font-black uppercase text-[10px] tracking-widest transition-colors group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                <Calendar className="w-3 h-3 text-slate-400" />
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="bg-transparent border-none text-[10px] font-black uppercase outline-none text-slate-600 focus:text-brand-blue transition-colors"
                />
              </div>
              <span className="text-[10px] font-black text-slate-300">TO</span>
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                <Calendar className="w-3 h-3 text-slate-400" />
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="bg-transparent border-none text-[10px] font-black uppercase outline-none text-slate-600 focus:text-brand-blue transition-colors"
                />
              </div>
              {(from || to) && (
                <button
                  onClick={() => {
                    setFrom("");
                    setTo("");
                  }}
                  className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:text-red-600 transition-colors ml-1"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                exportToPDF({
                  title: "STUDENT FINANCIAL LEDGER",
                  filename: `Ledger_${student?.registrationNo || studentId}`,
                  columns: ["Date", "Receipt", "Method", "Account", "Amount"],
                  data: logs.map((l: any) => [
                    formatDateTime(l.date),
                    l.receiptNo || "N/A",
                    l.method,
                    l.account || "Cash",
                    formatCurrency(l.amount),
                  ]),
                  summary: [
                    { label: "Student", value: student?.name || "N/A" },
                    {
                      label: "Reg No",
                      value: student?.registrationNo || "N/A",
                    },
                    {
                      label: "Department",
                      value: student?.department?.name || "N/A",
                    },
                    {
                      label: "Total Paid",
                      value: `PKR ${formatCurrency(totalPaid)}`,
                    },
                    {
                      label: "Remaining",
                      value: `PKR ${formatCurrency(totalRemaining)}`,
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
            Official Student Financial Ledger
          </p>
          <div className="flex justify-between items-end pt-4">
            <div className="text-left space-y-1">
              <p className="text-[10px] font-black uppercase text-slate-400">
                Student Name
              </p>
              <p className="text-lg font-black uppercase">{student?.name}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[10px] font-black uppercase text-slate-400">
                Registration No
              </p>
              <p className="text-lg font-black uppercase">
                {student?.registrationNo}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="card-premium p-6 md:p-8 overflow-hidden relative print:border-none print:shadow-none print:p-0 print:mb-8">
          <div className="absolute top-0 right-0 p-8 opacity-5 print:hidden">
            <FileText className="w-48 h-48 rotate-12" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start justify-between">
            <div className="flex gap-6 items-center">
              <div className="w-20 h-20 rounded-3xl bg-brand-blue/5 flex items-center justify-center text-brand-blue border border-brand-blue/10">
                <User className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
                  {student?.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                    {student?.registrationNo || "N/A"}
                  </span>
                  <span className="text-xs font-black text-brand-blue bg-brand-blue/5 px-3 py-1 rounded-lg border border-brand-blue/10 uppercase italic">
                    {student?.department?.code || student?.department?.name}
                  </span>
                  <span className="text-xs font-bold text-slate-500 uppercase">
                    • {student?.programMode} Mode
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
              <div className="p-4 bg-green-50 rounded-2xl border border-green-100 min-w-[160px]">
                <p className="text-[10px] font-black text-green-700 uppercase tracking-widest opacity-60">
                  Total Paid
                </p>
                <p className="text-xl font-black text-green-700 mt-1">
                  PKR {formatCurrency(totalPaid)}
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-2xl border border-red-100 min-w-[160px]">
                <p className="text-[10px] font-black text-red-700 uppercase tracking-widest opacity-60">
                  Total Remaining
                </p>
                <p className="text-xl font-black text-red-700 mt-1">
                  PKR {formatCurrency(totalRemaining)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Transaction Log */}
            <div className="card-premium overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-brand-blue" />
                  Transaction History
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Ref / Method</th>
                      <th className="px-6 py-4">Account</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-12 text-center text-slate-400 font-medium italic"
                        >
                          No transactions found for this student.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log: any, idx: number) => (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-6 py-5">
                            <p className="text-sm font-black text-slate-800">
                              {formatDateTime(log.date)}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                              Term: {log.semester || student?.currentSemester}
                            </p>
                          </td>
                          <td className="px-6 py-5">
                            <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest">
                              {log.receiptNo || "N/A"}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              {log.methodType === "bank" ? (
                                <Landmark className="w-3 h-3 text-slate-400" />
                              ) : log.methodType === "online" ? (
                                <Wallet className="w-3 h-3 text-slate-400" />
                              ) : (
                                <CreditCard className="w-3 h-3 text-slate-400" />
                              )}
                              <span className="text-[10px] font-bold text-slate-500 uppercase">
                                {log.method}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                              {log.account || "Direct Cash"}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <p className="text-sm font-black text-green-600">
                              + PKR {formatCurrency(log.amount)}
                            </p>
                            {log.notes && (
                              <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 truncate max-w-[150px] ml-auto">
                                {log.notes}
                              </p>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Student Info Sidebar */}
            <div className="card-premium p-6">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-6 border-b border-slate-100 pb-4">
                Academic Progress
              </h3>
              <div className="space-y-4">
                <InfoRow
                  label="Status"
                  value={student?.status}
                  badge
                  badgeColor={student?.status === "active" ? "green" : "blue"}
                />
                <InfoRow label="Roll Number" value={student?.rollNo || "N/A"} />
                <InfoRow
                  label="Current Sem"
                  value={student?.currentSemester || "N/A"}
                />
                <InfoRow
                  label="Session"
                  value={student?.session?.label || "N/A"}
                />
                <div className="pt-4 mt-4 border-t border-slate-50">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    Performance
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                        Marks
                      </p>
                      <p className="text-sm font-black text-slate-700 mt-1">
                        {student?.obtainedMarks ?? 0} /{" "}
                        {student?.totalMarks ?? 0}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                        CGPA / SGPA
                      </p>
                      <p className="text-sm font-black text-slate-700 mt-1">
                        {student?.cgpa ?? 0} / {student?.sgpa ?? 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Print Footer */}
            <div className="hidden print:block text-slate-400 text-[10px] font-bold text-center italic mt-12 pt-8 border-t border-slate-100">
              Generated on {formatDateTime(new Date())} • Stars Law College
              Management System
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  badge = false,
  badgeColor = "slate",
}: {
  label: string;
  value: string | number;
  badge?: boolean;
  badgeColor?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
        {label}
      </span>
      {badge ? (
        <span
          className={cn(
            "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest",
            badgeColor === "green"
              ? "bg-green-100 text-green-700"
              : badgeColor === "blue"
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-600",
          )}
        >
          {value}
        </span>
      ) : (
        <span className="text-xs font-black text-slate-700 uppercase">
          {value}
        </span>
      )}
    </div>
  );
}
